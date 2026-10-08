// Centralized Audible Alarm Service for Medication & Doctor Appointment Reminders
// Uses both HTMLAudioElement (with synthesized PCM WAV data URI) and Web Audio API fallback

type AlarmListener = (isPlaying: boolean, isBlocked: boolean) => void;

class AlarmService {
  private audioElement: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private synthInterval: any = null;
  private playing: boolean = false;
  private blocked: boolean = false;
  private unlocked: boolean = false;
  private listeners: Set<AlarmListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
      this.setupGlobalAutoUnlock();
    }
  }

  /**
   * Generates a 1.5-second 16-bit PCM WAV data URI containing a clear medical two-tone alarm pattern:
   * Beep 1 (880 Hz) -> pause -> Beep 2 (660 Hz) -> pause -> Beep 3 (880 Hz) -> rest
   */
  private generateMedicalAlarmWavDataUri(): string {
    const sampleRate = 22050;
    const durationSeconds = 1.5;
    const numSamples = Math.floor(sampleRate * durationSeconds);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    // RIFF WAV Header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // PCM chunk size
    view.setUint16(20, 1, true); // PCM format
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      // Pulse 1: 0.00s - 0.18s (880 Hz A5)
      if (t >= 0.0 && t < 0.18) {
        const env = Math.min(1, t / 0.015, (0.18 - t) / 0.02);
        sample = Math.sin(2 * Math.PI * 880 * t) * 0.55 * env;
      }
      // Pulse 2: 0.24s - 0.42s (660 Hz E5)
      else if (t >= 0.24 && t < 0.42) {
        const env = Math.min(1, (t - 0.24) / 0.015, (0.42 - t) / 0.02);
        sample = Math.sin(2 * Math.PI * 660 * t) * 0.55 * env;
      }
      // Pulse 3: 0.48s - 0.72s (880 Hz A5)
      else if (t >= 0.48 && t < 0.72) {
        const env = Math.min(1, (t - 0.48) / 0.015, (0.72 - t) / 0.03);
        sample = Math.sin(2 * Math.PI * 880 * t) * 0.6 * env;
      }

      const pcmValue = Math.max(-1, Math.min(1, sample));
      view.setInt16(44 + i * 2, pcmValue < 0 ? pcmValue * 0x8000 : pcmValue * 0x7fff, true);
    }

    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + window.btoa(binary);
  }

  private initAudioElement(): void {
    try {
      const wavUri = this.generateMedicalAlarmWavDataUri();
      this.audioElement = new Audio(wavUri);
      this.audioElement.loop = true;
      this.audioElement.preload = 'auto';
      this.audioElement.volume = 0.85;
    } catch (err) {
      console.warn('Could not initialize HTMLAudioElement for alarm:', err);
    }
  }

  private getOrCreateAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    return this.audioCtx;
  }

  private setupGlobalAutoUnlock(): void {
    const unlockHandler = () => {
      this.unlockAudio();
    };

    window.addEventListener('pointerdown', unlockHandler, { once: true, passive: true });
    window.addEventListener('keydown', unlockHandler, { once: true, passive: true });
    window.addEventListener('touchstart', unlockHandler, { once: true, passive: true });
  }

  /**
   * Unlocks browser audio playback during user interaction so alarms never fail due to autoplay policies.
   */
  public unlockAudio(): void {
    if (this.unlocked) return;
    try {
      const ctx = this.getOrCreateAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (this.audioElement && !this.playing) {
        const prevMuted = this.audioElement.muted;
        this.audioElement.muted = true;
        const playPromise = this.audioElement.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (this.audioElement && !this.playing) {
                this.audioElement.pause();
                this.audioElement.currentTime = 0;
              }
              if (this.audioElement) {
                this.audioElement.muted = prevMuted;
              }
              this.unlocked = true;
            })
            .catch(() => {
              if (this.audioElement) {
                this.audioElement.muted = prevMuted;
              }
            });
        }
      } else {
        this.unlocked = true;
      }
    } catch {
      // Ignore unlock errors
    }
  }

  private playWebAudioPulse(): void {
    try {
      const ctx = this.getOrCreateAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;
      const playTone = (freq: number, startOffset: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + startOffset);

        gain.gain.setValueAtTime(0.001, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.25, now + startOffset + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration + 0.02);
      };

      playTone(880, 0.0, 0.18);
      playTone(660, 0.24, 0.18);
      playTone(880, 0.48, 0.24);
    } catch (err) {
      console.warn('Web Audio pulse fallback error:', err);
    }
  }

  /**
   * Starts playing a continuous audible medical alarm sound.
   * Ensures no duplicate or overlapping alarm instances run simultaneously.
   */
  public async startAlarm(): Promise<boolean> {
    // Always stop any existing alarm first to prevent overlapping instances
    this.stopAlarm();

    this.playing = true;
    this.blocked = false;
    this.notifyListeners();

    // Ensure AudioContext is resumed if possible
    const ctx = this.getOrCreateAudioContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Ignore
      }
    }

    // Primary: Play continuous looping HTMLAudioElement with synthesized WAV
    if (this.audioElement) {
      try {
        this.audioElement.muted = false;
        this.audioElement.currentTime = 0;
        this.audioElement.loop = true;
        await this.audioElement.play();
        this.unlocked = true;
        this.blocked = false;
        this.notifyListeners();
        return true;
      } catch (err: any) {
        console.warn('HTMLAudioElement alarm play warning, trying Web Audio API:', err);
        if (err?.name === 'NotAllowedError') {
          this.blocked = true;
          this.notifyListeners();
        }
      }
    }

    // Fallback: Web Audio API repeating oscillator chime
    if (ctx) {
      this.playWebAudioPulse();
      this.synthInterval = setInterval(() => {
        if (this.playing) {
          this.playWebAudioPulse();
        }
      }, 1500);

      if (ctx.state === 'running') {
        this.blocked = false;
        this.notifyListeners();
        return true;
      } else {
        this.blocked = true;
        this.notifyListeners();
        return false;
      }
    }

    return false;
  }

  /**
   * Stops the active alarm sound and resets audio state cleanly.
   */
  public stopAlarm(): void {
    this.playing = false;
    this.blocked = false;

    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }

    if (this.audioElement) {
      try {
        this.audioElement.pause();
        this.audioElement.currentTime = 0;
      } catch (err) {
        console.warn('Error stopping alarm audio element:', err);
      }
    }

    this.notifyListeners();
  }

  public isAlarmPlaying(): boolean {
    return this.playing;
  }

  public isAudioBlocked(): boolean {
    return this.blocked;
  }

  public subscribe(listener: AlarmListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.playing, this.blocked);
      } catch {
        // Ignore listener error
      }
    });
  }
}

export const alarmService = new AlarmService();
