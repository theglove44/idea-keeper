import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KEYBOARD_SHORTCUTS, getShortcutDisplay } from '../hooks/useKeyboardShortcut';
import { useFocusTrap } from '../hooks/useFocusTrap';
import Icon from './Icon';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap({
    active: isOpen,
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
    onEscape: onClose,
  });

  // Group shortcuts by category
  const categories = KEYBOARD_SHORTCUTS.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, typeof KEYBOARD_SHORTCUTS>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-help-title"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-surface-dark border border-border-subtle rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-purple/10 to-brand-cyan/10 border-b border-border-subtle px-6 py-4 flex items-center justify-between">
              <div>
                <h2 id="shortcuts-help-title" className="text-xl font-semibold text-text-primary">
                  Keyboard Shortcuts
                </h2>
                <p className="text-sm text-text-secondary mt-1">
                  Master these shortcuts to boost your productivity
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="text-text-secondary hover:text-text-primary transition-colors p-2 hover:bg-surface-elevated rounded-lg"
                aria-label="Close"
              >
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(80vh-5rem)] scrollbar-custom">
              <div className="p-6 space-y-6">
                {Object.entries(categories).map(([category, shortcuts]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-brand-purple uppercase tracking-wide mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {shortcuts.map((shortcut, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-surface-elevated transition-colors"
                        >
                          <span className="text-text-primary text-sm">
                            {shortcut.description}
                          </span>
                          <kbd className="px-3 py-1.5 text-xs font-semibold text-text-primary bg-surface-base border border-border-subtle rounded-md shadow-sm">
                            {getShortcutDisplay(shortcut.options)}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border-subtle px-6 py-4 bg-surface-elevated">
              <p className="text-xs text-text-secondary text-center">
                Press <kbd className="px-2 py-0.5 text-xs font-semibold bg-surface-base border border-border-subtle rounded">?</kbd> anytime to view this help
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
