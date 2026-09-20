'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  Mic,
  PhoneCall,
  PhoneOff,
  X,
} from 'lucide-react';
import type { AgentState, TelnyxAIAgent } from '@telnyx/ai-agent-lib';
import { TenantConfig } from '@/types/schema';
import { VoiceVisualizer } from './VoiceVisualizer';

interface TestCallModalProps {
  tenant: TenantConfig;
  onClose: () => void;
  onGoToSetup: () => void;
}

type CallState = 'idle' | 'connecting' | 'live' | 'ended' | 'error';

/** Long enough for a slow network, short enough not to spin forever. */
const CONNECT_TIMEOUT_MS = 15000;

/** The SDK's LOGIN_FAILED; the server refused the anonymous session. */
const LOGIN_FAILED_CODE = 46001;

/**
 * "Authentication failed" is the SDK's wording for a login the Telnyx server
 * refused, and on its own it sends people hunting through their own code.
 * When the assistant is configured correctly, that refusal is an account
 * entitlement — the same class of block that stops number purchase on an
 * unverified account — so say that instead of the raw message.
 */
function describeError(error: unknown): string {
  if (error && typeof error === 'object') {
    const { code, message } = error as { code?: number; message?: string };
    const isLoginFailure =
      code === LOGIN_FAILED_CODE ||
      /login incorrect|authentication failed/i.test(message ?? '');

    if (isLoginFailure) {
      return 'Telnyx refused the browser call session. Your assistant is configured for web calls, so this is an account-level restriction — Telnyx support needs to enable unauthenticated web calls (this usually needs account verification first).';
    }

    if (message) return message;
  }

  return 'Could not reach your assistant.';
}

/**
 * Resolves once the agent session is registered and can actually place a
 * call. Listeners are attached before `connect()` is called, so a fast
 * connection cannot land before anyone is listening for it.
 */
function waitForConnected(agent: TelnyxAIAgent): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = (settle: () => void) => {
      clearTimeout(timer);
      agent.off('agent.connected', onConnected);
      agent.off('agent.error', onError);
      settle();
    };

    const onConnected = () => done(resolve);
    const onError = (error: unknown) =>
      done(() => reject(new Error(describeError(error))));

    const timer = setTimeout(
      () =>
        done(() =>
          reject(
            new Error(
              'Timed out connecting to your assistant. Check your network and try again.',
            ),
          ),
        ),
      CONNECT_TIMEOUT_MS,
    );

    agent.on('agent.connected', onConnected);
    agent.on('agent.error', onError);
  });
}

/**
 * A real conversation with the tenant's own Telnyx assistant, over WebRTC
 * from the browser.
 *
 * This replaced a scripted mock that matched keywords with `setTimeout`
 * delays — it looked like a test call and proved nothing. The library
 * authenticates with the assistant id alone, so no Telnyx API key reaches
 * the browser, there is no per-call telephony charge, and it does not depend
 * on the phone number purchase that account verification is still blocking.
 *
 * Nothing from the call is transcribed, shown as text, or stored — the
 * visualiser is driven straight from the live audio.
 *
 * Rendered only while open, so closing unmounts it: the call is hung up by
 * the cleanup below and every piece of call state resets on the next open,
 * with no reset logic to keep in step.
 */
