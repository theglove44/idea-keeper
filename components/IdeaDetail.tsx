import React, { useState } from 'react';
import { Idea, Card, Column } from '../types';
import { getBrainstormSuggestions, getCardBrainstormSuggestions } from '../services/geminiService';
import Icon from './Icon';

type IdeaDetailProps = {
  idea: Idea | null;
  onAddCard: (ideaId: string, columnId: string, cardText: string) => void;
  onStartEdit: (idea: Idea) => void;
  onMoveCard: (cardId: string, sourceColumnId: string, destColumnId: string, ideaId: string) => void;
  onEditCard: (cardId: string, newText: string, ideaId: string) => void;
  onOpenCardDetail: (ideaId: string, ideaTitle: string, columnId: string, columnTitle: string, card: Card) => void;
};

type DragInfo = {
  cardId: string;
  sourceColumnId: string;
} | null;

const IdeaDetail: React.FC<IdeaDetailProps> = ({ idea, onAddCard, onStartEdit, onMoveCard, onEditCard, onOpenCardDetail }) => {
  const [newCardText, setNewCardText] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [dragInfo, setDragInfo] = useState<DragInfo>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editingCardText, setEditingCardText] = useState<string>('');

  const [brainstormingCard, setBrainstormingCard] = useState<Card | null>(null);
  const [brainstormResult, setBrainstormResult] = useState<string | null>(null);
  const [isCardAILoading, setIsCardAILoading] = useState(false);

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCardText.trim() && idea && idea.columns.length > 0) {
      onAddCard(idea.id, idea.columns[0].id, newCardText);
      setNewCardText('');
    }
  };

  const handleBrainstorm = async () => {
    if (!idea) return;
    setIsLoadingAi(true);
    setAiSuggestion(null);
    const suggestion = await getBrainstormSuggestions(idea);
    setAiSuggestion(suggestion);
    setIsLoadingAi(false);
  };
  
  const onDragStart = (e: React.DragEvent, card: Card, sourceColumnId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', card.id);
    setDragInfo({ cardId: card.id, sourceColumnId });
  };

  const onDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (columnId !== dragOverColumn) {
        setDragOverColumn(columnId);
    }
  };

  const onDrop = (e: React.DragEvent, destinationColumnId: string) => {
    e.preventDefault();
    if (!dragInfo || !idea) return;

    const { cardId, sourceColumnId } = dragInfo;

    if (sourceColumnId !== destinationColumnId) {
      onMoveCard(cardId, sourceColumnId, destinationColumnId, idea.id);
    }
    
    setDragInfo(null);
    setDragOverColumn(null);
  };

  const handleStartEditingCard = (card: Card) => {
    setEditingCardId(card.id);
    setEditingCardText(card.text);
  };

  const handleSaveCardEdit = () => {
    if (!idea || !editingCardId) return;
    
    const trimmedText = editingCardText.trim();
    if (trimmedText === '') {
        handleCancelCardEdit();
        return;
    }
    
    onEditCard(editingCardId, trimmedText, idea.id);

    setEditingCardId(null);
    setEditingCardText('');
  };

  const handleCancelCardEdit = () => {
      setEditingCardId(null);
      setEditingCardText('');
  };

  const handleCardBrainstorm = async (card: Card) => {
    if (!idea) return;
    setBrainstormingCard(card);
    setIsCardAILoading(true);
    setBrainstormResult(null);
    const result = await getCardBrainstormSuggestions(idea, card);
    setBrainstormResult(result);
    setIsCardAILoading(false);
  };

  const handleCardClick = (card: Card, column: Column) => {
    if (!idea) return;
    if (editingCardId === card.id) return;
    onOpenCardDetail(idea.id, idea.title, column.id, column.title, card);
  };

  const handleCloseCardBrainstorm = () => {
    setBrainstormingCard(null);
    setBrainstormResult(null);
    setIsCardAILoading(false);
  };

  if (!idea) {
    return (
      <main className="flex-1 flex items-center justify-center text-slate-500">
        <div className="text-center">
          <p className="text-xl">Select an idea to view details</p>
          <p>or create a new one to get started.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-900/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex justify-between items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-100 truncate">{idea.title}</h2>
            <button
                onClick={() => onStartEdit(idea)}
                className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-slate-100 transition-colors flex-shrink-0"
                aria-label="Edit Idea"
            >
                <Icon name="pencil" className="w-5 h-5"/>
            </button>
        </div>
        <p className="text-slate-400 mt-1 truncate">{idea.summary}</p>
      </div>
      
      {/* AI & Actions */}
      <div className="p-4 flex-shrink-0 border-b border-slate-800">
         <button
            onClick={handleBrainstorm}
            disabled={isLoadingAi}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 text-slate-200 text-sm rounded-lg hover:bg-slate-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="sparkles" className="w-4 h-4 text-yellow-400" />
            {isLoadingAi ? 'Brainstorming...' : 'Brainstorm with AI'}
          </button>
      </div>

      {/* Kanban Board */}
      <div className="flex-grow flex p-4 space-x-4 overflow-x-auto">
        {idea.columns.map((column) => (
            <div 
                key={column.id}
                onDragOver={(e) => onDragOver(e, column.id)}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => onDrop(e, column.id)}
                className={`w-72 flex-shrink-0 bg-slate-800/60 rounded-xl flex flex-col transition-colors duration-200 ${dragOverColumn === column.id ? 'bg-slate-700/80' : ''}`}
            >
                <h3 className="text-sm font-semibold text-slate-300 p-3 border-b border-slate-700/50 flex-shrink-0">{column.title}</h3>
                <div className="p-2 flex-grow overflow-y-auto space-y-2">
                    {column.cards.map((card, index) => (
                       <div 
                         key={card.id} 
                         draggable={editingCardId !== card.id}
                         onDragStart={(e) => onDragStart(e, card, column.id)}
                         onClick={() => handleCardClick(card, column)}
                         className={`relative group p-3 bg-slate-700/70 border border-slate-600/50 rounded-lg shadow-md hover:shadow-lg hover:bg-slate-700 transition-all duration-300 ease-in-out ${editingCardId !== card.id ? 'cursor-grab active:cursor-grabbing' : ''} animate-card-enter ${
                            dragInfo?.cardId === card.id ? 'opacity-40 scale-105 -rotate-3 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800' : ''
                         }`}
                         style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {editingCardId === card.id ? (
                                <textarea
                                    value={editingCardText}
                                    onChange={(e) => setEditingCardText(e.target.value)}
                                    onBlur={handleSaveCardEdit}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSaveCardEdit();
                                        }
                                        if (e.key === 'Escape') {
                                            e.preventDefault();
                                            handleCancelCardEdit();
                                        }
                                    }}
                                    className="block w-full bg-slate-800 border-none ring-1 ring-blue-500 rounded-md p-0 m-0 text-slate-200 text-sm leading-relaxed focus:outline-none resize-none"
                                    autoFocus
                                    rows={Math.max(2, editingCardText.split('\n').length)}
                                />
                          ) : (
                            <>
                                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{card.text}</p>
                                <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCardBrainstorm(card);
                                        }}
                                        className="p-1.5 rounded-full text-slate-400 bg-slate-700/50 hover:text-yellow-300 hover:bg-slate-600 transition-all"
                                        aria-label="Brainstorm on card"
                                    >
                                        <Icon name="sparkles" className="w-3 h-3" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEditingCard(card);
                                        }}
                                        className="p-1.5 rounded-full text-slate-400 bg-slate-700/50 hover:text-slate-100 hover:bg-slate-600 transition-all"
                                        aria-label="Edit card"
                                    >
                                        <Icon name="pencil" className="w-3 h-3" />
                                    </button>
                                </div>
                            </>
                          )}
                       </div>
                    ))}
                </div>
            </div>
        ))}
      </div>
      
      {aiSuggestion && (
        <div className="flex-shrink-0 p-4 border-t border-slate-800 max-h-52 overflow-y-auto">
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <h3 className="text-lg font-semibold text-slate-200 mb-2 flex items-center gap-2">
                    <Icon name="sparkles" className="w-5 h-5 text-yellow-400" />
                    AI Suggestions
                </h3>
                <pre className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed font-sans">{aiSuggestion}</pre>
            </div>
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800 flex-shrink-0 bg-slate-900/40">
        <form onSubmit={handleAddCard} className="flex items-center gap-3">
          <input
            type="text"
            value={newCardText}
            onChange={(e) => setNewCardText(e.target.value)}
            placeholder={`Add card to "${idea.columns[0]?.title || ''}"...`}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            disabled={idea.columns.length === 0}
          />
          <button
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors duration-200"
            disabled={!newCardText.trim()}
            aria-label="Add Card"
          >
            <Icon name="send" className="w-5 h-5"/>
          </button>
        </form>
      </div>

      {/* Card Brainstorm Modal */}
      {brainstormingCard && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCloseCardBrainstorm}>
              <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                          <Icon name="sparkles" className="w-5 h-5 text-yellow-400"/>
                          Brainstorming
                      </h3>
                      <button onClick={handleCloseCardBrainstorm} className="p-2 rounded-full text-slate-400 hover:bg-slate-700">
                          <Icon name="close" className="w-5 h-5"/>
                      </button>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-lg mb-4 border border-slate-700/50">
                      <p className="text-slate-400 text-sm mb-1">Original Card:</p>
                      <p className="text-slate-200 whitespace-pre-wrap">{brainstormingCard.text}</p>
                  </div>
                  {isCardAILoading ? (
                      <div className="text-center text-slate-400 py-8">
                          <p>Thinking...</p>
                      </div>
                  ) : (
                      <div className="max-h-[50vh] overflow-y-auto pr-2">
                           <pre className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed font-sans">{brainstormResult}</pre>
                      </div>
                  )}
              </div>
          </div>
      )}
    </main>
  );
};

export default IdeaDetail;