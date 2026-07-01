import React, { useState } from 'react';

/**
 * ExchangeRequestModal Component
 * A modal for sending skill exchange requests between students
 */

// Types for the modal props
interface ExchangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  skillWanted: string;
  recipientSkills: string[];
  userTeachingSkills: { id: string; title: string }[];
  onSubmit: (request: SkillExchangeRequest) => void;
}

export interface SkillExchangeRequest {
  recipientName: string;
  skillWanted: string;
  skillOffered: string;
  message: string;
}

/**
 * ExchangeRequestModal Component
 */
const ExchangeRequestModal: React.FC<ExchangeRequestModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  skillWanted,
  recipientSkills: _recipientSkills,
  userTeachingSkills,
  onSubmit
}) => {
  // Form state
  const [selectedSkill, setSelectedSkill] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'select' | 'message' | 'confirm'>('select');

  // Handle skill selection
  const handleSkillSelect = (skillId: string) => {
    setSelectedSkill(skillId);
    setStep('message');
  };

  // Handle message change
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedSkillData = userTeachingSkills.find(s => s.id === selectedSkill);
    
    const request: SkillExchangeRequest = {
      recipientName,
      skillWanted,
      skillOffered: selectedSkillData?.title || '',
      message
    };

    onSubmit(request);
    handleClose();
  };

  // Reset and close
  const handleClose = () => {
    setSelectedSkill('');
    setMessage('');
    setStep('select');
    onClose();
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Skill Exchange Request</h2>
              <p className="text-indigo-100 text-sm mt-1">
                Exchange skills with {recipientName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <StepIndicator 
              number={1} 
              label="Select Skill" 
              active={step === 'select'} 
              completed={step !== 'select'}
            />
            <div className="flex-1 h-1 mx-2 bg-gray-200 dark:bg-gray-700">
              <div 
                className={`h-full bg-indigo-600 transition-all duration-300 ${
                  step !== 'select' ? 'w-full' : 'w-0'
                }`}
              />
            </div>
            <StepIndicator 
              number={2} 
              label="Add Message" 
              active={step === 'message'} 
              completed={step === 'confirm'}
            />
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 1: Select Skill to Offer */}
          {step === 'select' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4">
                <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                  You want to learn:
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {skillWanted}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select a skill to offer in exchange:
                </label>
                
                {userTeachingSkills.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {userTeachingSkills.map((skill) => (
                      <label
                        key={skill.id}
                        className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedSkill === skill.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="skill"
                          value={skill.id}
                          checked={selectedSkill === skill.id}
                          onChange={() => handleSkillSelect(skill.id)}
                          className="sr-only"
                        />
                        <div className="w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center">
                          {selectedSkill === skill.id && (
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {skill.title}
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-gray-500 dark:text-gray-400">
                      You haven't added any skills to teach yet.
                    </p>
                    <a 
                      href="/manage-skills" 
                      className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                      Add skills here
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Add Message */}
          {step === 'message' && (
            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  You'll offer:
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {userTeachingSkills.find(s => s.id === selectedSkill)?.title}
                </p>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add a message (optional):
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={handleMessageChange}
                  rows={4}
                  placeholder="Hi! I'd love to exchange skills with you. I can teach you..."
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {step === 'message' && (
              <button
                type="button"
                onClick={() => setStep('select')}
                className="flex-1 px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="submit"
              disabled={step === 'select'}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                step === 'select'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-[1.02]'
              }`}
            >
              {step === 'select' ? 'Select a Skill' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * StepIndicator Component
 * Shows progress through the form
 */
const StepIndicator: React.FC<{
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}> = ({ number, label, active, completed }) => (
  <div className="flex flex-col items-center">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
      completed 
        ? 'bg-green-500 text-white' 
        : active 
          ? 'bg-indigo-600 text-white' 
          : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
    }`}>
      {completed ? '✓' : number}
    </div>
    <span className={`text-xs mt-1 ${active ? 'text-indigo-600 dark:text-indigo-400 font-medium' : 'text-gray-500'}`}>
      {label}
    </span>
  </div>
);

export default ExchangeRequestModal;