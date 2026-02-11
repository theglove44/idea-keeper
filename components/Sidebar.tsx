import React from 'react';
import { motion } from 'framer-motion';
import { Idea } from '../types';
import Icon from './Icon';
import EmptyState from './EmptyState';

type SidebarProps = {
  ideas: Idea[];
  selectedIdeaId: string | null;
  onSelectIdea: (id: string) => void;
  onNewIdea: () => void;
  onDeleteIdea: (id: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ ideas, selectedIdeaId, onSelectIdea, onNewIdea, onDeleteIdea, isMobileOpen = false, onMobileClose }) => {
  const [filterText, setFilterText] = React.useState('');

  // Filter ideas based on search text
  const filteredIdeas = React.useMemo(() => {
    if (!filterText.trim()) return ideas;
    const query = filterText.toLowerCase();
    return ideas.filter(
      (idea) =>
        idea.title.toLowerCase().includes(query) ||
        idea.summary.toLowerCase().includes(query)
    );
  }, [ideas, filterText]);

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-4/5 max-w-xs md:w-1/3 md:max-w-xs
        h-full bg-surface-elevated/95 md:bg-surface-elevated/72 backdrop-blur-2xl
        border-r border-border/80 flex flex-col
        transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
      <div className="p-4 flex justify-between items-center border-b border-border/80 flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="md:hidden p-2 rounded-lg text-text-tertiary hover:bg-surface-overlay/70 hover:text-text-primary transition-colors duration-200"
            aria-label="Close menu"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-extrabold tracking-tight text-gradient-brand">Idea Spark</h1>
        </div>
        <motion.button
          onClick={onNewIdea}
          data-tour="new-idea-button"
          className="p-2 rounded-lg bg-gradient-brand text-white border border-brand-cyan-500/25 hover:shadow-glow-cyan transition-all duration-200"
          aria-label="New Idea"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <Icon name="plus" className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Filter Input */}
      {ideas.length > 0 && (
        <div className="px-3 pt-3 pb-2 border-b border-border-subtle">
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter ideas..."
            className="w-full px-3 py-2 text-sm bg-surface-elevated border border-border-subtle rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-brand-purple focus:border-transparent transition-shadow"
          />
        </div>
      )}

      <div className="overflow-y-auto p-3 flex-grow scrollbar-custom">
        <ul className="space-y-2">
          {filteredIdeas.length > 0 ? (
            filteredIdeas.map((idea, index) => (
              <motion.li
                key={idea.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="relative group">
                  <motion.button
                    onClick={() => onSelectIdea(idea.id)}
                    className={`w-full text-left p-3 md:p-3 pr-11 min-h-[70px] rounded-lg transition-colors duration-200 ${
                      selectedIdeaId === idea.id ? 'bg-gradient-brand text-white shadow-card border border-brand-cyan-400/35' : 'text-text-secondary hover:bg-surface-overlay/80 active:bg-surface-overlay'
                    }`}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <h3 className="font-semibold text-sm md:text-base truncate">{idea.title}</h3>
                    <p className={`text-xs md:text-sm truncate ${ selectedIdeaId === idea.id ? 'text-blue-50/90' : 'text-text-tertiary'}`}>{idea.summary}</p>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => onDeleteIdea(idea.id)}
                    className={`absolute top-2 right-2 p-2 md:p-1 rounded opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 ${
                      selectedIdeaId === idea.id ? 'hover:bg-white/20 text-white' : 'hover:bg-surface-overlay text-text-secondary'
                    }`}
                    aria-label={`Delete ${idea.title}`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.li>
            ))
          ) : filterText ? (
            <motion.div
              className="text-center text-text-tertiary p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="mb-2">No ideas match "{filterText}"</p>
              <p className="text-text-muted text-sm">Try a different search term</p>
            </motion.div>
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
          className="w-full flex items-center justify-center gap-2 p-3 rounded-lg text-text-tertiary hover:bg-surface-overlay hover:text-text-primary border border-border/70 hover:border-border-light transition-all duration-200 text-sm font-medium"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
         >
            <Icon name="message" className="w-4 h-4" />
            Provide Feedback
         </motion.a>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
