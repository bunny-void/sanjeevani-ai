import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  ArrowLeft,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { speechService } from '../services/speechService';
import { AIService, DynamicSymptomOption } from '../services/aiClassifierService';
import { AIStatusAssessment, CheckInMessage, PrototypeState } from '../types';

export const VoiceCallView: React.FC = () => {
  const {
    patient,
    activeCallStatus,
    setActiveCallStatus,
    endCall,
    addCheckInLog,
    setActiveModal,
    setSelectedRefillMedicine,
    medications,
    setActiveView,
    setPrototypeState
  } = useApp();

  const [callDuration, setCallDuration] = useState<number>(0);
  const [currentAiText, setCurrentAiText] = useState<string>('');
  const [patientTranscript, setPatientTranscript] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [conversationStep, setConversationStep] = useState<
    'INITIAL_CHECKIN' | 'FOLLOWUP_QUESTIONS' | 'MEDICATION_CHECK' | 'COMPLETE'
  >('INITIAL_CHECKIN');
  const [lastDetectedState, setLastDetectedState] = useState<
    PrototypeState | 'REFILL_REQUEST' | null
  >(null);
  const [sessionHistory, setSessionHistory] = useState<string[]>([]);
  const [messages, setMessages] = useState<CheckInMessage[]>([]);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);
  const [ttsErrorMessage, setTtsErrorMessage] = useState<string | null>(null);
  const [fallbackNoticeMessage, setFallbackNoticeMessage] = useState<string | null>(null);
  const [finalAssessment, setFinalAssessment] = useState<AIStatusAssessment | null>(null);

  const timerRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isProcessingTurnRef = useRef<boolean>(false);

  useEffect(() => {
    isMountedRef.current = true;
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      speechService.stopSpeaking();
      speechService.stopListening();
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    speechService.setLanguage(patient.language || 'English');
    initiateMorningVoiceCheckIn();
  }, []);

  const appendMessage = (sender: 'AI' | 'USER', text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      }
    ]);
  };

  const initiateMorningVoiceCheckIn = async () => {
    isProcessingTurnRef.current = false;
    speechService.stopSpeaking();
    speechService.stopListening();

    setActiveCallStatus('CONNECTING');
    setConversationStep('INITIAL_CHECKIN');
    setLastDetectedState(null);
    setSessionHistory([]);
    setPatientTranscript('');
    setMicErrorMessage(null);
    setTtsErrorMessage(null);
    setFallbackNoticeMessage(null);
    setFinalAssessment(null);

    // Unlock TTS & verify microphone permission once
    speechService.warmupAudio();
    const micGranted = await speechService.requestMicrophonePermission(false);

    if (!isMountedRef.current) return;

    if (!micGranted && speechService.lastMicError) {
      setMicErrorMessage(speechService.lastMicError);
    }

    const greeting = AIService.getMorningGreeting(patient);
    setCurrentAiText(greeting);
    appendMessage('AI', greeting);
    setActiveCallStatus('AI_SPEAKING');

    await speechService.speak(
      greeting,
      () => {
        if (isMountedRef.current) {
          listenToPatient();
        }
      },
      (ttsErr) => {
        if (isMountedRef.current) {
          setTtsErrorMessage(ttsErr);
        }
      }
    );
  };

  const handleReplayAiSpeech = async () => {
    if (!currentAiText) return;
    setTtsErrorMessage(null);
    speechService.warmupAudio();
    setActiveCallStatus('AI_SPEAKING');
    await speechService.speak(
      currentAiText,
      () => {
        if (isMountedRef.current && conversationStep !== 'COMPLETE') {
          listenToPatient();
        } else if (isMountedRef.current) {
          setActiveCallStatus('CALL_ENDED');
        }
      },
      (err) => {
        if (isMountedRef.current) setTtsErrorMessage(err);
      }
    );
  };

  const listenToPatient = () => {
    if (isMuted || !isMountedRef.current || isProcessingTurnRef.current) return;

    if (!speechService.isSupported) {
      setActiveCallStatus('MIC_UNAVAILABLE');
      setMicErrorMessage(
        'Voice recognition is not supported by this browser. Please select a feeling option below.'
      );
      return;
    }

    if (speechService.isPermissionDenied) {
      setActiveCallStatus('MIC_DENIED');
      setMicErrorMessage('Microphone access is required for voice input.');
      return;
    }

    if (speechService.isNoMicrophoneDevice) {
      setActiveCallStatus('MIC_UNAVAILABLE');
      setMicErrorMessage(
        'No microphone device was found. Please connect a microphone and try again.'
      );
      return;
    }

    // Do not show LISTENING until the microphone stream is verified active
    setActiveCallStatus('CONNECTING');
    setPatientTranscript('');
    setMicErrorMessage(null);

    const started = speechService.startListening(
      (text, isFinal) => {
        if (!isMountedRef.current || isProcessingTurnRef.current) return;
        setPatientTranscript(text);
        if (!isFinal) {
          setActiveCallStatus('SPEECH_DETECTED');
        } else if (text.trim().length > 0) {
          handlePatientResponse(text);
        }
      },
      (err) => {
        if (!isMountedRef.current) return;
        console.warn('Microphone STT Error:', err);
        if (speechService.isPermissionDenied || err.toLowerCase().includes('required')) {
          setActiveCallStatus('MIC_DENIED');
          setMicErrorMessage('Microphone access is required for voice input.');
        } else if (speechService.isNoMicrophoneDevice) {
          setActiveCallStatus('MIC_UNAVAILABLE');
          setMicErrorMessage(err);
        } else {
          setActiveCallStatus('ERROR');
          setMicErrorMessage(err);
        }
      },
      undefined,
      () => {
        if (isMountedRef.current && !isProcessingTurnRef.current) {
          setActiveCallStatus('SPEECH_DETECTED');
        }
      },
      {
        onStateChange: (st) => {
          if (!isMountedRef.current || isProcessingTurnRef.current) return;
          if (st === 'CONNECTING') setActiveCallStatus('CONNECTING');
          else if (st === 'LISTENING') setActiveCallStatus('LISTENING');
          else if (st === 'SPEECH_DETECTED') setActiveCallStatus('SPEECH_DETECTED');
          else if (st === 'TRANSCRIBING') setActiveCallStatus('TRANSCRIBING');
          else if (st === 'THINKING') setActiveCallStatus('THINKING');
          else if (st === 'SPEAKING') setActiveCallStatus('AI_SPEAKING');
          else if (st === 'ERROR') {
            setActiveCallStatus(speechService.isPermissionDenied ? 'MIC_DENIED' : 'ERROR');
          }
        },
        onFallbackNotice: (notice) => {
          if (isMountedRef.current) {
            setFallbackNoticeMessage(notice);
          }
        }
      }
    );

    if (!started && !speechService.isSupported) {
      setActiveCallStatus('MIC_UNAVAILABLE');
      setMicErrorMessage(
        'Voice recognition is unavailable in this browser. Tap any feeling option below to continue.'
      );
    }
  };

  // Handles either natural spoken microphone input OR a tapped symptom option chip
  const handlePatientResponse = async (text: string, displayLabel?: string) => {
    const cleanText = text.trim();
    if (!cleanText || isProcessingTurnRef.current) return;

    isProcessingTurnRef.current = true;
    speechService.stopSpeaking();
    speechService.stopListening();
    speechService.warmupAudio();

    setActiveCallStatus('PROCESSING');
    setPatientTranscript(displayLabel || cleanText);
    appendMessage('USER', displayLabel || cleanText);

    const updatedHistory = [...sessionHistory, cleanText];
    setSessionHistory(updatedHistory);

    setTimeout(async () => {
      if (!isMountedRef.current) return;

      const turnResult = AIService.analyzeCheckInTurn(
        cleanText,
        conversationStep,
        patient,
        updatedHistory
      );

      setLastDetectedState(turnResult.state);
      setActiveCallStatus('AI_RESPONDING');
      setCurrentAiText(turnResult.aiResponse);
      appendMessage('AI', turnResult.aiResponse);

      // 1. Handle CRITICAL escalation
      if (turnResult.state === 'CRITICAL') {
        const assessment = AIService.buildAssessment(turnResult);
        setFinalAssessment(assessment);
        setPrototypeState('CRITICAL');

        await speechService.speak(turnResult.aiResponse);
        if (!isMountedRef.current) return;

        isProcessingTurnRef.current = false;
        addCheckInLog({
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          duration: formatTime(callDuration),
          patientResponse: displayLabel || cleanText,
          classification: 'CRITICAL',
          videoEnabled: patient.enableVideo,
          finalStatus: 'CRITICAL',
          summary: assessment.summary,
          reason: assessment.reason,
          followUp: assessment.followUp,
          confidence: assessment.confidence,
          messages
        });

        setActiveModal('emergency_countdown');
        return;
      }

      // 2. Handle REFILL REQUEST
      if (turnResult.state === 'REFILL_REQUEST') {
        await speechService.speak(turnResult.aiResponse);
        if (!isMountedRef.current) return;

        isProcessingTurnRef.current = false;
        const lowerSpoken = cleanText.toLowerCase();
        const mentionedMed = medications.find((m) =>
          lowerSpoken.includes(m.name.toLowerCase().split(' ')[0])
        );
        const medToRefill =
          mentionedMed ||
          medications.find((m) => m.status === 'NEEDS_REFILL') ||
          medications.find((m) => m.timing === 'Morning') ||
          medications[0];
        setSelectedRefillMedicine(medToRefill);

        addCheckInLog({
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          duration: formatTime(callDuration),
          patientResponse: displayLabel || cleanText,
          classification: 'SAFE',
          videoEnabled: patient.enableVideo,
          finalStatus: 'REFILL_REQUESTED',
          summary: turnResult.summary,
          reason: turnResult.reason,
          followUp: turnResult.followUp,
          confidence: turnResult.confidence
        });

        setTimeout(() => {
          if (isMountedRef.current) {
            setActiveModal('pharmacy_handoff');
          }
        }, 400);
        return;
      }

      // 3. Continue multi-turn conversation OR complete check-in
      if (!turnResult.shouldEndCall && turnResult.nextStep && turnResult.nextStep !== 'COMPLETE') {
        setConversationStep(turnResult.nextStep);
        await speechService.speak(
          turnResult.aiResponse,
          () => {
            isProcessingTurnRef.current = false;
            if (isMountedRef.current) {
              listenToPatient();
            }
          },
          (err) => {
            isProcessingTurnRef.current = false;
            if (isMountedRef.current) setTtsErrorMessage(err);
          }
        );
      } else {
        setConversationStep('COMPLETE');
        const assessment = AIService.buildAssessment(turnResult);
        setFinalAssessment(assessment);
        setPrototypeState(assessment.status);

        await speechService.speak(
          turnResult.aiResponse,
          () => {
            isProcessingTurnRef.current = false;
            if (!isMountedRef.current) return;
            setActiveCallStatus('CALL_ENDED');
            addCheckInLog({
              date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
              timestamp: new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
              }),
              duration: formatTime(callDuration),
              patientResponse: updatedHistory.join(' • '),
              classification: assessment.status,
              videoEnabled: patient.enableVideo,
              finalStatus: assessment.status,
              summary: assessment.summary,
              reason: assessment.reason,
              followUp: assessment.followUp,
              confidence: assessment.confidence
            });
          },
          (err) => {
            isProcessingTurnRef.current = false;
            if (isMountedRef.current) setTtsErrorMessage(err);
          }
        );
      }
    }, 450);
  };

  // Render smooth audio waveform visualizer on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      step += activeCallStatus === 'HEARING' ? 0.14 : 0.08;
      const numBars = 28;
      const barWidth = 4;
      const gap = (width - numBars * barWidth) / (numBars + 1);

      for (let i = 0; i < numBars; i++) {
        let amplitude = 6;
        if (activeCallStatus === 'AI_SPEAKING' || activeCallStatus === 'AI_RESPONDING') {
          amplitude = Math.abs(Math.sin(step + i * 0.4)) * 28 + 8;
        } else if (activeCallStatus === 'HEARING') {
          amplitude = Math.abs(Math.sin(step + i * 0.5)) * 30 + 10;
        } else if (activeCallStatus === 'LISTENING') {
          amplitude = Math.abs(Math.cos(step + i * 0.35)) * 18 + 6;
        }

        const x = gap + i * (barWidth + gap);
        const barHeight = Math.max(4, amplitude);

        if (activeCallStatus === 'AI_SPEAKING' || activeCallStatus === 'AI_RESPONDING') {
          ctx.fillStyle = '#0F5C7A';
        } else if (activeCallStatus === 'HEARING' || activeCallStatus === 'LISTENING') {
          ctx.fillStyle = '#2E7D4F';
        } else {
          ctx.fillStyle = '#94A3B8';
        }

        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight / 2, barWidth, barHeight, 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeCallStatus]);

  // Explicit required UI states: READY, CONNECTING, LISTENING, SPEECH DETECTED, TRANSCRIBING, THINKING, SPEAKING, ERROR
  const getCallStatusBadge = () => {
    switch (activeCallStatus) {
      case 'READY':
      case 'IDLE':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200">
            <Mic className="w-4 h-4 text-[#0F5C7A]" />
            <span>Ready</span>
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200">
            <RefreshCw className="w-4 h-4 animate-spin text-[#0F5C7A]" />
            <span>Connecting...</span>
          </span>
        );
      case 'AI_SPEAKING':
      case 'SPEAKING':
      case 'AI_RESPONDING':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0F5C7A]/10 text-[#0F5C7A] font-extrabold text-xs border border-[#0F5C7A]/25">
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span>Speaking...</span>
          </span>
        );
      case 'SPEECH_DETECTED':
      case 'HEARING':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2E7D4F] text-white font-extrabold text-xs border border-[#2E7D4F] shadow-xs animate-pulse">
            <Mic className="w-4 h-4" />
            <span>Speech Detected • Hearing you...</span>
          </span>
        );
      case 'LISTENING':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2E7D4F]/15 text-[#2E7D4F] font-extrabold text-xs border border-[#2E7D4F]/30 animate-pulse">
            <Mic className="w-4 h-4" />
            <span>Listening...</span>
          </span>
        );
      case 'TRANSCRIBING':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-800 font-extrabold text-xs border border-indigo-200">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Transcribing...</span>
          </span>
        );
      case 'PROCESSING':
      case 'THINKING':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-[#0F5C7A] font-extrabold text-xs border border-sky-300">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Thinking...</span>
          </span>
        );
      case 'ERROR':
      case 'MIC_DENIED':
      case 'MIC_UNAVAILABLE':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#B3261E]/15 text-[#B3261E] font-extrabold text-xs border border-[#B3261E]/30">
            <AlertTriangle className="w-4 h-4" />
            <span>Error • Microphone Attention Needed</span>
          </span>
        );
      case 'CALL_ENDED':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#2E7D4F]/15 text-[#2E7D4F] font-extrabold text-xs border border-[#2E7D4F]/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>Check-in complete</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200">
            <span>Connecting...</span>
          </span>
        );
    }
  };

  // Generate dynamic symptom options tailored to the patient's health profile
  const dynamicOptionsGroup = AIService.generateDynamicSymptomOptions(
    patient,
    conversationStep,
    lastDetectedState
  );

  const isActivelyCapturingVoice =
    activeCallStatus === 'LISTENING' ||
    activeCallStatus === 'SPEECH_DETECTED' ||
    activeCallStatus === 'HEARING';

  return (
    <div className="space-y-4 pb-8">
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between min-h-[540px]">
        {/* Top Bar with Back, Restart & Timer */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
          <button
            onClick={() => {
              speechService.stopSpeaking();
              speechService.stopListening();
              setActiveView('dashboard');
            }}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#0F5C7A]" />
            <span className="text-xs font-extrabold text-slate-900">
              Morning AI Check-in
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={initiateMorningVoiceCheckIn}
              className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              title="Restart Check-in"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-[#0F5C7A]/10 text-[#0F5C7A]">
              {formatTime(callDuration)}
            </span>
          </div>
        </div>

        {/* Center Voice Interaction Stage */}
        <div className="my-auto py-3 flex flex-col items-center text-center space-y-3.5">
          {getCallStatusBadge()}

          {fallbackNoticeMessage && (
            <div className="px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-[11px] font-bold text-[#0F5C7A]">
              {fallbackNoticeMessage}
            </div>
          )}

          {/* Pulsing AI Voice / Microphone Avatar */}
          <div className="relative my-1">
            {(activeCallStatus === 'AI_SPEAKING' ||
              activeCallStatus === 'SPEAKING' ||
              activeCallStatus === 'AI_RESPONDING') && (
              <div className="absolute inset-0 rounded-full animate-pulse-ring pointer-events-none" />
            )}
            {isActivelyCapturingVoice && (
              <div className="absolute inset-0 rounded-full animate-pulse-ring-green pointer-events-none" />
            )}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-colors ${
                isActivelyCapturingVoice
                  ? 'bg-[#2E7D4F] text-white'
                  : 'bg-[#0F5C7A] text-white'
              }`}
            >
              {isActivelyCapturingVoice ? (
                <Mic className="w-9 h-9 animate-pulse" />
              ) : (
                <Sparkles className="w-9 h-9" />
              )}
            </div>
          </div>

          {/* Subtle Animated Waveform */}
          <canvas ref={canvasRef} width={240} height={36} className="mx-auto" />

          {/* Active AI Spoken Prompt Bubble */}
          <div className="w-full bg-[#F3F7FA] border border-slate-200 rounded-2xl p-4 text-left space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0F5C7A]">
                Guardian AI Voice
              </span>
              <button
                type="button"
                onClick={handleReplayAiSpeech}
                className="text-[11px] font-bold text-[#0F5C7A] hover:underline flex items-center gap-1 cursor-pointer"
                title="Replay AI Voice Audio"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear again</span>
              </button>
            </div>
            {activeCallStatus === 'CONNECTING' && !currentAiText ? (
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#0F5C7A]" />
                Connecting voice assistant...
              </p>
            ) : (
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                "{currentAiText}"
              </p>
            )}
          </div>

          {/* TTS Error Fallback Notice */}
          {ttsErrorMessage && (
            <div className="w-full p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-2">
              <span>{ttsErrorMessage}</span>
              <button
                onClick={handleReplayAiSpeech}
                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[11px] shrink-0 cursor-pointer"
              >
                Play Audio
              </button>
            </div>
          )}

          {/* Live User Spoken Transcript ("You said: ...") */}
          {patientTranscript && (
            <div className="w-full bg-emerald-50/95 border border-[#2E7D4F]/35 rounded-2xl p-3.5 text-left flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2E7D4F] block">
                  You said:
                </span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  "{patientTranscript}"
                </p>
              </div>
              {isActivelyCapturingVoice && (
                <button
                  type="button"
                  onClick={() => handlePatientResponse(patientTranscript)}
                  className="px-3 py-1.5 rounded-xl bg-[#2E7D4F] hover:bg-[#23633D] text-white font-bold text-xs shrink-0 cursor-pointer"
                >
                  Send
                </button>
              )}
            </div>
          )}

          {/* Microphone Denial / Error Handling Card with Try Again */}
          {micErrorMessage && (
            <div className="w-full p-3.5 rounded-2xl bg-[#B3261E]/10 border border-[#B3261E]/30 text-center space-y-2">
              <p className="text-xs font-extrabold text-[#B3261E]">{micErrorMessage}</p>
              <button
                onClick={async () => {
                  setMicErrorMessage(null);
                  const ok = await speechService.requestMicrophonePermission(true);
                  if (ok) {
                    listenToPatient();
                  } else if (speechService.lastMicError) {
                    setMicErrorMessage(speechService.lastMicError);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-[#B3261E] hover:bg-red-800 text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {/* DYNAMIC HEALTH-PROFILE SYMPTOM / FEELING OPTIONS (Shown during active check-in) */}
          {conversationStep !== 'COMPLETE' && !finalAssessment && (
            <div className="w-full pt-1 text-left space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                  {dynamicOptionsGroup.heading}
                </span>
                <span className="text-[10px] font-semibold text-[#0F5C7A]">
                  Speak naturally or tap an option
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {dynamicOptionsGroup.options.map((opt: DynamicSymptomOption) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handlePatientResponse(opt.spokenEquivalent, opt.label)}
                    className={`p-3.5 rounded-2xl border text-left font-bold text-xs transition-all flex items-center gap-2.5 cursor-pointer active:scale-[0.98] shadow-2xs ${
                      opt.category === 'SAFE'
                        ? 'bg-[#2E7D4F]/8 hover:bg-[#2E7D4F]/15 border-[#2E7D4F]/30 text-slate-900'
                        : opt.category === 'CRITICAL'
                        ? 'bg-[#B3261E]/10 hover:bg-[#B3261E]/15 border-[#B3261E]/30 text-[#B3261E]'
                        : 'bg-white hover:bg-sky-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span className="text-base shrink-0">{opt.emoji}</span>
                    <span className="leading-snug">{opt.label}</span>
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-slate-400 text-center pt-0.5">
                Tailored to {patient.name.split(' ')[0]}'s profile ({patient.age}y •{' '}
                {patient.healthProfile.currentHealthIssues.slice(0, 3).join(', ') ||
                  'General Wellness'}
                )
              </p>
            </div>
          )}

          {/* Structured Final AI Wellness Status Assessment Card */}
          {finalAssessment && (
            <div
              className={`w-full p-4 rounded-2xl border text-left space-y-2.5 ${
                finalAssessment.status === 'SAFE'
                  ? 'bg-[#2E7D4F]/10 border-[#2E7D4F]/30'
                  : finalAssessment.status === 'NOT_OK'
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-[#B3261E]/10 border-[#B3261E]/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                  AI Wellness Status
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    finalAssessment.status === 'SAFE'
                      ? 'bg-[#2E7D4F] text-white'
                      : finalAssessment.status === 'NOT_OK'
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#B3261E] text-white'
                  }`}
                >
                  {finalAssessment.status === 'NOT_OK' ? 'NOT OK' : finalAssessment.status}
                </span>
              </div>

              <p className="text-sm font-extrabold text-slate-900">
                {finalAssessment.status === 'SAFE'
                  ? 'Morning check-in completed.'
                  : finalAssessment.summary}
              </p>

              <div className="text-xs text-slate-700 space-y-1 pt-1 border-t border-slate-200/60">
                <p>
                  <strong>Summary:</strong> {finalAssessment.summary}
                </p>
                <p>
                  <strong>Reason:</strong> {finalAssessment.reason}
                </p>
                {finalAssessment.followUp && (
                  <p>
                    <strong>Follow-Up:</strong> {finalAssessment.followUp}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={initiateMorningVoiceCheckIn}
                  className="py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Demo</span>
                </button>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="py-2.5 rounded-xl bg-[#0F5C7A] hover:bg-[#0A4359] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return Home</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Microphone & Call Controls */}
        <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              if (nextMute) {
                speechService.stopListening();
                setActiveCallStatus('READY');
              } else {
                listenToPatient();
              }
            }}
            className={`p-3.5 rounded-full border transition-all cursor-pointer ${
              isMuted
                ? 'bg-[#B3261E]/10 text-[#B3261E] border-[#B3261E]/30'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={async () => {
              if (isActivelyCapturingVoice) {
                await speechService.finishListening();
                return;
              }
              isProcessingTurnRef.current = false;
              speechService.stopSpeaking();
              const ok = await speechService.requestMicrophonePermission(true);
              if (!ok && speechService.lastMicError) {
                setActiveCallStatus('MIC_DENIED');
                setMicErrorMessage(speechService.lastMicError);
                return;
              }
              listenToPatient();
            }}
            disabled={activeCallStatus === 'TRANSCRIBING' || activeCallStatus === 'PROCESSING'}
            className="px-5 py-3 rounded-2xl bg-[#2E7D4F] hover:bg-[#23633D] disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Mic className="w-4 h-4" />
            <span>{isActivelyCapturingVoice ? 'Done Speaking' : 'Speak Now'}</span>
          </button>

          <button
            onClick={() => {
              speechService.stopSpeaking();
              speechService.stopListening();
              endCall();
            }}
            className="p-3.5 rounded-full bg-[#B3261E] hover:bg-red-800 text-white shadow-sm transition-all cursor-pointer"
            title="Exit Check-in"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
