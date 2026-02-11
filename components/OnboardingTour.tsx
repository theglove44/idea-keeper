import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from './Icon';
import useLocalStorage from '../hooks/useLocalStorage';

interface TourStep {
  title: string;
  description: string;
  target?: string; // CSS selector for the element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: () => void;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: '👋 Welcome to Idea Keeper!',
    description:
      "Let's take a quick tour to help you get started. This will only take a minute.",
    position: 'bottom',
  },
  {
    title: '💡 Create Your First Idea',
    description:
      'Click the "New Idea" button to start organizing your thoughts. Each idea has its own kanban board.',
    target: '[data-tour="new-idea-button"]',
    position: 'right',
  },
  {
    title: '📋 Kanban Boards',
    description:
      'Each idea has a kanban board with customizable columns. Drag cards between columns to track progress.',
    target: '[data-tour="kanban-board"]',
    position: 'top',
  },
  {
    title: '✨ AI Brainstorming',
    description:
      'Use the AI brainstorm feature to generate ideas and expand your thinking. It\'s like having a creative partner!',
    target: '[data-tour="brainstorm-button"]',
    position: 'top',
  },
  {
    title: '⌨️ Keyboard Shortcuts',
    description:
      'Press ? to see all keyboard shortcuts. Use Cmd/Ctrl+K for quick search, J/K to navigate ideas, and more!',
    position: 'bottom',
  },
  {
    title: '🎉 You\'re All Set!',
    description:
      'Start capturing your ideas and watch them come to life. Happy organizing!',
    position: 'bottom',
  },
];

interface OnboardingTourProps {
  onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Update target element position
  useEffect(() => {
    if (!step.target) {
      setTargetRect(null);
      return;
    }

    const updatePosition = () => {
      const element = document.querySelector(step.target!);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    updatePosition();

    // Update position on resize/scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [step.target]);

  const handleNext = () => {
    if (step.action) {
      step.action();
    }

    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const padding = 20;
    const position = step.position || 'bottom';

    switch (position) {
      case 'top':
        return {
          top: `${targetRect.top - padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translate(-50%, -100%)',
        };
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translate(-50%, 0)',
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.left - padding}px`,
          transform: 'translate(-100%, -50%)',
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: 'translate(0, -50%)',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop with spotlight */}
      <div className="absolute inset-0 pointer-events-none">
        <svg className="w-full h-full">
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 4}
                  y={targetRect.top - 4}
                  width={targetRect.width + 8}
                  height={targetRect.height + 8}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.7)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      </div>

      {/* Highlight border */}
      {targetRect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute pointer-events-none border-4 border-brand-purple rounded-lg shadow-lg shadow-brand-purple/50"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      {/* Tooltip */}
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
        key={currentStep}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute pointer-events-auto bg-surface-dark border border-border-subtle rounded-xl shadow-2xl p-6 max-w-md"
        style={getTooltipPosition()}
        tabIndex={-1}
      >
        {/* Progress indicator */}
        <div className="flex items-center gap-1 mb-4">
          {TOUR_STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-1 rounded-full flex-1 transition-colors ${
                index <= currentStep ? 'bg-brand-purple' : 'bg-surface-elevated'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 id="onboarding-tour-title" className="text-xl font-semibold text-text-primary mb-2">
          {step.title}
        </h3>
        <p className="text-text-secondary text-sm mb-6">{step.description}</p>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleSkip}
            className="text-text-muted hover:text-text-secondary text-sm transition-colors"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 text-sm font-semibold bg-brand-purple text-white rounded-lg hover:bg-brand-purple/90 transition-colors"
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>

        {/* Step counter */}
        <div className="text-xs text-text-muted text-center mt-4">
          Step {currentStep + 1} of {TOUR_STEPS.length}
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Hook to manage onboarding tour state
 */
export function useOnboarding() {
  const [hasCompletedTour, setHasCompletedTour] = useLocalStorage(
    'onboarding_completed',
    false
  );
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Show tour for first-time users after a short delay
    if (!hasCompletedTour) {
      const timer = setTimeout(() => setShowTour(true), 500);
      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour]);

  const completeTour = () => {
    setHasCompletedTour(true);
    setShowTour(false);
  };

  const resetTour = () => {
    setHasCompletedTour(false);
    setShowTour(true);
  };

  return {
    showTour,
    completeTour,
    resetTour,
    hasCompletedTour,
  };
}
