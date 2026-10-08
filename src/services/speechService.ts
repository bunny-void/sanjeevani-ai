// Enhanced Web Speech API + MediaRecorder & Backend Gemini STT Fallback Service
// Ensures reliable real microphone capture, speech detection, transcription, and TTS playback.

import { buildApiUrl } from './apiConfig';

export type VoicePipelineState =
  | 'READY'
  | 'CONNECTING'
  | 'LISTENING'
  | 'SPEECH_DETECTED'
  | 'TRANSCRIBING'
  | 'THINKING'
  | 'SPEAKING'
  | 'ERROR';

export type ActiveVoicePath = 'browser_speech_recognition' | 'backend_gemini_stt' | 'none';

export interface SpeechRecognitionResultHandler {
  (text: string, isFinal: boolean): void;
}

export interface StartListeningOptions {
  onStateChange?: (state: VoicePipelineState) => void;
  onFallbackNotice?: (notice: string) => void;
}

const FRIENDLY_FALLBACK_MESSAGE = 'Voice input is using an alternate speech service.';
const PERMISSION_DENIED_MESSAGE = 'Microphone access is required for voice input.';

class SpeechService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  // Timers
  private watchdogTimer: any = null;
  private speakingPollTimer: any = null;
  private silenceFinalizeTimer: any = null;
  private restartTimer: any = null;
  private noSpeechTimeoutTimer: any = null;
  private fallbackSpeechTimer: any = null;
  private audioLevelInterval: any = null;

  // Real Microphone Stream & Audio Recording (getUserMedia + AudioContext + MediaRecorder)
  private activeMediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: BlobPart[] = [];
  private recordingMimeType: string = 'audio/webm';
  private recordingStartTime: number = 0;

  // Public State Flags
  public pipelineState: VoicePipelineState = 'READY';
  public isListening: boolean = false;
  public isHearingSpeech: boolean = false;
  public isTranscribing: boolean = false;
  public isSpeakingActive: boolean = false;
  public isSupported: boolean = false;
  public isBrowserRecognitionSupported: boolean = false;
  public isMediaRecorderSupported: boolean = false;
  public isTTSSupported: boolean = false;
  public isPermissionDenied: boolean = false;
  public isNoMicrophoneDevice: boolean = false;
  public hasPermissionGranted: boolean = false;
  public isUsingFallbackService: boolean = false;
  public activeVoicePath: ActiveVoicePath = 'none';
  public fallbackNotice: string | null = null;
  public lastTtsError: string | null = null;
  public lastMicError: string | null = null;

  // Internal Session Tracking
  private currentLanguage: string = 'en-US';
  private currentLanguageLabel: 'English' | 'Telugu' = 'English';
  private onResultCallback: SpeechRecognitionResultHandler | null = null;
  private onErrorCallback: ((err: string) => void) | null = null;
  private onEndCallback: (() => void) | null = null;
  private onSpeechDetectedCallback: (() => void) | null = null;
  private onStateChangeCallback: ((state: VoicePipelineState) => void) | null = null;
  private onFallbackNoticeCallback: ((notice: string) => void) | null = null;

  private shouldKeepListening: boolean = false;
  private latestCapturedTranscript: string = '';
  private hasFinalizedCurrentTurn: boolean = false;
  private hasDetectedAcousticSpeech: boolean = false;
  private acousticSpeechStartTime: number = 0;
  private lastAcousticSpeechTime: number = 0;
  private consecutiveSpeechFrames: number = 0;
  private recognitionRestartCount: number = 0;
  private networkErrorCount: number = 0;
  private preferBackendFallback: boolean = false;
  private sessionToken: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.isBrowserRecognitionSupported = true;
      }

      if (
        typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.getUserMedia === 'function' &&
        typeof window.MediaRecorder !== 'undefined'
      ) {
        this.isMediaRecorderSupported = true;
      }

      // Voice input is supported if EITHER browser SpeechRecognition OR getUserMedia+MediaRecorder backend fallback is available
      this.isSupported = this.isBrowserRecognitionSupported || this.isMediaRecorderSupported;

      if (!this.isBrowserRecognitionSupported && this.isMediaRecorderSupported) {
        this.preferBackendFallback = true;
        this.isUsingFallbackService = true;
        this.activeVoicePath = 'backend_gemini_stt';
      } else if (this.isBrowserRecognitionSupported) {
        this.activeVoicePath = 'browser_speech_recognition';
      }

      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        this.isTTSSupported = true;
        this.loadVoices();
        if (typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
          window.speechSynthesis.onvoiceschanged = () => {
            this.loadVoices();
          };
        }
      }

      // Monitor microphone hardware changes (plug/unplug)
      if (
        typeof navigator !== 'undefined' &&
        navigator.mediaDevices &&
        typeof navigator.mediaDevices.addEventListener === 'function'
      ) {
        navigator.mediaDevices.addEventListener('devicechange', () => {
          this.handleMediaDeviceChange();
        });
      }
    }
  }

  private setPipelineState(nextState: VoicePipelineState): void {
    this.pipelineState = nextState;
    if (this.onStateChangeCallback) {
      try {
        this.onStateChangeCallback(nextState);
      } catch (e) {
        console.warn('onStateChange callback error:', e);
      }
    }
  }

  private handleMediaDeviceChange(): void {
    if (!this.activeMediaStream) return;
    const tracks = this.activeMediaStream.getAudioTracks();
    const hasLiveTrack = tracks.some((t) => t.readyState === 'live' && t.enabled);
    if (!hasLiveTrack && (this.isListening || this.shouldKeepListening)) {
      this.releaseMicrophoneStream();
      this.isListening = false;
      this.isHearingSpeech = false;
      this.lastMicError =
        'Microphone device was disconnected. Please check your microphone and try again.';
      this.setPipelineState('ERROR');
      if (this.onErrorCallback) {
        this.onErrorCallback(this.lastMicError);
      }
    }
  }

  private loadVoices(): void {
    if (!this.synthesis) return;
    const voices = this.synthesis.getVoices();
    if (voices && voices.length > 0) {
      this.cachedVoices = voices;
    }
  }

  /**
   * Call directly inside a user click/tap handler to unlock browser audio/SpeechSynthesis and AudioContext.
   */
  public warmupAudio(): void {
    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }
      }
    } catch {
      // Ignore AudioContext warmup errors
    }

    if (!this.synthesis || !this.isTTSSupported) return;
    try {
      this.loadVoices();
      if (this.synthesis.paused) {
        this.synthesis.resume();
      }
    } catch (e) {
      console.warn('TTS warmup warning:', e);
    }
  }

  /**
   * Verifies whether an existing MediaStream has at least one active, live audio track.
   */
  private isStreamActiveAndLive(stream: MediaStream | null): boolean {
    if (!stream) return false;
    const audioTracks = stream.getAudioTracks();
    if (!audioTracks || audioTracks.length === 0) return false;
    return audioTracks.some((track) => track.readyState === 'live' && track.enabled);
  }

  /**
   * Releases all microphone hardware tracks, MediaRecorder, and AudioContext analyser nodes.
   * Ensures no microphone stream is ever left running after a conversation or turn ends.
   */
  public releaseMicrophoneStream(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    if (this.mediaRecorder) {
      const rec = this.mediaRecorder;
      this.mediaRecorder = null;
      try {
        rec.ondataavailable = null;
        rec.onerror = null;
        rec.onstop = null;
        if (rec.state !== 'inactive') {
          rec.stop();
        }
      } catch {
        // Ignore recorder cleanup errors
      }
    }

    if (this.mediaStreamSource) {
      try {
        this.mediaStreamSource.disconnect();
      } catch {
        // Ignore disconnect error
      }
      this.mediaStreamSource = null;
    }

    if (this.analyserNode) {
      try {
        this.analyserNode.disconnect();
      } catch {
        // Ignore disconnect error
      }
      this.analyserNode = null;
    }

    if (this.activeMediaStream) {
      const stream = this.activeMediaStream;
      this.activeMediaStream = null;
      try {
        stream.getTracks().forEach((track) => {
          track.onended = null;
          track.stop();
        });
      } catch (e) {
        console.warn('Error stopping media stream tracks:', e);
      }
    }
  }

  /**
   * Requests microphone permission via getUserMedia and verifies an active live audio track.
   * Never opens duplicate streams simultaneously.
   */
  public async requestMicrophonePermission(forceRetry: boolean = false): Promise<boolean> {
    this.lastMicError = null;
    this.isNoMicrophoneDevice = false;

    if (this.isPermissionDenied && !forceRetry) {
      this.lastMicError = PERMISSION_DENIED_MESSAGE;
      return false;
    }

    // If we already have an active live stream, permission and hardware are verified
    if (this.isStreamActiveAndLive(this.activeMediaStream)) {
      this.hasPermissionGranted = true;
      this.isPermissionDenied = false;
      return true;
    }

    // Clean up any stale stream before requesting a new one
    this.releaseMicrophoneStream();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      if (this.isBrowserRecognitionSupported) {
        return true;
      }
      this.lastMicError = 'Microphone capture is not supported in this browser.';
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0) {
        stream.getTracks().forEach((t) => t.stop());
        this.isNoMicrophoneDevice = true;
        this.lastMicError =
          'No active microphone audio track was found. Please check your microphone.';
        this.setPipelineState('ERROR');
        return false;
      }

      const primaryTrack = audioTracks[0];
      primaryTrack.enabled = true;

      if (primaryTrack.readyState !== 'live') {
        stream.getTracks().forEach((t) => t.stop());
        this.isNoMicrophoneDevice = true;
        this.lastMicError =
          'Microphone audio track is not live. Please check if another application is blocking the microphone.';
        this.setPipelineState('ERROR');
        return false;
      }

      // Keep the verified stream ready for immediate capture or release if not listening yet
      this.activeMediaStream = stream;
      this.hasPermissionGranted = true;
      this.isPermissionDenied = false;
      this.isNoMicrophoneDevice = false;

      primaryTrack.onended = () => {
        if (this.isListening || this.shouldKeepListening) {
          this.handleMediaDeviceChange();
        }
      };

      return true;
    } catch (err: any) {
      console.warn('Microphone permission/device check error:', err);
      const errName = err?.name || '';
      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errName === 'SecurityError'
      ) {
        this.isPermissionDenied = true;
        this.hasPermissionGranted = false;
        this.lastMicError = PERMISSION_DENIED_MESSAGE;
      } else if (
        errName === 'NotFoundError' ||
        errName === 'DevicesNotFoundError' ||
        errName === 'OverconstrainedError'
      ) {
        this.isNoMicrophoneDevice = true;
        this.lastMicError =
          'No microphone device was found. Please connect a microphone and try again.';
      } else {
        this.lastMicError = 'Could not access the microphone. Please check your audio settings.';
      }
      this.setPipelineState('ERROR');
      return false;
    }
  }

  public setLanguage(langOption: 'English' | 'Telugu' | 'Telgish'): void {
    if (langOption === 'Telugu' || langOption === 'Telgish') {
      this.currentLanguage = 'te-IN';
      this.currentLanguageLabel = 'Telugu';
    } else {
      this.currentLanguage = 'en-US';
      this.currentLanguageLabel = 'English';
    }
  }

  private clearRecognitionTimers(): void {
    if (this.silenceFinalizeTimer) {
      clearTimeout(this.silenceFinalizeTimer);
      this.silenceFinalizeTimer = null;
    }
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (this.noSpeechTimeoutTimer) {
      clearTimeout(this.noSpeechTimeoutTimer);
      this.noSpeechTimeoutTimer = null;
    }
    if (this.fallbackSpeechTimer) {
      clearTimeout(this.fallbackSpeechTimer);
      this.fallbackSpeechTimer = null;
    }
  }

  private notifyFallbackActive(): void {
    this.isUsingFallbackService = true;
    this.activeVoicePath = 'backend_gemini_stt';
    this.fallbackNotice = FRIENDLY_FALLBACK_MESSAGE;
    if (this.onFallbackNoticeCallback) {
      try {
        this.onFallbackNoticeCallback(FRIENDLY_FALLBACK_MESSAGE);
      } catch (e) {
        console.warn('onFallbackNotice error:', e);
      }
    }
  }

  private markSpeechActivityDetected(): void {
    const now = Date.now();
    this.lastAcousticSpeechTime = now;
    if (!this.hasDetectedAcousticSpeech) {
      this.hasDetectedAcousticSpeech = true;
      this.acousticSpeechStartTime = now;
    }
    if (!this.isHearingSpeech) {
      this.isHearingSpeech = true;
      this.setPipelineState('SPEECH_DETECTED');
      if (this.onSpeechDetectedCallback) {
        try {
          this.onSpeechDetectedCallback();
        } catch (e) {
          console.warn('onSpeechDetected callback error:', e);
        }
      }
    }
  }

  private finalizeCurrentTranscript(text: string, sourcePath: ActiveVoicePath): void {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned || this.hasFinalizedCurrentTurn) return;

    this.hasFinalizedCurrentTurn = true;
    this.shouldKeepListening = false;
    this.isListening = false;
    this.isHearingSpeech = false;
    this.isTranscribing = false;
    this.activeVoicePath = sourcePath;
    this.clearRecognitionTimers();

    const cb = this.onResultCallback;
    this.stopBrowserRecognitionOnly();
    this.releaseMicrophoneStream();
    this.setPipelineState('THINKING');

    if (cb) {
      cb(cleaned, true);
    }
  }

  private stopBrowserRecognitionOnly(): void {
    if (this.recognition) {
      const rec = this.recognition;
      this.recognition = null;
      try {
        rec.onstart = null;
        rec.onaudiostart = null;
        rec.onsoundstart = null;
        rec.onspeechstart = null;
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.stop();
      } catch {
        // Ignore stop errors
      }
    }
  }

  /**
   * Starts real-time acoustic level monitoring and MediaRecorder capture on the verified MediaStream.
   * Detects real speech energy and captures audio for the backend STT fallback path.
   */
  private setupMediaRecorderAndAcousticVAD(stream: MediaStream, currentToken: number): boolean {
    this.recordedChunks = [];
    this.recordingStartTime = Date.now();

    // 1. Setup MediaRecorder for reliable audio capture
    if (typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined') {
      try {
        const candidateMimes = [
          'audio/webm;codecs=opus',
          'audio/webm',
          'audio/mp4',
          'audio/ogg;codecs=opus',
          'audio/wav'
        ];
        let chosenMime = '';
        if (typeof MediaRecorder.isTypeSupported === 'function') {
          for (const m of candidateMimes) {
            if (MediaRecorder.isTypeSupported(m)) {
              chosenMime = m;
              break;
            }
          }
        }

        const recorder = chosenMime
          ? new MediaRecorder(stream, { mimeType: chosenMime })
          : new MediaRecorder(stream);

        this.recordingMimeType = recorder.mimeType || chosenMime || 'audio/webm';
        this.mediaRecorder = recorder;

        recorder.ondataavailable = (ev: BlobEvent) => {
          if (ev.data && ev.data.size > 0) {
            this.recordedChunks.push(ev.data);
            // If AudioContext is suspended OR fallback speech service is active,
            // ensure MediaRecorder chunks trigger speech detection and fallback transcription.
            if (
              this.recordedChunks.length >= 3 &&
              (!this.audioContext ||
                this.audioContext.state !== 'running' ||
                this.isUsingFallbackService ||
                this.preferBackendFallback)
            ) {
              this.markSpeechActivityDetected();
              if (!this.fallbackSpeechTimer && !this.latestCapturedTranscript.trim()) {
                this.fallbackSpeechTimer = setTimeout(() => {
                  if (
                    currentToken === this.sessionToken &&
                    !this.hasFinalizedCurrentTurn &&
                    !this.isTranscribing &&
                    !this.latestCapturedTranscript.trim()
                  ) {
                    this.notifyFallbackActive();
                    this.transcribeRecordedAudioViaBackend(currentToken);
                  }
                }, 2400);
              }
            }
          }
        };

        recorder.start(200); // Collect 200ms audio slices
      } catch (e) {
        console.warn('MediaRecorder initialization warning:', e);
      }
    }

    // 2. Setup AudioContext + AnalyserNode to detect genuine microphone speech energy
    try {
      const AudioCtx =
        (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        if (!this.audioContext || this.audioContext.state === 'closed') {
          this.audioContext = new AudioCtx();
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
          this.audioContext.resume().catch(() => {});
        }

        if (this.audioContext) {
          const source = this.audioContext.createMediaStreamSource(stream);
          const analyser = this.audioContext.createAnalyser();
          analyser.fftSize = 512;
          analyser.smoothingTimeConstant = 0.3;
          source.connect(analyser);

          this.mediaStreamSource = source;
          this.analyserNode = analyser;

          const dataArray = new Uint8Array(analyser.fftSize);

          if (this.audioLevelInterval) {
            clearInterval(this.audioLevelInterval);
          }

          this.audioLevelInterval = setInterval(() => {
            if (
              currentToken !== this.sessionToken ||
              this.hasFinalizedCurrentTurn ||
              this.isTranscribing ||
              !this.analyserNode
            ) {
              return;
            }

            this.analyserNode.getByteTimeDomainData(dataArray);
            let sumSquares = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const normalized = (dataArray[i] - 128) / 128;
              sumSquares += normalized * normalized;
            }
            const rms = Math.sqrt(sumSquares / dataArray.length);

            // RMS > 0.015 indicates active voice signal above noise floor
            if (rms > 0.015) {
              this.consecutiveSpeechFrames += 1;
              if (this.consecutiveSpeechFrames >= 2) {
                this.markSpeechActivityDetected();

                // If browser SpeechRecognition hasn't produced any text after 3.4s of real speech,
                // automatically transcribe the captured audio via the backend fallback!
                if (!this.fallbackSpeechTimer && !this.latestCapturedTranscript.trim()) {
                  this.fallbackSpeechTimer = setTimeout(() => {
                    if (
                      currentToken === this.sessionToken &&
                      !this.hasFinalizedCurrentTurn &&
                      !this.isTranscribing &&
                      !this.latestCapturedTranscript.trim() &&
                      this.hasDetectedAcousticSpeech
                    ) {
                      this.notifyFallbackActive();
                      this.transcribeRecordedAudioViaBackend(currentToken);
                    }
                  }, 3400);
                }
              }
            } else {
              this.consecutiveSpeechFrames = 0;

              // If speech was detected earlier and the user has now paused for >= 1200ms:
              // If browser SpeechRecognition produced text, silenceFinalizeTimer handles it;
              // If browser SpeechRecognition produced NO text (fallback mode or silent browser STT failure),
              // trigger backend Gemini STT transcription now!
              if (
                this.hasDetectedAcousticSpeech &&
                !this.isTranscribing &&
                !this.hasFinalizedCurrentTurn &&
                !this.latestCapturedTranscript.trim()
              ) {
                const now = Date.now();
                const speechDuration = this.lastAcousticSpeechTime - this.acousticSpeechStartTime;
                const silenceDuration = now - this.lastAcousticSpeechTime;
                if (speechDuration >= 250 && silenceDuration >= 1250) {
                  this.notifyFallbackActive();
                  this.transcribeRecordedAudioViaBackend(currentToken);
                }
              }
            }
          }, 85);
        }
      }
    } catch (e) {
      console.warn('AudioContext VAD setup warning:', e);
    }

    return true;
  }

  /**
   * Stops the MediaRecorder, collects the recorded audio blob, sends it to
   * POST /api/medical-copilot/transcribe, and delivers the recognized text.
   */
  private async transcribeRecordedAudioViaBackend(currentToken: number): Promise<void> {
    if (
      this.isTranscribing ||
      this.hasFinalizedCurrentTurn ||
      currentToken !== this.sessionToken
    ) {
      return;
    }

    // If browser SpeechRecognition already captured a valid transcript, use it immediately
    if (this.latestCapturedTranscript.trim()) {
      this.finalizeCurrentTranscript(
        this.latestCapturedTranscript,
        'browser_speech_recognition'
      );
      return;
    }

    this.isTranscribing = true;
    this.isListening = false;
    this.isHearingSpeech = false;
    this.clearRecognitionTimers();
    this.stopBrowserRecognitionOnly();
    this.setPipelineState('TRANSCRIBING');

    const recorder = this.mediaRecorder;
    const firstChunk = this.recordedChunks[0];
    const chunkMime =
      firstChunk && typeof (firstChunk as Blob).type === 'string' && (firstChunk as Blob).type
        ? (firstChunk as Blob).type
        : '';
    const mimeType = chunkMime || this.recordingMimeType || 'audio/webm';

    const collectBlob = (): Promise<Blob | null> =>
      new Promise((resolve) => {
        if (!recorder) {
          if (this.recordedChunks.length > 0) {
            resolve(new Blob(this.recordedChunks, { type: mimeType }));
          } else {
            resolve(null);
          }
          return;
        }

        if (recorder.state === 'inactive') {
          resolve(
            this.recordedChunks.length > 0
              ? new Blob(this.recordedChunks, { type: mimeType })
              : null
          );
          return;
        }

        const finishStop = () => {
          const blob =
            this.recordedChunks.length > 0
              ? new Blob(this.recordedChunks, { type: mimeType })
              : null;
          resolve(blob);
        };

        recorder.onstop = finishStop;
        try {
          recorder.stop();
        } catch {
          finishStop();
        }
      });

    const audioBlob = await collectBlob();
    this.releaseMicrophoneStream();

    if (currentToken !== this.sessionToken || this.hasFinalizedCurrentTurn) {
      this.isTranscribing = false;
      return;
    }

    if (!audioBlob || audioBlob.size < 256) {
      this.isTranscribing = false;
      this.setPipelineState('READY');
      if (this.onEndCallback) {
        this.onEndCallback();
      }
      return;
    }

    try {
      const audioDataUrl = await this.blobToDataUrl(audioBlob);
      const response = await fetch(buildApiUrl('/api/medical-copilot/transcribe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audioDataUrl,
          mimeType: audioBlob.type || mimeType,
          language: this.currentLanguageLabel
        })
      });

      if (currentToken !== this.sessionToken || this.hasFinalizedCurrentTurn) {
        this.isTranscribing = false;
        return;
      }

      if (!response.ok) {
        throw new Error('Alternate speech transcription service is temporarily unavailable.');
      }

      const data = await response.json();
      const transcript = typeof data?.transcript === 'string' ? data.transcript.trim() : '';

      this.isTranscribing = false;

      if (transcript.length > 0) {
        if (this.onResultCallback) {
          this.onResultCallback(transcript, false);
        }
        this.finalizeCurrentTranscript(transcript, 'backend_gemini_stt');
      } else {
        this.setPipelineState('READY');
        if (this.onErrorCallback) {
          this.onErrorCallback(
            'No clear speech was detected. Please tap the microphone and speak clearly.'
          );
        }
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      }
    } catch (err: any) {
      console.warn('Backend speech-to-text fallback error:', err);
      this.isTranscribing = false;
      this.setPipelineState('ERROR');
      if (this.onErrorCallback) {
        this.onErrorCallback(
          'Voice recognition could not transcribe the audio. Please try speaking again or use text input.'
        );
      }
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    }
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to encode audio blob'));
        }
      };
      reader.onerror = () => reject(new Error('FileReader error encoding audio blob'));
      reader.readAsDataURL(blob);
    });
  }

  private createAndStartRecognitionInstance(
    currentToken: number,
    useSingleUtteranceMode: boolean = false
  ): void {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      this.notifyFallbackActive();
      return;
    }

    this.stopBrowserRecognitionOnly();

    const rec = new SpeechRecognition();
    this.recognition = rec;

    rec.continuous = !useSingleUtteranceMode;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.lang = this.networkErrorCount > 0 ? 'en-US' : this.currentLanguage;

    rec.onstart = () => {
      if (currentToken !== this.sessionToken) return;
      this.isListening = true;
      this.isPermissionDenied = false;
      this.lastMicError = null;
      if (!this.isHearingSpeech && !this.isTranscribing) {
        this.setPipelineState('LISTENING');
      }
    };

    const handleSpeechDetected = () => {
      if (currentToken !== this.sessionToken) return;
      this.markSpeechActivityDetected();
    };

    rec.onaudiostart = () => {
      if (currentToken !== this.sessionToken) return;
      this.isListening = true;
    };
    rec.onsoundstart = handleSpeechDetected;
    rec.onspeechstart = handleSpeechDetected;

    rec.onresult = (event: any) => {
      if (currentToken !== this.sessionToken || this.hasFinalizedCurrentTurn) return;

      this.networkErrorCount = 0;
      this.activeVoicePath = 'browser_speech_recognition';
      handleSpeechDetected();

      if (this.fallbackSpeechTimer) {
        clearTimeout(this.fallbackSpeechTimer);
        this.fallbackSpeechTimer = null;
      }

      let finalPieces = '';
      let interimPieces = '';
      let hasNewFinalResult = false;

      for (let i = 0; i < event.results.length; ++i) {
        const res = event.results[i];
        const transcriptChunk = res[0]?.transcript || '';
        if (res.isFinal) {
          finalPieces += ' ' + transcriptChunk;
          if (i >= event.resultIndex) {
            hasNewFinalResult = true;
          }
        } else {
          interimPieces += ' ' + transcriptChunk;
        }
      }

      const combinedTranscript = `${finalPieces} ${interimPieces}`.replace(/\s+/g, ' ').trim();
      if (!combinedTranscript) return;

      this.latestCapturedTranscript = combinedTranscript;

      // Immediately update UI with live interim/final transcript
      if (this.onResultCallback) {
        this.onResultCallback(combinedTranscript, false);
      }

      if (this.silenceFinalizeTimer) {
        clearTimeout(this.silenceFinalizeTimer);
      }

      const waitMs = hasNewFinalResult && !interimPieces.trim() ? 850 : 1400;
      this.silenceFinalizeTimer = setTimeout(() => {
        if (
          currentToken === this.sessionToken &&
          !this.hasFinalizedCurrentTurn &&
          this.latestCapturedTranscript.trim()
        ) {
          this.finalizeCurrentTranscript(
            this.latestCapturedTranscript,
            'browser_speech_recognition'
          );
        }
      }, waitMs);
    };

    rec.onerror = (event: any) => {
      if (currentToken !== this.sessionToken || this.hasFinalizedCurrentTurn) return;

      const errorType = event?.error || 'unknown';
      if (errorType === 'aborted') {
        return;
      }

      console.warn('SpeechRecognition event error:', errorType);

      if (errorType === 'not-allowed' || errorType === 'permission-denied') {
        // If getUserMedia already succeeded and our microphone stream is live,
        // "not-allowed" from SpeechRecognition means the browser blocked its cloud STT service,
        // NOT the microphone hardware! Switch seamlessly to backend STT fallback.
        if (this.isStreamActiveAndLive(this.activeMediaStream)) {
          this.preferBackendFallback = true;
          this.notifyFallbackActive();
          return;
        }

        this.isPermissionDenied = true;
        this.hasPermissionGranted = false;
        this.shouldKeepListening = false;
        this.isListening = false;
        this.isHearingSpeech = false;
        this.clearRecognitionTimers();
        this.releaseMicrophoneStream();
        this.lastMicError = PERMISSION_DENIED_MESSAGE;
        this.setPipelineState('ERROR');
        if (this.onErrorCallback) {
          this.onErrorCallback(PERMISSION_DENIED_MESSAGE);
        }
        return;
      }

      if (errorType === 'audio-capture') {
        if (this.isStreamActiveAndLive(this.activeMediaStream)) {
          // Browser SpeechRecognition couldn't share the mic, but MediaRecorder has it
          this.notifyFallbackActive();
          return;
        }
        this.isNoMicrophoneDevice = true;
        this.shouldKeepListening = false;
        this.isListening = false;
        this.isHearingSpeech = false;
        this.clearRecognitionTimers();
        this.releaseMicrophoneStream();
        const msg =
          'No working microphone was detected. Please connect or unmute your microphone and try again.';
        this.lastMicError = msg;
        this.setPipelineState('ERROR');
        if (this.onErrorCallback) {
          this.onErrorCallback(msg);
        }
        return;
      }

      const triggerOrScheduleFallback = () => {
        this.notifyFallbackActive();
        const elapsedMs = Date.now() - this.recordingStartTime;
        if (
          this.hasDetectedAcousticSpeech &&
          this.recordedChunks.length >= 4 &&
          elapsedMs >= 2200 &&
          !this.isTranscribing
        ) {
          this.transcribeRecordedAudioViaBackend(currentToken);
        } else if (!this.fallbackSpeechTimer && !this.isTranscribing) {
          const waitRemaining = Math.max(1200, 2800 - elapsedMs);
          this.fallbackSpeechTimer = setTimeout(() => {
            if (
              currentToken === this.sessionToken &&
              !this.hasFinalizedCurrentTurn &&
              !this.isTranscribing &&
              !this.latestCapturedTranscript.trim() &&
              (this.hasDetectedAcousticSpeech || this.recordedChunks.length >= 3)
            ) {
              this.notifyFallbackActive();
              this.transcribeRecordedAudioViaBackend(currentToken);
            }
          }, waitRemaining);
        }
      };

      if (errorType === 'no-speech') {
        if (this.latestCapturedTranscript.trim() && !this.hasFinalizedCurrentTurn) {
          this.finalizeCurrentTranscript(
            this.latestCapturedTranscript,
            'browser_speech_recognition'
          );
          return;
        }
        if (this.hasDetectedAcousticSpeech || this.recordedChunks.length >= 3) {
          triggerOrScheduleFallback();
        }
        return;
      }

      // For 'network', 'service-not-allowed', 'language-not-supported', or other browser STT errors:
      // If we already have a partial transcript from browser STT, finalize it
      if (this.latestCapturedTranscript.trim() && !this.hasFinalizedCurrentTurn) {
        this.finalizeCurrentTranscript(
          this.latestCapturedTranscript,
          'browser_speech_recognition'
        );
        return;
      }

      // Otherwise, seamlessly activate the backend STT fallback using the active MediaRecorder stream!
      this.networkErrorCount += 1;
      this.preferBackendFallback = true;
      triggerOrScheduleFallback();
    };

    rec.onend = () => {
      if (currentToken !== this.sessionToken || this.hasFinalizedCurrentTurn || this.isTranscribing) {
        return;
      }

      // 1. If speech was captured by browser SpeechRecognition, finalize it immediately
      if (this.latestCapturedTranscript.trim()) {
        this.finalizeCurrentTranscript(
          this.latestCapturedTranscript,
          'browser_speech_recognition'
        );
        return;
      }

      // 2. If acoustic speech was detected on the microphone, transcribe once full phrase is captured
      if (this.hasDetectedAcousticSpeech && this.recordedChunks.length > 0) {
        this.notifyFallbackActive();
        const elapsedMs = Date.now() - this.recordingStartTime;
        if (this.recordedChunks.length >= 4 && elapsedMs >= 2200) {
          this.transcribeRecordedAudioViaBackend(currentToken);
        } else if (!this.fallbackSpeechTimer) {
          const waitRemaining = Math.max(1200, 2800 - elapsedMs);
          this.fallbackSpeechTimer = setTimeout(() => {
            if (
              currentToken === this.sessionToken &&
              !this.hasFinalizedCurrentTurn &&
              !this.isTranscribing &&
              !this.latestCapturedTranscript.trim()
            ) {
              this.notifyFallbackActive();
              this.transcribeRecordedAudioViaBackend(currentToken);
            }
          }, waitRemaining);
        }
        return;
      }

      // 3. If recognition ended unexpectedly before user spoke, allow at most 2 bounded restarts
      // (Never create an infinite restart loop!)
      if (
        this.shouldKeepListening &&
        !this.isSpeakingActive &&
        !this.isPermissionDenied &&
        !this.isNoMicrophoneDevice &&
        !this.preferBackendFallback &&
        this.recognitionRestartCount < 2
      ) {
        this.recognitionRestartCount += 1;
        this.restartTimer = setTimeout(() => {
          if (
            currentToken === this.sessionToken &&
            this.shouldKeepListening &&
            !this.isSpeakingActive &&
            !this.hasFinalizedCurrentTurn &&
            !this.isTranscribing
          ) {
            this.createAndStartRecognitionInstance(currentToken, this.networkErrorCount === 1);
          }
        }, 280);
        return;
      }

      // 4. If browser SpeechRecognition stopped repeatedly, keep listening via MediaRecorder + Backend STT fallback
      if (
        this.shouldKeepListening &&
        this.isStreamActiveAndLive(this.activeMediaStream)
      ) {
        this.preferBackendFallback = true;
        this.notifyFallbackActive();
        return;
      }

      this.isListening = false;
      this.isHearingSpeech = false;
      if (this.onEndCallback && !this.shouldKeepListening) {
        this.onEndCallback();
      }
    };

    try {
      rec.start();
    } catch (e: any) {
      console.warn('Recognition start exception, using backend fallback:', e);
      this.notifyFallbackActive();
    }
  }

  /**
   * Starts microphone capture and speech recognition (Browser SpeechRecognition primary + Backend Gemini STT fallback).
   */
  public startListening(
    onResult: SpeechRecognitionResultHandler,
    onError?: (err: string) => void,
    onEnd?: () => void,
    onSpeechDetected?: () => void,
    options?: StartListeningOptions
  ): boolean {
    if (!this.isSupported) {
      this.setPipelineState('ERROR');
      if (onError) onError('Voice input is not supported in this browser.');
      return false;
    }

    if (this.isPermissionDenied) {
      this.setPipelineState('ERROR');
      if (onError) onError(PERMISSION_DENIED_MESSAGE);
      return false;
    }

    if (this.isNoMicrophoneDevice) {
      this.setPipelineState('ERROR');
      if (onError) {
        onError('No microphone device was found. Please connect a microphone and try again.');
      }
      return false;
    }

    this.sessionToken += 1;
    const currentToken = this.sessionToken;

    this.clearRecognitionTimers();
    this.stopBrowserRecognitionOnly();

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;
    this.onEndCallback = onEnd || null;
    this.onSpeechDetectedCallback = onSpeechDetected || null;
    this.onStateChangeCallback = options?.onStateChange || null;
    this.onFallbackNoticeCallback = options?.onFallbackNotice || null;

    this.shouldKeepListening = true;
    this.latestCapturedTranscript = '';
    this.hasFinalizedCurrentTurn = false;
    this.hasDetectedAcousticSpeech = false;
    this.acousticSpeechStartTime = 0;
    this.lastAcousticSpeechTime = 0;
    this.consecutiveSpeechFrames = 0;
    this.recognitionRestartCount = 0;
    this.isHearingSpeech = false;
    this.isTranscribing = false;
    this.fallbackNotice = null;

    // Always cancel any active or pending browser TTS before opening the microphone
    this.stopSpeaking();

    this.setPipelineState('CONNECTING');

    // Launch asynchronous verified microphone stream + recognition startup
    (async () => {
      const hasMic = await this.requestMicrophonePermission(false);
      if (currentToken !== this.sessionToken || !this.shouldKeepListening) {
        return;
      }

      if (!hasMic || !this.isStreamActiveAndLive(this.activeMediaStream)) {
        this.isListening = false;
        this.shouldKeepListening = false;
        this.setPipelineState('ERROR');
        const errText = this.lastMicError || PERMISSION_DENIED_MESSAGE;
        if (this.onErrorCallback) {
          this.onErrorCallback(errText);
        }
        return;
      }

      // Now we have a verified, live microphone audio track!
      this.isListening = true;
      this.setPipelineState('LISTENING');

      if (this.activeMediaStream) {
        this.setupMediaRecorderAndAcousticVAD(this.activeMediaStream, currentToken);
      }

      // Start primary Browser SpeechRecognition if supported and not locked to fallback
      if (this.isBrowserRecognitionSupported && !this.preferBackendFallback) {
        this.activeVoicePath = 'browser_speech_recognition';
        this.createAndStartRecognitionInstance(currentToken, false);
      } else {
        this.notifyFallbackActive();
      }

      // Safety session timeout (25 seconds) so the microphone is never left open indefinitely
      this.noSpeechTimeoutTimer = setTimeout(() => {
        if (
          currentToken === this.sessionToken &&
          this.shouldKeepListening &&
          !this.hasFinalizedCurrentTurn &&
          !this.isTranscribing
        ) {
          if (this.latestCapturedTranscript.trim()) {
            this.finalizeCurrentTranscript(
              this.latestCapturedTranscript,
              'browser_speech_recognition'
            );
          } else if (this.hasDetectedAcousticSpeech && this.recordedChunks.length > 0) {
            this.notifyFallbackActive();
            this.transcribeRecordedAudioViaBackend(currentToken);
          } else {
            this.stopListening();
            if (this.onEndCallback) {
              this.onEndCallback();
            }
          }
        }
      }, 25000);
    })();

    return true;
  }

  /**
   * Called when the user explicitly clicks "Done Speaking" or toggles the mic off to submit their spoken question.
   * If browser SpeechRecognition already has text, finalizes it immediately.
   * Otherwise, if audio was recorded on the microphone, transcribes it via the backend fallback!
   */
  public async finishListening(): Promise<void> {
    if (this.hasFinalizedCurrentTurn || this.isTranscribing) return;

    if (this.latestCapturedTranscript.trim()) {
      this.finalizeCurrentTranscript(
        this.latestCapturedTranscript,
        'browser_speech_recognition'
      );
      return;
    }

    const recordedDurationMs = Date.now() - this.recordingStartTime;
    if (
      this.recordedChunks.length > 0 &&
      (this.hasDetectedAcousticSpeech || recordedDurationMs >= 500)
    ) {
      this.notifyFallbackActive();
      await this.transcribeRecordedAudioViaBackend(this.sessionToken);
      return;
    }

    this.stopListening();
  }

  /**
   * Immediately stops listening and releases all microphone hardware tracks and timers.
   */
  public stopListening(): void {
    this.sessionToken += 1;
    this.shouldKeepListening = false;
    this.isListening = false;
    this.isHearingSpeech = false;
    this.isTranscribing = false;
    this.clearRecognitionTimers();
    this.stopBrowserRecognitionOnly();
    this.releaseMicrophoneStream();
    if (!this.isSpeakingActive && this.pipelineState !== 'THINKING') {
      this.setPipelineState('READY');
    }
  }

  /**
   * Speak AI response aloud through the device speakers using window.speechSynthesis.
   */
  public speak(
    text: string,
    onEnd?: () => void,
    onError?: (errMessage: string) => void
  ): Promise<void> {
    return new Promise((resolve) => {
      this.stopListening();
      this.isSpeakingActive = true;
      this.lastTtsError = null;
      this.setPipelineState('SPEAKING');

      if (this.watchdogTimer) {
        clearTimeout(this.watchdogTimer);
        this.watchdogTimer = null;
      }
      if (this.speakingPollTimer) {
        clearInterval(this.speakingPollTimer);
        this.speakingPollTimer = null;
      }

      if (!this.synthesis || !this.isTTSSupported) {
        const msg = 'Browser Text-to-Speech is unavailable on this device.';
        this.lastTtsError = msg;
        if (onError) onError(msg);
        setTimeout(() => {
          this.isSpeakingActive = false;
          this.setPipelineState('READY');
          if (onEnd) onEnd();
          resolve();
        }, Math.min(2800, Math.max(1200, text.length * 45)));
        return;
      }

      try {
        this.synthesis.cancel();
        if (this.synthesis.paused) {
          this.synthesis.resume();
        }
      } catch (e) {
        console.warn('Synthesis cancel/resume warning:', e);
      }

      let finished = false;
      let hasStartedSpeaking = false;

      const completeSpeaking = (cancelLingering: boolean = false) => {
        if (finished) return;
        finished = true;
        if (this.watchdogTimer) {
          clearTimeout(this.watchdogTimer);
          this.watchdogTimer = null;
        }
        if (this.speakingPollTimer) {
          clearInterval(this.speakingPollTimer);
          this.speakingPollTimer = null;
        }
        if (cancelLingering && this.synthesis) {
          try {
            this.synthesis.cancel();
          } catch {
            // Ignore cancel error
          }
        }
        this.isSpeakingActive = false;
        this.activeUtterance = null;
        this.setPipelineState('READY');
        if (onEnd) onEnd();
        resolve();
      };

      const utterance = new SpeechSynthesisUtterance(text);
      this.activeUtterance = utterance;
      utterance.rate = 0.98;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = this.currentLanguage;

      const voices =
        this.cachedVoices.length > 0 ? this.cachedVoices : this.synthesis.getVoices();

      if (voices && voices.length > 0) {
        let preferredVoice: SpeechSynthesisVoice | undefined;

        if (this.currentLanguage.startsWith('te')) {
          preferredVoice = voices.find(
            (v) => v.lang.toLowerCase().includes('te') || v.name.toLowerCase().includes('telugu')
          );
        } else {
          preferredVoice =
            voices.find(
              (v) =>
                v.lang.startsWith('en') &&
                (v.name.includes('Natural') ||
                  v.name.includes('Google') ||
                  v.name.includes('Aria') ||
                  v.name.includes('Jenny') ||
                  v.name.includes('Samantha') ||
                  v.name.includes('Zira'))
            ) ||
            voices.find((v) => v.lang.startsWith('en') && v.default) ||
            voices.find((v) => v.lang.startsWith('en'));
        }

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
      }

      utterance.onstart = () => {
        hasStartedSpeaking = true;
      };

      utterance.onend = () => {
        completeSpeaking(false);
      };

      utterance.onerror = (e: any) => {
        if (e?.error !== 'interrupted' && e?.error !== 'canceled') {
          console.warn('SpeechSynthesis utterance error:', e?.error || e);
          this.lastTtsError = 'Audio playback was interrupted or blocked by browser settings.';
          if (onError) onError(this.lastTtsError);
        }
        completeSpeaking(true);
      };

      // Safety watchdog in case browser TTS hangs without firing onend
      const maxDurationMs = Math.min(11000, Math.max(3500, text.length * 80));
      this.watchdogTimer = setTimeout(() => {
        completeSpeaking(true);
      }, maxDurationMs);

      setTimeout(() => {
        try {
          if (this.synthesis && !finished) {
            if (this.synthesis.paused) {
              this.synthesis.resume();
            }
            this.synthesis.speak(utterance);

            let ticksSinceSpeak = 0;
            this.speakingPollTimer = setInterval(() => {
              ticksSinceSpeak += 1;
              if (!this.synthesis || finished) return;
              if (this.synthesis.speaking) {
                hasStartedSpeaking = true;
              } else if (hasStartedSpeaking && !this.synthesis.pending) {
                completeSpeaking(false);
              } else if (ticksSinceSpeak > 28 && !this.synthesis.speaking && !this.synthesis.pending) {
                completeSpeaking(true);
              }
            }, 150);
          }
        } catch (err) {
          console.error('synthesis.speak exception:', err);
          completeSpeaking(true);
        }
      }, 50);
    });
  }

  public stopSpeaking(): void {
    this.isSpeakingActive = false;
    this.activeUtterance = null;
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.speakingPollTimer) {
      clearInterval(this.speakingPollTimer);
      this.speakingPollTimer = null;
    }
    if (this.synthesis) {
      try {
        this.synthesis.cancel();
      } catch (e) {
        console.warn('Error cancelling speech synthesis:', e);
      }
    }
    if (!this.isListening && !this.isTranscribing && this.pipelineState === 'SPEAKING') {
      this.setPipelineState('READY');
    }
  }
}

export const speechService = new SpeechService();
