import { motion } from 'framer-motion';
import Icon from './Icon';

interface EmptyStateProps {
  variant: 'no-ideas' | 'no-cards' | 'no-results';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({
  variant,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  const getIllustration = () => {
    switch (variant) {
      case 'no-ideas':
        return (
          <svg
            className="w-32 h-32 mx-auto mb-6"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Light bulb illustration */}
            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
            >
              {/* Bulb glow */}
              <circle
                cx="100"
                cy="80"
                r="50"
                fill="url(#glow)"
                opacity="0.3"
              />
              <defs>
                <radialGradient id="glow">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Bulb */}
              <path
                d="M100 40 C120 40 135 55 135 75 C135 90 127 100 120 110 L80 110 C73 100 65 90 65 75 C65 55 80 40 100 40Z"
                fill="#a855f7"
                opacity="0.7"
              />

              {/* Bulb base */}
              <rect x="85" y="110" width="30" height="8" rx="2" fill="#64748b" />
              <rect x="90" y="118" width="20" height="12" rx="2" fill="#475569" />

              {/* Light rays */}
              <motion.line
                x1="100"
                y1="30"
                x2="100"
                y2="15"
                stroke="#a855f7"
                strokeWidth="3"
                strokeLinecap="round"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.line
                x1="140"
                y1="50"
                x2="152"
                y2="38"
                stroke="#a855f7"
                strokeWidth="3"
                strokeLinecap="round"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
              />
              <motion.line
                x1="60"
                y1="50"
                x2="48"
                y2="38"
                stroke="#a855f7"
                strokeWidth="3"
                strokeLinecap="round"
                animate={{ opacity: [0.4, 0.9, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
              />
            </motion.g>
          </svg>
        );

      case 'no-cards':
        return (
          <svg
            className="w-32 h-32 mx-auto mb-6"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Empty cards illustration */}
            <motion.g
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <rect
                x="30"
                y="60"
                width="140"
                height="90"
                rx="8"
                fill="#334155"
                opacity="0.3"
              />
              <rect
                x="35"
                y="65"
                width="130"
                height="80"
                rx="8"
                fill="#475569"
                opacity="0.5"
              />
              <rect
                x="40"
                y="70"
                width="120"
                height="70"
                rx="8"
                fill="#64748b"
                stroke="#a855f7"
                strokeWidth="2"
                strokeDasharray="5,5"
              />

              {/* Plus icon */}
              <motion.g
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <line
                  x1="100"
                  y1="95"
                  x2="100"
                  y2="115"
                  stroke="#a855f7"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line
                  x1="90"
                  y1="105"
                  x2="110"
                  y2="105"
                  stroke="#a855f7"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </motion.g>
            </motion.g>
          </svg>
        );

      case 'no-results':
        return (
          <svg
            className="w-32 h-32 mx-auto mb-6"
            viewBox="0 0 200 200"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Search illustration */}
            <motion.g
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
            >
              <circle
                cx="85"
                cy="85"
                r="40"
                stroke="#64748b"
                strokeWidth="6"
                fill="none"
              />
              <line
                x1="115"
                y1="115"
                x2="145"
                y2="145"
                stroke="#64748b"
                strokeWidth="6"
                strokeLinecap="round"
              />

              {/* Question mark */}
              <text
                x="85"
                y="95"
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="36"
                fontWeight="bold"
              >
                ?
              </text>
            </motion.g>
          </svg>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Illustration */}
      {getIllustration()}

      {/* Text content */}
      <h3 className="text-2xl font-bold text-text-primary mb-3">{title}</h3>
      <p className="text-text-secondary max-w-md mb-8">{description}</p>

      {/* Actions */}
      {action && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={action.onClick}
            className="btn-primary flex items-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
          >
            {action.icon && <Icon name={action.icon as any} className="w-5 h-5" />}
            {action.label}
          </button>

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="btn-secondary px-6 py-3 rounded-lg font-medium"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}

      {/* Keyboard shortcut hint */}
      {variant === 'no-ideas' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-center gap-2 text-sm text-text-muted"
        >
          <span>Press</span>
          <kbd className="px-2 py-1 text-xs font-semibold bg-surface-base border border-border-subtle rounded">
            {navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}+N
          </kbd>
          <span>to create a new idea</span>
        </motion.div>
      )}

      {variant === 'no-results' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-sm text-text-muted"
        >
          <p>Try adjusting your search or filters</p>
        </motion.div>
      )}
    </motion.div>
  );
}
