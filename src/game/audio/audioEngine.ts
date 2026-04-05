export class AudioEngine {
  private ctx: AudioContext | null = null;
  private sirenOsc: OscillatorNode | null = null;
  private sirenLfo: OscillatorNode | null = null;
  private frightenedOsc: OscillatorNode | null = null;
  private frightenedLfo: OscillatorNode | null = null;
  private _enabled = true;
  private _sirenActive = false;
  private _frightenedActive = false;

  get enabled(): boolean {
    return this._enabled;
  }

  set enabled(v: boolean) {
    this._enabled = v;
    if (!v) {
      this._stopSirenNodes();
      this._stopFrightenedNodes();
    } else if (this.ctx) {
      if (this._sirenActive) this._startSirenNodes();
      if (this._frightenedActive) this._startFrightenedNodes();
    }
  }

  init(): void {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    document.addEventListener('visibilitychange', this._handleVisibility);
    if (this._sirenActive && this._enabled) this._startSirenNodes();
    if (this._frightenedActive && this._enabled) this._startFrightenedNodes();
  }

  private _handleVisibility = (): void => {
    if (!this.ctx) return;
    if (document.hidden) {
      this.ctx.suspend();
    } else {
      this.ctx.resume();
    }
  };

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.3,
    startOffset = 0,
  ): void {
    if (!this.ctx || !this._enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    const t = this.ctx.currentTime + startOffset;
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  }

  playBlip(): void {
    this.playTone(880, 0.04);
  }

  playPowerPill(): void {
    if (!this.ctx || !this._enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playGhostEaten(): void {
    if (!this.ctx || !this._enabled) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playDeath(): void {
    if (!this.ctx || !this._enabled) return;
    // Descending chromatic scale: 12 semitone steps over ~1 s
    const steps = 12;
    const stepDur = 1.0 / steps;
    for (let i = 0; i < steps; i++) {
      const freq = 600 * Math.pow(2, -i / 12);
      this.playTone(freq, stepDur * 0.9, 'square', 0.25, i * stepDur);
    }
  }

  playLevelComplete(): void {
    if (!this.ctx || !this._enabled) return;
    // Ascending C-major arpeggio over ~1.5 s
    const notes = [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5, 1318.51];
    const stepDur = 1.5 / notes.length;
    notes.forEach((freq, i) => {
      this.playTone(freq, stepDur * 0.8, 'square', 0.25, i * stepDur);
    });
  }

  private _startSirenNodes(): void {
    if (!this.ctx) return;
    this._stopSirenNodes();

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    lfo.type = 'sine';
    lfo.frequency.value = 3; // 3 Hz waver
    lfoGain.gain.value = 20; // ±20 Hz pitch wobble

    osc.type = 'square';
    osc.frequency.value = 440;
    gain.gain.value = 0.03;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start();
    osc.start();

    this.sirenOsc = osc;
    this.sirenLfo = lfo;
  }

  private _stopSirenNodes(): void {
    try { this.sirenOsc?.stop(); } catch { /* already stopped */ }
    try { this.sirenLfo?.stop(); } catch { /* already stopped */ }
    this.sirenOsc = null;
    this.sirenLfo = null;
  }

  private _startFrightenedNodes(): void {
    if (!this.ctx) return;
    this._stopFrightenedNodes();

    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    lfo.type = 'sine';
    lfo.frequency.value = 8; // faster pulse
    lfoGain.gain.value = 30;

    osc.type = 'square';
    osc.frequency.value = 180;
    gain.gain.value = 0.04;

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start();
    osc.start();

    this.frightenedOsc = osc;
    this.frightenedLfo = lfo;
  }

  private _stopFrightenedNodes(): void {
    try { this.frightenedOsc?.stop(); } catch { /* already stopped */ }
    try { this.frightenedLfo?.stop(); } catch { /* already stopped */ }
    this.frightenedOsc = null;
    this.frightenedLfo = null;
  }

  startSiren(): void {
    if (this._sirenActive) return;
    this._sirenActive = true;
    if (this.ctx && this._enabled) this._startSirenNodes();
  }

  stopSiren(): void {
    if (!this._sirenActive) return;
    this._sirenActive = false;
    this._stopSirenNodes();
  }

  startFrightened(): void {
    if (this._frightenedActive) return;
    this._frightenedActive = true;
    if (this.ctx && this._enabled) this._startFrightenedNodes();
  }

  stopFrightened(): void {
    if (!this._frightenedActive) return;
    this._frightenedActive = false;
    this._stopFrightenedNodes();
  }

  destroy(): void {
    this._stopSirenNodes();
    this._stopFrightenedNodes();
    document.removeEventListener('visibilitychange', this._handleVisibility);
    this.ctx?.close();
    this.ctx = null;
  }
}
