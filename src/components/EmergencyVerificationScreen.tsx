import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Mic, AlertTriangle, ShieldCheck, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { speechService } from '../services/speechService';

export const EmergencyVerificationScreen: React.FC = () => {
  const { patient, setActiveModal } = useApp();
  const [aiQuestion, setAiQuestion] = useState<string>("Can you hear me? Are you okay? Do you need assistance?");
  const [patientAnswer, setPatientAnswer] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    // Speak verification questions
    speechService.speak(aiQuestion, () => {
      // Start listening after question
      speechService.startListening((text, isFinal) => {
        setPatientAnswer(text);
        if (isFinal) {
          handleVerificationResponse(text);
        }
      });
    });

    // Request camera stream if video preference enabled
    if (patient.enableVideo) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: true })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setCameraActive(true);
            }
          })
          .catch((err) => {
            console.warn('Camera access error or denied:', err);
            setCameraActive(false);
          });
      }
    }

    return () => {
      speechService.stopSpeaking();
      speechService.stopListening();
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleVerificationResponse = (text: string) => {
    speechService.stopListening();
    setPatientAnswer(text);
    setTimeout(() => {
      setActiveModal('simulated_emergency');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold">Emergency Verification Mode</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
            ESCALATION ACTIVE
          </span>
        </div>

        {/* Video Preview Container (If Video Enabled) */}
        {patient.enableVideo ? (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-slate-800 flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/80">
                <Video className="w-8 h-8 text-cyan-400 mb-2 animate-pulse" />
                <p className="text-xs text-slate-300 font-semibold">Simulated Video Feed Verification</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Broad supporting signal only. Facial expression does not make medical diagnosis.
                </p>
              </div>
            )}
            <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded-lg text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Camera Preview
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 bg-slate-950 border border-slate-800 text-center space-y-2">
            <VideoOff className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-xs text-slate-300 font-semibold">Video Verification Disabled in Profile</p>
            <p className="text-[10px] text-slate-500">
              Complete emergency voice verification workflow active without requesting camera permission.
            </p>
          </div>
        )}

        {/* AI Voice Question Card */}
        <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 text-center">
          <p className="text-xs text-cyan-400 font-bold uppercase tracking-wider mb-1">AI Assistant Voice Query</p>
          <p className="text-base font-semibold text-white">"{aiQuestion}"</p>
        </div>

        {/* Live Patient Transcript */}
        {patientAnswer && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300">
            <span className="text-slate-400 font-bold block mb-1">Patient Response Detected:</span>
            "{patientAnswer}"
          </div>
        )}

        {/* Quick Simulated Response Buttons */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => handleVerificationResponse("I need immediate help")}
            className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold text-white shadow-md text-center cursor-pointer"
          >
            "I NEED HELP"
          </button>
          <button
            onClick={() => handleVerificationResponse("I'm feeling better now, stop dispatch")}
            className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-md text-center cursor-pointer"
          >
            "I'M SAFE NOW"
          </button>
        </div>

        {/* Continue to Simulated Dispatch */}
        <button
          onClick={() => setActiveModal('simulated_emergency')}
          className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer"
        >
          Proceed to Simulated Emergency Payload
        </button>
      </div>
    </div>
  );
};
