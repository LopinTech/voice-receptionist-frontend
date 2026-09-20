'use client';

import React, { useEffect, useRef } from 'react';
import type { AgentState } from '@telnyx/ai-agent-lib';

interface VoiceVisualizerProps {
  /** The assistant's audio. */
  remoteStream: MediaStream | null;
  /** The caller's microphone. */
  localStream: MediaStream | null;
  activity: AgentState;
}

const BAR_COUNT = 5;
/** Per-frame smoothing: high enough to look alive, low enough not to jitter. */
const SMOOTHING = 0.35;
/** Bars never fully collapse, so the thing still reads as "listening". */
const MIN_SCALE = 0.12;

/**
 * Drives the bars from the real audio rather than a canned animation, so
 * what you see is what the assistant is actually hearing and saying — the
 * whole point of a test call is that it is not a simulation.
 *
 * Everything is written straight to the DOM from a rAF loop: at 60fps this
 * would otherwise be 60 React renders a second for a purely visual effect.
 */
export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({
  remoteStream,
  localStream,
  activity,
}) => {
  const barsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const haloRef = useRef<HTMLDivElement>(null);
  const activityRef = useRef<AgentState>(activity);

  // Kept in a ref so a state change does not tear down and rebuild the audio
  // graph mid-sentence.
  useEffect(() => {
    activityRef.current = activity;
  }, [activity]);

  useEffect(() => {
    if (!remoteStream && !localStream) return;

    type AudioContextCtor = new () => AudioContext;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioContextCtor })
        .webkitAudioContext;
    if (!Ctor) return;

    const context = new Ctor();
    const levels = new Array<number>(BAR_COUNT).fill(0);

    const analyse = (stream: MediaStream | null) => {
      if (!stream || stream.getAudioTracks().length === 0) return null;
      try {
        const analyser = context.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.6;
        context.createMediaStreamSource(stream).connect(analyser);
        return analyser;
      } catch {
        // A stream can end between render and here; a missing visualiser is
        // not worth breaking the call over.
        return null;
      }
    };

    if (context.state === 'suspended') void context.resume();

    const remote = analyse(remoteStream);
    const local = analyse(localStream);
    const bins = new Uint8Array(64);

    let frame = 0;

    const tick = () => {
      frame = requestAnimationFrame(tick);

      // Whoever holds the floor drives the bars: the assistant while it is
      // speaking, the caller's microphone the rest of the time.
      const source = activityRef.current === 'speaking' ? remote : local;

      // Sampled once per frame, not once per bar: five reads of the same
      // buffer would be four wasted copies and could straddle an update.
      if (source) source.getByteFrequencyData(bins);
      const width = Math.floor(bins.length / BAR_COUNT);

      let overall = 0;

      for (let i = 0; i < BAR_COUNT; i += 1) {
        let target = 0;

        if (source) {
          let sum = 0;
          for (let j = i * width; j < (i + 1) * width; j += 1) sum += bins[j];
          target = sum / width / 255;
        }

        levels[i] += (target - levels[i]) * SMOOTHING;
        overall += levels[i];

        const bar = barsRef.current[i];
        if (bar) {
          // Middle bars react hardest, which reads as a voice rather than a
          // flat equaliser.
          const weight = 1 - Math.abs(i - (BAR_COUNT - 1) / 2) / BAR_COUNT;
          bar.style.transform = `scaleY(${
            MIN_SCALE + Math.min(1, levels[i] * 2.4 * weight) * (1 - MIN_SCALE)
          })`;
        }
      }

      if (haloRef.current) {
        const level = Math.min(1, (overall / BAR_COUNT) * 2.4);
        haloRef.current.style.transform = `scale(${1 + level * 0.35})`;
        haloRef.current.style.opacity = `${0.15 + level * 0.4}`;
      }
    };

    tick();

    return () => {
      cancelAnimationFrame(frame);
      void context.close();
    };
  }, [remoteStream, localStream]);

  const isSpeaking = activity === 'speaking';
  const isThinking = activity === 'thinking';

  const tone = isSpeaking
    ? 'bg-emerald-500'
    : isThinking
      ? 'bg-amber-400'
      : 'bg-blue-500';

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-5">
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Halo, scaled from the overall level. */}
        <div
          ref={haloRef}
          aria-hidden
          className={`absolute inset-0 rounded-full ${tone} opacity-15 transition-colors duration-300`}
          style={{ transform: 'scale(1)' }}
        />

        <div className="relative w-20 h-20 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center gap-1">
          {/*
            The bars stay mounted in every state — swapping them for an icon
            while the assistant thinks would drop the refs the animation loop
            holds and restart it mid-call. With no audio to measure they
            simply settle, which reads as thinking on its own.
          */}
          {Array.from({ length: BAR_COUNT }).map((_, index) => (
            <span
              key={index}
              ref={(element) => {
                barsRef.current[index] = element;
              }}
              className={`w-1.5 h-9 rounded-full origin-center ${tone} transition-colors duration-300`}
              style={{ transform: `scaleY(${MIN_SCALE})` }}
            />
          ))}
        </div>
      </div>

      <p
        className="text-xs font-bold text-slate-600 dark:text-slate-300"
        aria-live="polite"
      >
        {isSpeaking
          ? 'Assistant is speaking'
          : isThinking
            ? 'Assistant is thinking…'
            : 'Listening — go ahead and talk'}
      </p>
    </div>
  );
};
