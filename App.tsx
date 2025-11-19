import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, supabaseInitializationError } from './services/supabaseClient';
import { Idea, Card } from './types';
import Sidebar from './components/Sidebar';
import IdeaDetail from './components/IdeaDetail';
import Icon from './components/Icon';
import CardDetailModal from './components/CardDetailModal';
import { ToastProvider, useToast } from './components/Toast';

const IdeaForm: React.FC<{ 
    onSave: (title: string, summary: string) => void; 
    onClose: () => void; 
    idea?: Idea 
}> = ({ onSave, onClose, idea }) => {
    const isEditMode = !!idea;
    const [title, setTitle] = useState(idea?.title || '');
    const [summary, setSummary] = useState(idea?.summary || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim()) {
            onSave(title, summary);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4" onClick={onClose}>
            <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 md:p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-3 md:mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-100">{isEditMode ? 'Edit Idea' : 'New Idea'}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-700">
                        <Icon name="close" className="w-5 h-5"/>
                    </motion.button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-2">Title</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What's your brilliant idea?"
                            className="input-field"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="summary" className="block text-sm font-medium text-text-secondary mb-2">Summary</label>
                        <textarea
                            id="summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Describe it in a sentence or two."
                            rows={3}
                            className="input-field resize-none"
                        />
                    </div>
                    <div className="flex justify-end pt-1 md:pt-2">
                        <button type="submit" className="px-4 md:px-5 py-2 text-sm md:text-base bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-500 disabled:opacity-50 transition-colors" disabled={!title.trim()}>
                            Save Idea
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

const DEFAULT_COLUMNS_CONFIG = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'todo', title: 'To Do' },
  { id: 'inprogress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

function App() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [isAddingNewIdea, setIsAddingNewIdea] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [selectedCardContext, setSelectedCardContext] = useState<{
    ideaId: string;
    ideaTitle: string;
    columnId: string;
    columnTitle: string;
    card: Card;
  } | null>(null);
  
  if (supabaseInitializationError) {
    return (
      <div className="h-screen w-screen bg-slate-900 text-white flex items-center justify-center p-8">
        <div className="text-center bg-slate-800 border border-red-700/50 p-8 rounded-lg max-w-lg shadow-2xl">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Configuration Error</h1>
            <p className="text-slate-300">{supabaseInitializationError}</p>
            <p className="text-slate-400 mt-4 text-sm">Please ensure the <code>SUPABASE_URL</code> and <code>SUPABASE_ANON_KEY</code> environment variables are correctly set for this application to function.</p>
        </div>
      </div>
    );
  }

  const selectedIdea = ideas.find(idea => idea.id === selectedIdeaId) || null;

  useEffect(() => {
    const fetchIdeas = async () => {
        const { data: ideasData, error: ideasError } = await supabase!.from('ideas').select('*').order('created_at', { descending: true });
        if (ideasError) {
            console.error("Error fetching ideas:", ideasError);
            return;
        }

        const { data: cardsData, error: cardsError } = await supabase!.from('cards').select('*');
        if (cardsError) {
            console.error("Error fetching cards:", cardsError);
            return;
        }

        const cardIds = cardsData.map(card => card.id);
        let commentCountsMap: Record<string, number> = {};
        if (cardIds.length > 0) {
          const { data: commentRows, error: commentError } = await supabase!
            .from('card_comments')
            .select('card_id')
            .in('card_id', cardIds);

          if (commentError) {
            console.error('Error fetching card comment counts:', commentError);
          } else if (commentRows) {
            commentCountsMap = commentRows.reduce((acc: Record<string, number>, row) => {
              acc[row.card_id] = (acc[row.card_id] || 0) + 1;
              return acc;
            }, {});
          }
        }

        const ideasWithData = ideasData.map(idea => {
            const ideaCards = cardsData.filter(card => card.idea_id === idea.id);
            const columns = DEFAULT_COLUMNS_CONFIG.map(colConfig => ({
                ...colConfig,
                cards: ideaCards
                    .filter(card => card.column_id === colConfig.id)
                    .map(c => ({
                        ...c,
                        createdAt: c.created_at,
                        commentsCount: commentCountsMap[c.id] || 0,
                    }))
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            }));
            return { ...idea, columns, createdAt: idea.created_at };
        });

        setIdeas(ideasWithData);
    };

    fetchIdeas();
  }, []);

  useEffect(() => {
    if (!selectedIdeaId && ideas.length > 0) {
      setSelectedIdeaId(ideas[0].id);
    }
     if (ideas.length === 0) {
      setSelectedIdeaId(null);
    }
  }, [ideas, selectedIdeaId]);

  const handleAddIdea = async (title: string, summary: string) => {
    const { data, error } = await supabase!.from('ideas').insert({ title, summary }).select().single();
    if (error) {
        console.error("Error adding idea:", error);
        return;
    }

    const newIdea: Idea = {
      id: data.id,
      title,
      summary,
      columns: DEFAULT_COLUMNS_CONFIG.map(col => ({ ...col, cards: [] })),
      createdAt: data.created_at,
    };
    setIdeas([newIdea, ...ideas]);
    setSelectedIdeaId(newIdea.id);
    setIsAddingNewIdea(false);
  };

  const handleDeleteIdea = async (id: string) => {
    // Assuming cascade delete is set up in Supabase for cards
    const { error } = await supabase!.from('ideas').delete().eq('id', id);
    if (error) {
        console.error("Error deleting idea:", error);
        return;
    }

    const updatedIdeas = ideas.filter(idea => idea.id !== id);
    setIdeas(updatedIdeas);

    if (selectedIdeaId === id) {
      setSelectedIdeaId(updatedIdeas.length > 0 ? updatedIdeas[0].id : null);
    }
  };

  const handleAddCardToIdea = async (ideaId: string, columnId: string, cardText: string) => {
    const { data, error } = await supabase!.from('cards').insert({ text: cardText, idea_id: ideaId, column_id: columnId }).select().single();
     if (error) {
        console.error("Error adding card:", error);
        return;
    }
    const newCard: Card = { id: data.id, text: data.text, createdAt: data.created_at, commentsCount: 0 };

    const updatedIdeas = ideas.map(idea => {
      if (idea.id === ideaId) {
        const updatedColumns = idea.columns.map(column => {
          if (column.id === columnId) {
            return { ...column, cards: [newCard, ...column.cards] };
          }
          return column;
        });
        return { ...idea, columns: updatedColumns };
      }
      return idea;
    });
    setIdeas(updatedIdeas);
  };
  
  const handleSaveEditedIdea = async (title: string, summary: string) => {
    if (!editingIdea) return;
    const { error } = await supabase!.from('ideas').update({ title, summary }).eq('id', editingIdea.id);
     if (error) {
        console.error("Error updating idea:", error);
        return;
    }
    setIdeas(ideas.map(idea => idea.id === editingIdea.id ? { ...idea, title, summary } : idea));
    setEditingIdea(null);
  };

  const handleMoveCard = async (cardId: string, sourceColumnId: string, destColumnId: string, ideaId: string) => {
    const originalIdeas = ideas;
    // Optimistic update
    let cardToMove: Card | undefined;
    const tempIdeas = ideas.map(idea => {
        if (idea.id === ideaId) {
            const newColumns = idea.columns.map(c => ({ ...c, cards: [...c.cards] }));
            const sourceCol = newColumns.find(c => c.id === sourceColumnId);
            const destCol = newColumns.find(c => c.id === destColumnId);

            if (!sourceCol || !destCol) return idea;

            const cardIndex = sourceCol.cards.findIndex(c => c.id === cardId);
            if (cardIndex > -1) {
                [cardToMove] = sourceCol.cards.splice(cardIndex, 1);
                if (cardToMove) {
                    destCol.cards.unshift(cardToMove);
                }
            }
            return { ...idea, columns: newColumns };
        }
        return idea;
    });
    setIdeas(tempIdeas);

    const { error } = await supabase!.from('cards').update({ column_id: destColumnId }).eq('id', cardId);
    if (error) {
        console.error("Failed to move card:", error);
        setIdeas(originalIdeas); // Revert on error
    }
  };

  const handleEditCard = async (cardId: string, newText: string, ideaId: string) => {
      const originalIdeas = ideas;
      // Optimistic update
      const tempIdeas = ideas.map(idea => {
          if (idea.id === ideaId) {
              const newColumns = idea.columns.map(column => ({
                  ...column,
                  cards: column.cards.map(card => card.id === cardId ? { ...card, text: newText } : card)
              }));
              return { ...idea, columns: newColumns };
          }
          return idea;
      });
      setIdeas(tempIdeas);
      
      const { error } = await supabase!.from('cards').update({ text: newText }).eq('id', cardId);
      if (error) {
          console.error("Failed to edit card:", error);
          setIdeas(originalIdeas); // Revert
      }
  };

  const handleOpenCardDetail = (
    ideaId: string,
    ideaTitle: string,
    columnId: string,
    columnTitle: string,
    card: Card
  ) => {
    setSelectedCardContext({ ideaId, ideaTitle, columnId, columnTitle, card });
  };

  const handleCloseCardDetail = () => setSelectedCardContext(null);

  const handleIncrementCardCommentCount = (cardId: string) => {
    setIdeas(prevIdeas => prevIdeas.map(idea => ({
      ...idea,
      columns: idea.columns.map(column => ({
        ...column,
        cards: column.cards.map(card => (
          card.id === cardId
            ? { ...card, commentsCount: (card.commentsCount || 0) + 1 }
            : card
        )),
      })),
    })));

    setSelectedCardContext(prev => {
      if (!prev || prev.card.id !== cardId) return prev;
      return {
        ...prev,
        card: { ...prev.card, commentsCount: (prev.card.commentsCount || 0) + 1 },
      };
    });
  };

  useEffect(() => {
    if (!selectedCardContext) return;
    const idea = ideas.find((i) => i.id === selectedCardContext.ideaId);
    if (!idea) {
      setSelectedCardContext(null);
      return;
    }
    const column = idea.columns.find((c) => c.id === selectedCardContext.columnId);
    if (!column) {
      setSelectedCardContext(null);
      return;
    }
    const latestCard = column.cards.find((c) => c.id === selectedCardContext.card.id);
    if (!latestCard) {
      setSelectedCardContext(null);
      return;
    }
    if (
      latestCard.text !== selectedCardContext.card.text ||
      column.title !== selectedCardContext.columnTitle ||
      idea.title !== selectedCardContext.ideaTitle
    ) {
      setSelectedCardContext({
        ideaId: idea.id,
        ideaTitle: idea.title,
        columnId: column.id,
        columnTitle: column.title,
        card: latestCard,
      });
    }
  }, [ideas, selectedCardContext]);

  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex overflow-hidden">
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 hover:bg-slate-700 transition-colors"
        aria-label="Open menu"
      >
        <Icon name="menu" className="w-6 h-6" />
      </button>

      <Sidebar
        ideas={ideas}
        selectedIdeaId={selectedIdeaId}
        onSelectIdea={(id) => {
          setSelectedIdeaId(id);
          setIsMobileSidebarOpen(false);
        }}
        onNewIdea={() => setIsAddingNewIdea(true)}
        onDeleteIdea={handleDeleteIdea}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />
      <IdeaDetail
        idea={selectedIdea}
        onAddCard={handleAddCardToIdea}
        onStartEdit={setEditingIdea}
        onMoveCard={handleMoveCard}
        onEditCard={handleEditCard}
        onOpenCardDetail={handleOpenCardDetail}
      />
      {isAddingNewIdea && <IdeaForm onSave={handleAddIdea} onClose={() => setIsAddingNewIdea(false)} />}
      {editingIdea && <IdeaForm onSave={handleSaveEditedIdea} onClose={() => setEditingIdea(null)} idea={editingIdea}/>}
      {selectedCardContext && (
        <CardDetailModal
          card={selectedCardContext.card}
          columnTitle={selectedCardContext.columnTitle}
          ideaId={selectedCardContext.ideaId}
          ideaTitle={selectedCardContext.ideaTitle}
          columnId={selectedCardContext.columnId}
          onCommentAdded={handleIncrementCardCommentCount}
          onClose={handleCloseCardDetail}
        />
        <AnimatePresence mode="wait">
          {isAddingNewIdea && <IdeaForm key="add-idea" onSave={handleAddIdea} onClose={() => setIsAddingNewIdea(false)} />}
          {editingIdea && <IdeaForm key="edit-idea" onSave={handleSaveEditedIdea} onClose={() => setEditingIdea(null)} idea={editingIdea}/>}
        </AnimatePresence>
        <AnimatePresence>
          {selectedCardContext && (
            <CardDetailModal
              card={selectedCardContext.card}
              columnTitle={selectedCardContext.columnTitle}
              ideaId={selectedCardContext.ideaId}
              ideaTitle={selectedCardContext.ideaTitle}
              columnId={selectedCardContext.columnId}
              onCommentAdded={handleIncrementCardCommentCount}
              onClose={handleCloseCardDetail}
            />
          )}
        </AnimatePresence>
      </div>
    </ToastProvider>
  );
}

export default App;