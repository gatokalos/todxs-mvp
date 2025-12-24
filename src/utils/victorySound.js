export function playVictoryXSound(ctx) {
  if (!ctx) return;
  const now = ctx.currentTime;

  const duration = 8.6;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let pink = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    pink = 0.97 * pink + 0.03 * white;
    data[i] = pink * 0.7;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.setValueAtTime(160, now);

  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(1600, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.35);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(hp).connect(lp).connect(gain).connect(ctx.destination);
  source.start(now);
  source.stop(now + duration);
}
