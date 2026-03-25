import React, { useState, useEffect } from 'react';
import { InvestorProfile } from '../types';

interface OnboardingDeckProps {
  onComplete: (profile: InvestorProfile, playbookAnswers: Record<string, string>) => void;
  initialProfile: InvestorProfile;
}

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: '✨' },
  { id: 'goals', title: 'Your Goals', icon: '🎯' },
  { id: 'mustHaves', title: 'Must Haves', icon: '✅' },
  { id: 'superpowers', title: 'Superpowers', icon: '⚡' },
  { id: 'time', title: 'Time Commitment', icon: '⏱️' },
  { id: 'financing', title: 'Financing', icon: '💰' },
  { id: 'operations', title: 'Operations', icon: '⚙️' },
  { id: 'sourcing', title: 'Sourcing', icon: '🔍' },
  { id: 'team', title: 'Deal Team', icon: '👥' },
  { id: 'complete', title: 'Complete', icon: '🎉' },
];

export const OnboardingDeck: React.FC<OnboardingDeckProps> = ({ onComplete, initialProfile }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [profile, setProfile] = useState<InvestorProfile>(initialProfile);
  const [playbookAnswers, setPlaybookAnswers] = useState<Record<string, string>>({});

  const currentStep = STEPS[currentStepIndex];
  const progress = Math.round((currentStepIndex / (STEPS.length - 1)) * 100);

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onComplete(profile, playbookAnswers);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const renderStepContent = () => {
    switch (currentStep.id) {
      case 'welcome':
        return (
          <div className="text-center max-w-2xl mx-auto mt-20">
            <h1 className="text-5xl font-display font-bold text-white mb-6">
              Welcome to <span className="text-amber-200">DealOS</span>
            </h1>
            <p className="text-lg text-slate-300 mb-10">
              Your journey to acquiring the perfect business starts here. Let's discover what you're looking for and match you with opportunities that align with your vision. This process will help set up your Investor Profile and generate your Personal Playbook.
            </p>
            <button 
              onClick={handleNext}
              className="bg-amber-200 hover:bg-amber-300 text-slate-900 font-bold py-3 px-8 rounded-full transition-colors flex items-center mx-auto"
            >
              Let's Get Started
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <p className="text-sm text-slate-400 mt-4">Takes ~3 minutes to complete</p>
          </div>
        );
      case 'goals':
        return (
          <div className="max-w-2xl mx-auto mt-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-amber-200/30 text-amber-200 mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-4xl font-display text-white mb-4">What are your Financial Goals?</h2>
              <p className="text-slate-300">This helps us understand your targets (e.g., $1M in annual sales, $300K SDE).</p>
            </div>
            <textarea
              value={profile.goals}
              onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
              placeholder="e.g., I want $1M in annual sales and $300K in SDE/EBITDA..."
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-6 text-white placeholder-slate-500 focus:border-amber-200 focus:ring-1 focus:ring-amber-200 transition-colors h-40 resize-none text-lg"
            />
          </div>
        );
      case 'mustHaves':
        return (
          <div className="max-w-2xl mx-auto mt-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-amber-200/30 text-amber-200 mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-display text-white mb-4">What are your Must-Haves?</h2>
              <p className="text-slate-300">List specific industries, locations, or business models you require (or want to avoid).</p>
            </div>
            <textarea
              value={profile.mustHaves}
              onChange={(e) => setProfile({ ...profile, mustHaves: e.target.value })}
              placeholder="e.g., Real-estate adjacent, landscaping, B2B bakeries. Avoid restaurants..."
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-6 text-white placeholder-slate-500 focus:border-amber-200 focus:ring-1 focus:ring-amber-200 transition-colors h-40 resize-none text-lg"
            />
          </div>
        );
      case 'superpowers':
        return (
          <div className="max-w-2xl mx-auto mt-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-amber-200/30 text-amber-200 mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-4xl font-display text-white mb-4">What are your Superpowers?</h2>
              <p className="text-slate-300">What unique skills or experiences do you bring to the table?</p>
            </div>
            <textarea
              value={profile.superpowers}
              onChange={(e) => setProfile({ ...profile, superpowers: e.target.value })}
              placeholder="e.g., 20 years of retail ops experience, multi-unit oversight..."
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-6 text-white placeholder-slate-500 focus:border-amber-200 focus:ring-1 focus:ring-amber-200 transition-colors h-40 resize-none text-lg"
            />
          </div>
        );
      case 'time':
        return (
          <div className="max-w-2xl mx-auto mt-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-amber-200/30 text-amber-200 mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-display text-white mb-4">Time Commitment</h2>
              <p className="text-slate-300">How much time can you dedicate to sourcing and diligence?</p>
            </div>
            <textarea
              value={playbookAnswers['How much time can you dedicate to sourcing and diligence?'] || ''}
              onChange={(e) => setPlaybookAnswers({ ...playbookAnswers, 'How much time can you dedicate to sourcing and diligence?': e.target.value })}
              placeholder="e.g., 2 hours per day, weekends only, full-time..."
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-6 text-white placeholder-slate-500 focus:border-amber-200 focus:ring-1 focus:ring-amber-200 transition-colors h-40 resize-none text-lg"
            />
          </div>
        );
      case 'financing':
        return (
          <div className="max-w-2xl mx-auto mt-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-amber-200/30 text-amber-200 mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-display text-white mb-4">Financing Strategy</h2>
              <p className="text-slate-300">What is your preferred financing method?</p>
            </div>
            <textarea
              value={playbookAnswers['What is your preferred financing method?'] || ''}
              onChange={(e) => setPlaybookAnswers({ ...playbookAnswers, 'What is your preferred financing method?': e.target.value })}
              placeholder="e.g., Seller Financing (SubTo), SBA 7(a), Private Money..."
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-6 text-white placeholder-slate-500 focus:border-amber-200 focus:ring-1 focus:ring-amber-200 transition-colors h-40 resize-none text-lg"
            />
          </div>
        );
      case 'operations':
        return (
          <div className="max-w-2xl mx-auto mt-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-amber-200/30 text-amber-200 mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-display text-white mb-4">Operational Strategy</h2>
              <p className="text-slate-300">What is your post-close operational strategy?</p>
            </div>
            <textarea
              value={playbookAnswers['What is your post-close operational strategy?'] || ''}
              onChange={(e) => setPlaybookAnswers({ ...playbookAnswers, 'What is your post-close operational strategy?': e.target.value })}
              placeholder="e.g., Owner-operator, Promote the #2 employee, Hire an external GM..."
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-6 text-white placeholder-slate-500 focus:border-amber-200 focus:ring-1 focus:ring-amber-200 transition-colors h-40 resize-none text-lg"
            />
          </div>
        );
      case 'sourcing':
        return (
          <div className="max-w-2xl mx-auto mt-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-amber-200/30 text-amber-200 mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-display text-white mb-4">Sourcing Strategy</h2>
              <p className="text-slate-300">How do you plan to source deals?</p>
            </div>
            <textarea
              value={playbookAnswers['How do you plan to source deals?'] || ''}
              onChange={(e) => setPlaybookAnswers({ ...playbookAnswers, 'How do you plan to source deals?': e.target.value })}
              placeholder="e.g., BizBuySell, Direct-to-seller outreach, Networking..."
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-6 text-white placeholder-slate-500 focus:border-amber-200 focus:ring-1 focus:ring-amber-200 transition-colors h-40 resize-none text-lg"
            />
          </div>
        );
      case 'team':
        return (
          <div className="max-w-2xl mx-auto mt-10">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-amber-200/30 text-amber-200 mb-6">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-display text-white mb-4">Deal Team</h2>
              <p className="text-slate-300">Do you have a deal team in place?</p>
            </div>
            <textarea
              value={playbookAnswers['Do you have a deal team in place?'] || ''}
              onChange={(e) => setPlaybookAnswers({ ...playbookAnswers, 'Do you have a deal team in place?': e.target.value })}
              placeholder="e.g., Prepaid legal, CPA, Fractional CFO, None yet..."
              className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-6 text-white placeholder-slate-500 focus:border-amber-200 focus:ring-1 focus:ring-amber-200 transition-colors h-40 resize-none text-lg"
            />
          </div>
        );
      case 'complete':
        return (
          <div className="text-center max-w-2xl mx-auto mt-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-200 text-slate-900 mb-8 shadow-[0_0_30px_rgba(253,230,138,0.3)]">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-5xl font-display font-bold text-white mb-6">
              You're all set!
            </h1>
            <p className="text-lg text-slate-300 mb-10">
              Congrats! We're now building your personalized deal pipeline. Sit back while we automatically surface acquisitions tailored to your goals, budget, and preferences.
            </p>
            <button 
              onClick={handleNext}
              className="bg-amber-200 hover:bg-amber-300 text-slate-900 font-bold py-3 px-8 rounded-full transition-colors flex items-center mx-auto"
            >
              View My Deal Pipeline
              <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <p className="text-sm text-slate-400 mt-4">You can always update your preferences in settings</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex bg-slate-900 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col z-10">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-display font-bold text-white">BizScout</h1>
          <p className="text-xs text-slate-400">DealOS</p>
        </div>
        
        <div className="p-4">
          <div className="text-xs font-bold text-slate-500 mb-4 flex justify-between items-center tracking-wider">
            DEALOS ONBOARDING
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
          
          <div className="space-y-1">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isPast = idx < currentStepIndex;
              
              return (
                <div 
                  key={step.id}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive ? 'text-amber-200 bg-slate-700/50' : 
                    isPast ? 'text-slate-300 hover:bg-slate-700/30 cursor-pointer' : 
                    'text-slate-500'
                  }`}
                  onClick={() => isPast && setCurrentStepIndex(idx)}
                >
                  <span className="mr-3 flex items-center justify-center w-5">
                    {isPast ? (
                      <svg className="w-4 h-4 text-amber-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </span>
                  {step.title}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Background" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-slate-900/40"></div>
        </div>

        {/* Top Bar */}
        <div className="h-16 border-b border-slate-700/50 flex items-center px-8 z-10 bg-slate-900/50 backdrop-blur-sm">
          <div className="flex-1">
            <h2 className="text-white font-medium">Onboarding</h2>
            <p className="text-xs text-slate-400">
              Question {currentStepIndex} of {STEPS.length - 1} • {progress}% complete
            </p>
          </div>
          <div className="w-1/3 bg-slate-800 h-1 rounded-full overflow-hidden">
            <div 
              className="bg-amber-200 h-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto z-10 flex flex-col p-8">
          <div className="flex-1 flex flex-col justify-center">
            {renderStepContent()}
          </div>
        </div>

        {/* Bottom Bar */}
        {currentStep.id !== 'welcome' && currentStep.id !== 'complete' && (
          <div className="h-20 border-t border-slate-700/50 flex items-center justify-between px-8 z-10 bg-slate-900/50 backdrop-blur-sm">
            <button 
              onClick={handleBack}
              className="px-6 py-2 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Back
            </button>
            <div className="flex space-x-4">
              <button 
                onClick={handleSkip}
                className="px-6 py-2 rounded-full border border-slate-600 text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Skip
              </button>
              <button 
                onClick={handleNext}
                className="px-6 py-2 rounded-full bg-amber-200 hover:bg-amber-300 text-slate-900 font-medium transition-colors flex items-center"
              >
                Continue
                <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
