import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Modality, Type } from '@google/genai';

interface VoiceOnboardingAgentProps {
  currentStepId: string;
  onUpdateAnswer: (stepId: string, answer: string) => void;
  onNextStep: () => void;
}

export const VoiceOnboardingAgent: React.FC<VoiceOnboardingAgentProps> = ({
  currentStepId,
  onUpdateAnswer,
  onNextStep
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [language, setLanguage] = useState<'English' | 'Spanish'>('English');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Ready');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackContextRef = useRef<AudioContext | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  // We need to keep refs to the latest props so the tool callbacks use the latest functions
  const onUpdateAnswerRef = useRef(onUpdateAnswer);
  const onNextStepRef = useRef(onNextStep);
  const currentStepIdRef = useRef(currentStepId);

  useEffect(() => {
    onUpdateAnswerRef.current = onUpdateAnswer;
    onNextStepRef.current = onNextStep;
    currentStepIdRef.current = currentStepId;
  }, [onUpdateAnswer, onNextStep, currentStepId]);

  const stopSession = () => {
    setIsActive(false);
    setStatus('Ready');
    if (sessionRef.current) {
      try {
        sessionRef.current.close();
      } catch (e) {}
      sessionRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (playbackContextRef.current) {
      playbackContextRef.current.close();
      playbackContextRef.current = null;
    }
  };

  const startSession = async () => {
    try {
      setError(null);
      setStatus('Connecting...');
      setIsActive(true);
      
      const apiKey = process.env.GEMINI_API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });

      const playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      playbackContextRef.current = playbackContext;
      nextPlayTimeRef.current = playbackContext.currentTime;

      const playAudio = (base64: string) => {
        const binary = atob(base64);
        const buffer = new ArrayBuffer(binary.length);
        const view = new Uint8Array(buffer);
        for (let i = 0; i < binary.length; i++) {
          view[i] = binary.charCodeAt(i);
        }
        const pcm16 = new Int16Array(buffer);
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768;
        }
        
        const audioBuffer = playbackContext.createBuffer(1, float32.length, 24000);
        audioBuffer.getChannelData(0).set(float32);
        
        const source = playbackContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(playbackContext.destination);
        
        const playTime = Math.max(playbackContext.currentTime, nextPlayTimeRef.current);
        source.start(playTime);
        nextPlayTimeRef.current = playTime + audioBuffer.duration;
      };

      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: async () => {
            setStatus('Listening...');
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              streamRef.current = stream;
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
              audioContextRef.current = audioContext;
              const source = audioContext.createMediaStreamSource(stream);
              const processor = audioContext.createScriptProcessor(4096, 1, 1);
              processorRef.current = processor;

              processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
                }
                const buffer = new Uint8Array(pcm16.buffer);
                let binary = '';
                for (let i = 0; i < buffer.byteLength; i++) {
                  binary += String.fromCharCode(buffer[i]);
                }
                const base64 = btoa(binary);
                
                sessionPromise.then((session) => {
                  if (isActive) {
                    session.sendRealtimeInput({
                      audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
                    });
                  }
                });
              };
              source.connect(processor);
              processor.connect(audioContext.destination);
            } catch (err: any) {
              setError("Microphone access denied or error: " + err.message);
              stopSession();
            }
          },
          onmessage: async (message: any) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              playAudio(base64Audio);
            }
            
            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = playbackContext.currentTime;
            }

            const toolCalls = message.toolCall?.functionCalls;
            if (toolCalls) {
              const responses = [];
              for (const call of toolCalls) {
                if (call.name === 'updateAnswer') {
                  const args = call.args;
                  if (args && args.stepId && args.answer) {
                    onUpdateAnswerRef.current(args.stepId, args.answer);
                    responses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: "Answer updated successfully." }
                    });
                  }
                } else if (call.name === 'nextStep') {
                  onNextStepRef.current();
                  responses.push({
                    id: call.id,
                    name: call.name,
                    response: { result: "Moved to next step." }
                  });
                }
              }
              if (responses.length > 0) {
                sessionPromise.then((session) => {
                  session.sendToolResponse({ functionResponses: responses });
                });
              }
            }
          },
          onerror: (err: any) => {
            console.error("Live API Error:", err);
            setError("Connection error.");
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: `You are a helpful onboarding voice assistant for Acquisition Edge. Your job is to guide the user through a series of questions to build their investor profile.
The user is currently on the step: ${currentStepIdRef.current}.
The steps are:
0. welcome: Greet the user and introduce the onboarding process.
1. goals: What are your financial targets (e.g., $1M in annual sales, $300K SDE)?
2. mustHaves: List specific industries, locations, or business models you require (or want to avoid).
3. superpowers: What unique skills or experiences do you bring to the table?
4. time: How much time can you dedicate to sourcing and diligence?
5. financing: What is your preferred financing method?
6. operations: What is your post-close operational strategy?
7. sourcing: How do you plan to source deals?
8. team: Do you have a deal team in place?
9. complete: Congratulate the user on completing the onboarding.

Language: The user has selected ${language}. You must speak to the user in ${language}.

Instructions:
- If the current step is 'welcome', greet the user, briefly explain that you will ask them a few questions, and use the 'nextStep' tool to move to the first question.
- For question steps (goals to team): Ask the question for the current step. Wait for the user to answer.
- When the user answers, use the 'updateAnswer' tool to save their answer.
  - IMPORTANT: If the user speaks in Spanish, you MUST translate their answer to English and save a bilingual version (e.g., 'Spanish Answer / English Translation') using the 'updateAnswer' tool. If English, just save the English answer.
- After saving the answer, use the 'nextStep' tool to move to the next step.
- Then ask the question for the new step.
- Keep your spoken responses brief and conversational.
- When the step is 'complete', tell the user they are done and they can close the voice assistant.`,
          tools: [{
            functionDeclarations: [
              {
                name: 'updateAnswer',
                description: 'Update the answer for a specific onboarding question.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    stepId: {
                      type: Type.STRING,
                      description: 'The ID of the step (goals, mustHaves, superpowers, time, financing, operations, sourcing, team)',
                    },
                    answer: {
                      type: Type.STRING,
                      description: "The user's answer. If Spanish, provide bilingual version.",
                    }
                  },
                  required: ['stepId', 'answer']
                }
              },
              {
                name: 'nextStep',
                description: 'Move to the next step in the onboarding process.',
                parameters: {
                  type: Type.OBJECT,
                  properties: {},
                }
              }
            ]
          }]
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) {
      setError(err.message);
      stopSession();
    }
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col items-end">
      {isOpen && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 mb-4 w-72 transform transition-all">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-bold flex items-center">
              <svg className="w-4 h-4 mr-2 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice Assistant
            </h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {!isActive ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Language</label>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setLanguage('English')}
                    className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${language === 'English' ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                  >
                    English
                  </button>
                  <button 
                    onClick={() => setLanguage('Spanish')}
                    className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${language === 'Spanish' ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                  >
                    Español
                  </button>
                </div>
              </div>
              <button 
                onClick={startSession}
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-2 rounded transition-colors flex justify-center items-center"
              >
                Start Voice Guide
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-amber-400/20 rounded-full animate-ping absolute inset-0"></div>
                  <div className="w-16 h-16 bg-amber-400 rounded-full flex items-center justify-center relative z-10">
                    <svg className="w-8 h-8 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="text-center text-sm font-medium text-amber-400">
                {status}
              </div>
              <button 
                onClick={stopSession}
                className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-2 rounded transition-colors"
              >
                End Session
              </button>
            </div>
          )}
          {error && (
            <div className="mt-4 text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-900/50">
              {error}
            </div>
          )}
        </div>
      )}
      
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold py-3 px-6 rounded-full shadow-lg shadow-amber-400/20 transition-transform transform hover:-translate-y-1 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          Complete by Voice
        </button>
      )}
    </div>
  );
};