export const TestCallModal: React.FC<TestCallModalProps> = ({
  tenant,
  onClose,
  onGoToSetup,
}) => {
  const [callState, setCallState] = useState<CallState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<AgentState>('listening');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const agentRef = useRef<TelnyxAIAgent | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const endCall = useCallback(async () => {
    const agent = agentRef.current;
    agentRef.current = null;

    if (agent) {
      try {
        await agent.endConversation();
      } catch {
        // Already gone — nothing to hang up.
      }
      await agent.disconnect().catch(() => undefined);
    }

    if (audioRef.current) audioRef.current.srcObject = null;
    setRemoteStream(null);
    setLocalStream(null);
  }, []);

  // Closing the modal must hang up: a live microphone left running after
  // the owner has moved on keeps recording them.
  useEffect(() => () => void endCall(), [endCall]);

  const startCall = async () => {
    setError(null);
    setCallState('connecting');

    try {
      // Asked for explicitly so a denied microphone produces a clear message
      // here rather than a connection that silently never carries audio. The
      // tracks are stopped straight away — the SDK opens its own, and leaving
      // these live would hold the microphone (and its indicator) open for the
      // whole session.
      const probe = await navigator.mediaDevices.getUserMedia({ audio: true });
      probe.getTracks().forEach((track) => track.stop());
    } catch {
      setCallState('error');
      setError(
        'Your browser blocked microphone access. Allow the microphone for this site, then start the call again.',
      );
      return;
    }

    try {
      // Imported here rather than at module scope: the library reaches for
      // browser APIs on load, and it is a large dependency that nothing but
      // this modal needs.
      const { TelnyxAIAgent } = await import('@telnyx/ai-agent-lib');

      const agent = new TelnyxAIAgent({ agentId: tenant.assistantId });
      agentRef.current = agent;

      // The event carries latency metadata alongside the state itself.
      agent.on('conversation.agent.state', (data) => setActivity(data.state));
      agent.on('conversation.update', (notification) => {
        const call = notification?.call;

        if (call?.remoteStream) {
          // The <audio> element plays it; the visualiser only measures it.
          if (audioRef.current) audioRef.current.srcObject = call.remoteStream;
          setRemoteStream(call.remoteStream);
        }
        if (call?.localStream) setLocalStream(call.localStream);
        if (call?.state === 'active') setCallState('live');
      });
      agent.on('agent.error', (agentError: unknown) => {
        setCallState('error');
        setError(describeError(agentError));
      });

      // `connect()` resolves as soon as the WebSocket opens, which is well
      // before the session has logged in and registered — starting the
      // conversation there fails with "Cannot start AI agent conversation
      // before login is complete." `agent.connected` is the real gate: the
      // library emits it on client-ready, once a session id exists.
      const ready = waitForConnected(agent);
      await agent.connect();
      await ready;

      await agent.startConversation({ callerName: 'Profile test call' });
      setCallState('live');
    } catch (startError) {
      setCallState('error');
      setError(describeError(startError));
      await endCall();
    }
  };

  const hangUp = async () => {
    await endCall();
    setCallState('ended');
  };

  const hasAssistant = tenant.assistantId.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-500" />
              <span>Test Call</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Speak to your own assistant, exactly as a caller would.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {!hasAssistant ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-start gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Your assistant has not been created yet, so there is nothing
                  to call. Finish setup and it will appear here.
                </span>
              </div>
              <button
                type="button"
                onClick={onGoToSetup}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer"
              >
                Go to phone setup
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {callState === 'idle' && (
                <div className="text-center py-6 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                    <Mic className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Your browser will ask for the microphone. Talk to the
                    assistant the way a customer would — nothing from this call
                    is saved.
                  </p>
                </div>
              )}

              {callState === 'connecting' && (
                <div className="text-center py-8 space-y-2">
                  <Loader2 className="w-6 h-6 mx-auto animate-spin text-emerald-500" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Connecting to your assistant…
                  </p>
                </div>
              )}

              {callState === 'live' && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Live
                    </span>
                  </div>

                  <VoiceVisualizer
                    remoteStream={remoteStream}
                    localStream={localStream}
                    activity={activity}
                  />
                </div>
              )}

              {callState === 'ended' && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-2">
                  Call ended. Nothing from it was recorded or saved.
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {hasAssistant && (
          <div className="p-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            {callState === 'live' || callState === 'connecting' ? (
              <button
                type="button"
                onClick={() => void hangUp()}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4" />
                <span>End call</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startCall()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <PhoneCall className="w-4 h-4" />
                <span>
                  {callState === 'ended' || callState === 'error'
                    ? 'Call again'
                    : 'Start test call'}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Assistant audio. Hidden: the controls belong to the buttons above. */}
        <audio ref={audioRef} autoPlay playsInline className="hidden" />
      </div>
    </div>
  );
};
