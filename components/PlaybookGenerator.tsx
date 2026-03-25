import React, { useState } from 'react';
import { InvestorProfile } from '../types';
import { generatePersonalizedPlaybook } from '../services/geminiService';
import Markdown from 'react-markdown';

interface PlaybookGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  investorProfile: InvestorProfile;
}

const QUESTIONS = [
  {
    id: 'time',
    question: 'How much time can you dedicate to sourcing and diligence?',
    placeholder: 'e.g., 2 hours per day, weekends only, full-time...',
  },
  {
    id: 'financing',
    question: 'What is your preferred financing method?',
    placeholder: 'e.g., Seller Financing (SubTo), SBA 7(a), Private Money, Self-funded...',
  },
  {
    id: 'operations',
    question: 'What is your post-close operational strategy?',
    placeholder: 'e.g., Owner-operator, Promote the #2 employee, Hire an external GM...',
  },
  {
    id: 'sourcing',
    question: 'How do you plan to source deals?',
    placeholder: 'e.g., BizBuySell, Direct-to-seller outreach, Networking...',
  },
  {
    id: 'team',
    question: 'Do you have a deal team in place?',
    placeholder: 'e.g., Prepaid legal, CPA, Fractional CFO, None yet...',
  },
];

export const PlaybookGenerator: React.FC<PlaybookGeneratorProps> = ({ isOpen, onClose, investorProfile }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [playbook, setPlaybook] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      const savedAnswers = localStorage.getItem('dealos_playbook_answers');
      if (savedAnswers) {
        try {
          setAnswers(JSON.parse(savedAnswers));
        } catch (e) {
          console.error("Failed to parse saved playbook answers", e);
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      handleGenerate();
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generatePersonalizedPlaybook(investorProfile, answers);
      setPlaybook(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate playbook');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!playbook) return;
    const blob = new Blob([playbook], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'My_Acquisition_Playbook.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentQ = QUESTIONS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center">
            <svg className="w-5 h-5 mr-2 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            Personalized Playbook Generator
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {!playbook && !isGenerating && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-8">
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                  Step {step + 1} of {QUESTIONS.length}
                </div>
                <div className="flex space-x-1">
                  {QUESTIONS.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 w-8 rounded-full ${idx <= step ? 'bg-amber-500' : 'bg-slate-700'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-lg font-medium text-white">
                  {currentQ.question}
                </label>
                <textarea
                  value={answers[currentQ.question] || ''}
                  onChange={(e) => setAnswers({ ...answers, [currentQ.question]: e.target.value })}
                  placeholder={currentQ.placeholder}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors h-32 resize-none"
                />
              </div>
            </div>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <svg className="w-12 h-12 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <p className="text-slate-300 font-medium animate-pulse">Drafting your personalized playbook...</p>
              <p className="text-slate-500 text-sm text-center max-w-md">
                Synthesizing your Investor Profile with your specific operational and financing strategies using the Contrarian framework.
              </p>
            </div>
          )}

          {playbook && !isGenerating && (
            <div className="prose prose-invert prose-amber max-w-none">
              <div className="bg-slate-900 p-6 rounded-lg border border-slate-700">
                <Markdown>{playbook}</Markdown>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center">
          {!playbook && !isGenerating ? (
            <>
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                Back
              </button>
              <div className="flex space-x-4">
                {step < QUESTIONS.length - 1 && QUESTIONS.every(q => answers[q.question]?.trim()) && (
                  <button
                    onClick={handleGenerate}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded font-medium transition-colors"
                  >
                    Generate Now
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={!answers[currentQ.question]?.trim()}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {step === QUESTIONS.length - 1 ? 'Generate Playbook' : 'Next'}
                </button>
              </div>
            </>
          ) : playbook ? (
            <>
              <button
                onClick={() => {
                  setPlaybook(null);
                  setStep(0);
                  setAnswers({});
                }}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Start Over
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(playbook);
                    alert('Playbook copied to clipboard!');
                  }}
                  className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded font-medium transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-6 py-2 rounded font-medium transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download .md
                </button>
              </div>
            </>
          ) : <div />}
        </div>

      </div>
    </div>
  );
};
