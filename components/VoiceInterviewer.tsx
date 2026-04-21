import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Type } from '@google/genai';

// Initialize audio context lazily
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
    if (!audioContext || audioContext.state === 'closed') {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContext;
};

interface VoiceInterviewerProps {
    currentStepId: string;
    onSaveAnswer: (stepId: string, answer: string) => void;
    onNext: () => void;
    steps: { id: string, title: string, prompt: string }[];
}

export const VoiceInterviewer: React.FC<VoiceInterviewerProps> = ({ currentStepId, onSaveAnswer, onNext, steps }) => {
    const [isActive, setIsActive] = useState(false);
    const sessionPromiseRef = useRef<Promise<any> | null>(null);
    const mediaRecorderRef = useRef<any>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);
    const nextPlayTimeRef = useRef(0);
    const scriptProcessorRef = useRef<any>(null);

    const startSession = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { sampleRate: 16000, channelCount: 1 } });
            setIsActive(true);

            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            
            // Audio context for recording at 16000Hz to match Gemini input requirements
            const ac = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            const source = ac.createMediaStreamSource(stream);
            
            // createScriptProcessor is deprecated but widely supported and easier for basic PCM extraction
            const processor = ac.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                
                // Convert int16 pcm to base64
                const bytes = new Uint8Array(pcm16.buffer);
                let binary = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                const base64Data = btoa(binary);

                if (sessionPromiseRef.current) {
                    sessionPromiseRef.current.then((session: any) => {
                        session.sendRealtimeInput({
                            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                        });
                    });
                }
            };
            
            source.connect(processor);
            processor.connect(ac.destination); // Required for some browsers to trigger events

            const sessionPromise = ai.live.connect({
                model: "gemini-3.1-flash-live-preview",
                callbacks: {
                    onopen: () => {
                        console.log("Voice connected");
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        // Play back audio
                        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (base64Audio) {
                            playAudioChunk(base64Audio);
                        }
                        
                        // Handle interruption
                        if (message.serverContent?.interrupted) {
                            audioQueueRef.current = [];
                            isPlayingRef.current = false;
                            nextPlayTimeRef.current = 0;
                        }
                        
                        // Handle tool calls
                        const toolCalls = message.toolCall?.functionCalls;
                        if (toolCalls && toolCalls.length > 0) {
                            for (const call of toolCalls) {
                                if (call.name === 'saveAnswerAndProceed') {
                                    const args = call.args as any;
                                    onSaveAnswer(args.stepId, args.answer);
                                    onNext();
                                    
                                    sessionPromise.then(s => {
                                        if (s.sendToolResponse) {
                                            s.sendToolResponse({
                                                functionResponses: [{
                                                    name: 'saveAnswerAndProceed',
                                                    id: call.id,
                                                    response: { status: 'success' }
                                                }]
                                            });
                                        } else {
                                            s.send({ toolResponse: { functionResponses: [{ name: 'saveAnswerAndProceed', id: call.id, response: { status: 'success' } }] } });
                                        }
                                    });
                                }
                            }
                        }
                    },
                    onerror: (e) => console.error("Live API Error:", e),
                    onclose: () => setIsActive(false),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
                    },
                    systemInstruction: `You are a helpful and charismatic AI onboarding assistant.
Your job is to verbally guide the user through their onboarding profile.
Currently, the user is on the '${currentStepId}' step.
Ask them the relevant question. Listen to their response. Wait for their response. Do NOT answer for them.
Once they provide an answer, immediately call the 'saveAnswerAndProceed' function with the stepId and their answer. This will advance the UI automatically. Do not say you are moving to the next page until after the step changes and your system prompt updates. Keep it conversational and very brief!`,
                    tools: [{
                        functionDeclarations: [{
                            name: "saveAnswerAndProceed",
                            description: "Saves the user's verbal answer for the current onboarding step, and automatically navigates them to the next step.",
                            parameters: {
                                type: Type.OBJECT,
                                properties: {
                                    stepId: { type: Type.STRING, description: "The ID of the step, e.g., 'goals', 'mustHaves'" },
                                    answer: { type: Type.STRING, description: "The user's response to be typed into the UI" }
                                },
                                required: ["stepId", "answer"]
                            }
                        }]
                    }]
                },
            });
            
            sessionPromiseRef.current = sessionPromise;

        } catch (e) {
            console.error("Failed to start voice interviewer", e);
            alert("Could not access microphone.");
        }
    };

    const playAudioChunk = (base64Audio: string) => {
        const ctx = getAudioContext();
        
        // base64 to array buffer
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        // The output is 24kHz PCM 16-bit
        const int16Array = new Int16Array(bytes.buffer);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0;
        }

        const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);
        
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        
        // Schedule gapless playback
        if (!isPlayingRef.current || nextPlayTimeRef.current < ctx.currentTime) {
            nextPlayTimeRef.current = ctx.currentTime;
            isPlayingRef.current = true;
        }
        
        source.start(nextPlayTimeRef.current);
        nextPlayTimeRef.current += audioBuffer.duration;
        
        source.onended = () => {
            if (ctx.currentTime >= nextPlayTimeRef.current) {
                isPlayingRef.current = false;
            }
        };
    };

    const stopSession = () => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(s => s.close());
            sessionPromiseRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        setIsActive(false);
        isPlayingRef.current = false;
        nextPlayTimeRef.current = 0;
    };

    // Update system instruction when step changes
    useEffect(() => {
        if (isActive && sessionPromiseRef.current) {
             const stepTitle = steps.find(s => s.id === currentStepId)?.title || currentStepId;
             // Send a message to prompt the AI to introduce the new step
             sessionPromiseRef.current.then((session: any) => {
                  session.send({
                      clientContent: {
                          turns: [{ role: 'user', parts: [{ text: `System: The user has advanced to the '${stepTitle}' step. Please ask them about it.` }] }],
                          turnComplete: true
                      }
                  });
             });
        }
    }, [currentStepId, isActive]);

    useEffect(() => {
        return () => stopSession();
    }, []);

    return (
        <button
            onClick={isActive ? stopSession : startSession}
            className={`flex items-center px-4 py-2 rounded-full font-medium transition-all shadow-lg ${isActive ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' : 'bg-slate-700 hover:bg-slate-600 text-amber-400 border border-amber-400/50'}`}
        >
            {isActive ? (
                <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                    Stop Interviewer
                </>
            ) : (
                <>
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Enable Voice Interviewer
                </>
            )}
        </button>
    );
}
