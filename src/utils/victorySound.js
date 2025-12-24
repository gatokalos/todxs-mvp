export function playVictoryXSound(ctx) {
  if (!ctx) return;
  const now = ctx.currentTime;

  const makeNoiseClap = (time, gainValue, duration, freq, q) => {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let pink = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      pink = 0.97 * pink + 0.03 * white;
      data[i] = pink;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(freq, time);
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainValue, time + duration * 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start(time);
    source.stop(time + duration);
  };

  makeNoiseClap(now, 0.2, 0.34, 900, 0.7);
  makeNoiseClap(now + 0.08, 0.18, 0.32, 1200, 0.9);
  makeNoiseClap(now + 0.16, 0.16, 0.3, 1500, 1.1);
  makeNoiseClap(now + 0.26, 0.14, 0.34, 1000, 0.8);
  makeNoiseClap(now + 0.36, 0.12, 0.32, 1350, 1);
  makeNoiseClap(now + 0.48, 0.1, 0.28, 1100, 0.9);
}
