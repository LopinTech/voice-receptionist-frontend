import WebSocket from '/home/robin/projects/voice-assistant/backend/node_modules/.pnpm/ws@8.21.3/node_modules/ws/index.js';
import fs from 'node:fs';
const t = await (await fetch('http://127.0.0.1:9222/json/new?http://localhost:3100/signup', { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl);
let id = 0; const pending = new Map(); const net = []; const errs = [];
ws.on('message', (r) => { const m = JSON.parse(r);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method === 'Network.responseReceived' && /voices/.test(m.params.response.url)) net.push(m.params.response.status + ' ' + m.params.response.url.replace('http://localhost:8000',''));
  else if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text).slice(0,140)); });
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await new Promise((r) => ws.on('open', r));
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.result.value;
await sleep(5000);
const setVal = `(el, v) => { const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }`;
const click = async (txt) => ev(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === ${JSON.stringify(txt)}); if (!b) return 'missing'; b.click(); return 'ok'; })()`);
await ev(`(() => { const f = ${setVal}; const i = document.querySelectorAll('input'); f(i[0], 'probe@example.test'); f(i[1], 'correct-horse-battery'); })()`);
await click('Continue'); await sleep(400);
await ev(`(() => { const f = ${setVal}; f(document.querySelectorAll('input')[0], 'Apex Plumbing'); })()`);
await click('Continue'); await sleep(400);
await ev(`(() => { const f = ${setVal}; f(document.querySelector('input[type=tel]'), '5552348900'); })()`);
await click('Continue'); await sleep(900);   // areas (optional)
await click('Continue'); await sleep(600);   // services
await ev(`(() => { const f = ${setVal}; const i = [...document.querySelectorAll('input')].filter(x => x.placeholder === 'Service name'); f(i[0], 'Drain cleaning'); })()`);
await click('Continue'); await sleep(600);   // hours
await click('Continue'); await sleep(2500);  // voice
console.log('heading:', await ev(`document.querySelector('h1')?.textContent`));
console.log('languages:', await ev(`[...document.querySelectorAll('select option')].map(o => o.textContent)`));
console.log('voices:', await ev(`[...document.querySelectorAll('button')].map(b=>b.textContent.trim()).filter(t => /·\\s*(Female|Male)$/.test(t))`));
// play the first sample
await ev(`(() => { const b = [...document.querySelectorAll('button')].find(x => (x.getAttribute('aria-label')||'').startsWith('Play the')); b && b.click(); })()`);
await sleep(4000);
console.log('status line:', await ev(`(() => { const t = document.body.innerText.match(/Playing sample…|Tap play to hear [^\\n]*|Could not play[^\\n]*/); return t ? t[0] : ''; })()`));
console.log('audio playing:', await ev(`document.querySelectorAll('audio').length + ' audio els'`));
const h = await ev('document.documentElement.scrollHeight');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: Math.min(h + 20, 2400), deviceScaleFactor: 1, mobile: false });
await sleep(500);
const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
fs.writeFileSync('voice-step.png', Buffer.from(shot.result.data, 'base64'));
console.log('network:', net);
console.log('errors:', errs.slice(0, 3));
ws.close();
