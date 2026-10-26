export type Sound = 'swing' | 'hit' | 'kill' | 'spell' | 'level' | 'card' | 'rare' | 'boss' | 'hurt' | 'victory' | 'death' | 'pickup' | 'dodge';

/** Small synthesized sound bank. No network assets, autoplay, or persistent oscillators. */
export class AudioSystem {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private last: Partial<Record<Sound, number>> = {};
  enabled = true;
  unlock() {
    try {
      if (!this.context) {
        const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtor) return;
        this.context = new AudioCtor();
        this.master = this.context.createGain();
        this.master.gain.value = 0.16;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { /* Audio is optional on restricted browsers. */ }
  }
  play(sound: Sound) {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== 'running' || !this.master) return;
    if (ctx.currentTime - (this.last[sound] ?? -10) < (sound === 'pickup' ? 0.11 : 0.045)) return;
    this.last[sound] = ctx.currentTime;
    const bank: Record<Sound, [number, number, number, OscillatorType]> = {
      swing: [170, 60, 0.10, 'triangle'], hit: [100, 35, 0.10, 'square'], kill: [210, 55, 0.14, 'triangle'],
      spell: [280, 880, 0.3, 'sine'], level: [440, 1100, 0.5, 'sine'], card: [540, 980, 0.5, 'triangle'],
      rare: [660, 1320, 0.65, 'sine'], boss: [110, 42, 1.2, 'sawtooth'], hurt: [140, 45, 0.2, 'sawtooth'],
      victory: [440, 1760, 1.5, 'triangle'], death: [210, 28, 1.1, 'sine'], pickup: [880, 1400, 0.09, 'sine'], dodge: [200, 500, 0.12, 'triangle'],
    };
    const [from, to, duration, type] = bank[sound];
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(sound === 'hit' ? 0.28 : 0.5, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    oscillator.connect(gain); gain.connect(this.master);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(); oscillator.stop(ctx.currentTime + duration + 0.02);
  }
  destroy() {
    if (this.context) void this.context.close().catch(() => {});
    this.context = null; this.master = null;
  }
}
