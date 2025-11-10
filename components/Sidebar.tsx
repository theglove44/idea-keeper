import React from 'react';
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
    <aside className="w-1/3 max-w-xs h-full bg-slate-900/60 backdrop-blur-xl border-r border-slate-700/50 flex flex-col">
      <div className="p-4 flex justify-between items-center border-b border-slate-700/50 flex-shrink-0">
        <h1 className="text-xl font-bold text-slate-100">Idea Spark</h1>
        <button
          onClick={onNewIdea}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 transition-colors duration-200"
          aria-label="New Idea"
        >
          <Icon name="plus" className="w-5 h-5" />
        </button>
      </div>
      <div className="overflow-y-auto p-2 flex-grow">
        <ul className="space-y-1">
          {ideas.length > 0 ? (
            ideas.map((idea) => (
              <li key={idea.id}>
                <button
                  onClick={() => onSelectIdea(idea.id)}
                  className={`w-full text-left p-3 rounded-lg group transition-colors duration-200 flex justify-between items-start ${
                    selectedIdeaId === idea.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex-grow pr-2">
                    <h3 className="font-semibold truncate">{idea.title}</h3>
                    <p className={`text-sm truncate ${ selectedIdeaId === idea.id ? 'text-blue-100' : 'text-slate-400'}`}>{idea.summary}</p>
                  </div>
                   <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteIdea(idea.id);
                    }}
                    className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0 ${ selectedIdeaId === idea.id ? 'hover:bg-blue-500' : 'hover:bg-slate-700'}`}
                    aria-label={`Delete ${idea.title}`}
                  >
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </button>
              </li>
            ))
          ) : (
             <div className="text-center text-slate-400 p-8">
                <p>No ideas yet.</p>
                <p>Click the '+' to add your first one!</p>
            </div>
          )}
        </ul>
      </div>
      <div className="p-2 border-t border-slate-700/50 flex-shrink-0">
         <a 
          href="https://forms.gle/your-feedback-form-link" // <-- TODO: Replace with your actual feedback form link
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 transition-colors duration-200 text-sm"
         >
            <Icon name="message" className="w-4 h-4" />
            Provide Feedback
         </a>
      </div>
    </aside>
  );
};

export default Sidebar;