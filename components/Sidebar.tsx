import React from 'react';
import { motion } from 'framer-motion';
import { Idea } from '../types';
import Icon from './Icon';

type SidebarProps = {
  ideas: Idea[];
  selectedIdeaId: string | null;
  onSelectIdea: (id: string) => void;
  onNewIdea: () => void;
  onDeleteIdea: (id: string) => void;
};

const Sidebar: React.FC<SidebarProps> = ({ ideas, selectedIdeaId, onSelectIdea, onNewIdea, onDeleteIdea }) => {
  return (
    <aside className="w-1/3 max-w-xs h-full bg-surface-elevated/80 backdrop-blur-xl border-r border-border flex flex-col">
      <motion.div
        className="p-6 flex justify-between items-center border-b border-border flex-shrink-0 bg-gradient-to-r from-brand-purple-900/10 to-brand-cyan-900/10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-gradient-brand">Idea Spark</h1>
        <motion.button
          onClick={onNewIdea}
          className="p-2 rounded-lg bg-gradient-to-r from-brand-purple-600 to-brand-cyan-600 text-white hover:shadow-glow-purple transition-all duration-200"
          aria-label="New Idea"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <Icon name="plus" className="w-5 h-5" />
        </motion.button>
      </motion.div>
      <div className="overflow-y-auto p-3 flex-grow scrollbar-custom">
        <ul className="space-y-2">
          {ideas.length > 0 ? (
            ideas.map((idea, index) => (
              <motion.li
                key={idea.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <motion.button
                  onClick={() => onSelectIdea(idea.id)}
                  className={`w-full text-left p-4 rounded-xl group transition-all duration-200 flex justify-between items-start ${
                    selectedIdeaId === idea.id
                      ? 'bg-gradient-to-r from-brand-purple-600 to-brand-cyan-600 text-white shadow-card'
                      : 'bg-surface-elevated/50 text-text-primary hover:bg-surface-overlay border border-border/50 hover:border-border'
                  }`}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex-grow pr-2">
                    <h3 className="font-semibold truncate mb-1">{idea.title}</h3>
                    {idea.summary && (
                      <p className={`text-sm truncate ${selectedIdeaId === idea.id ? 'text-white/80' : 'text-text-tertiary'}`}>
                        {idea.summary}
                      </p>
                    )}
                  </div>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteIdea(idea.id);
                    }}
                    className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 ${
                      selectedIdeaId === idea.id
                        ? 'hover:bg-white/20'
                        : 'hover:bg-surface-overlay'
                    }`}
                    aria-label={`Delete ${idea.title}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </motion.button>
                </motion.button>
              </motion.li>
            ))
          ) : (
            <motion.div
              className="text-center text-text-tertiary p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="mb-2">No ideas yet.</p>
              <p className="text-text-muted">Click the '+' to add your first one!</p>
            </motion.div>
          )}
        </ul>
      </div>
      <div className="p-3 border-t border-border flex-shrink-0">
         <motion.a
          href="https://forms.gle/your-feedback-form-link" // <-- TODO: Replace with your actual feedback form link
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-text-tertiary hover:bg-surface-overlay hover:text-text-primary border border-border/50 hover:border-border transition-all duration-200 text-sm font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
         >
            <Icon name="message" className="w-4 h-4" />
            Provide Feedback
         </motion.a>
      </div>
    </aside>
  );
};

export default Sidebar;