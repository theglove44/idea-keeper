import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, SeverityLevel } from '../types';
import Icon from './Icon';
import { useCardComments } from '../hooks/useCardComments';
import { createMIReport, createUpgradeReport } from '../services/reportService';

type CardDetailModalProps = {
  card: Card;
  columnTitle: string;
  columnId: string;
  ideaId: string;
  ideaTitle: string;
  onCommentAdded?: (cardId: string) => void;
  onClose: () => void;
};

const formatTimestamp = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

type ComposerMode = 'comment' | 'mi' | 'upgrade';

const defaultChecklist = ['Define scope', 'Review plan', 'QA sign-off'];

const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, columnTitle, columnId, ideaId, ideaTitle, onCommentAdded, onClose }) => {
  const { comments, isLoading, isSubmitting, error, submitComment } = useCardComments(card?.id ?? null);
  const [draft, setDraft] = useState('');
  const [composerMode, setComposerMode] = useState<ComposerMode>('comment');
  const [miSummary, setMiSummary] = useState(card.text);
  const [miDetails, setMiDetails] = useState('');
  const [miSeverity, setMiSeverity] = useState<SeverityLevel>('medium');
  const [upgradeDescription, setUpgradeDescription] = useState(card.text);
  const [upgradePlan, setUpgradePlan] = useState('');
  const [upgradeEstimate, setUpgradeEstimate] = useState('');
  const [upgradeChecklist, setUpgradeChecklist] = useState<string[]>(defaultChecklist);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [isReportSubmitting, setIsReportSubmitting] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    const node = scrollContainerRef.current;
    if (!node) return;
    if (typeof node.scrollTo === 'function') {
      node.scrollTo({ top: node.scrollHeight, behavior: 'smooth' });
    } else {
      node.scrollTop = node.scrollHeight;
    }
  }, [comments.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setMiSummary(card.text);
    setUpgradeDescription(card.text);
    setMiDetails('');
    setUpgradePlan('');
    setUpgradeEstimate('');
    setUpgradeChecklist(defaultChecklist);
    setComposerMode('comment');
    setReportError(null);
    setReportSuccess(null);
  }, [card.id, card.text]);

  const handleBackdropClick = () => onClose();
  const handleContainerClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!draft.trim()) return;
    await submitComment(draft);
    onCommentAdded?.(card.id);
    setDraft('');
  };

  const handleCreateMIReport = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!miSummary.trim() || !miDetails.trim()) {
      setReportError('Summary and details are required.');
      return;
    }
    setReportError(null);
    setReportSuccess(null);
    setIsReportSubmitting(true);
    try {
      const result = await createMIReport({
        ideaId,
        ideaTitle,
        columnId,
        columnTitle,
        cardId: card.id,
        cardText: card.text,
        summary: miSummary.trim(),
        details: miDetails.trim(),
        severity: miSeverity,
      });
      await submitComment(`🐞 MI report ${result.id} created: ${miSummary.trim()}`);
      onCommentAdded?.(card.id);
      setReportSuccess(`MI report ${result.id} saved to MI Reports.`);
      setComposerMode('comment');
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Failed to create MI report');
    } finally {
      setIsReportSubmitting(false);
    }
  };

  const handleCreateUpgradeReport = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!upgradeDescription.trim() || !upgradePlan.trim() || !upgradeEstimate.trim()) {
      setReportError('Description, plan, and estimate are required.');
      return;
    }
    const checklistItems = upgradeChecklist.filter((item) => item.trim().length > 0);
    if (checklistItems.length === 0) {
      setReportError('Add at least one checklist item.');
      return;
    }
    setReportError(null);
    setReportSuccess(null);
    setIsReportSubmitting(true);
    try {
      const result = await createUpgradeReport({
        ideaId,
        ideaTitle,
        columnId,
        columnTitle,
        cardId: card.id,
        cardText: card.text,
        description: upgradeDescription.trim(),
        plan: upgradePlan.trim(),
        estimate: upgradeEstimate.trim(),
        checklist: checklistItems,
      });
      await submitComment(
        `🚀 Upgrade report ${result.id} created (Est. ${upgradeEstimate.trim()}).`
      );
      onCommentAdded?.(card.id);
      setReportSuccess(`Upgrade report ${result.id} saved to Upgrade Reports.`);
      setComposerMode('comment');
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Failed to create upgrade report');
    } finally {
      setIsReportSubmitting(false);
    }
  };

  const handleChecklistChange = (index: number, value: string) => {
    setUpgradeChecklist((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const handleAddChecklistItem = () => {
    setUpgradeChecklist((prev) => [...prev, '']);
  };

  const handleRemoveChecklistItem = (index: number) => {
    setUpgradeChecklist((prev) => prev.filter((_, idx) => idx !== index));
  };

  const columnBadge = useMemo(() => columnTitle || 'Untitled', [columnTitle]);
  const isActionBusy = isSubmitting || isReportSubmitting;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 md:p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-3xl max-h-[95vh] md:max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl shadow-2xl flex flex-col"
        onClick={handleContainerClick}
      >
        <header className="p-4 md:p-6 border-b border-slate-800 flex items-start gap-2 md:gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <span className="text-xs uppercase tracking-wide text-slate-400 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-full">
                {columnBadge}
              </span>
              <span className="text-xs text-slate-500 truncate">{formatTimestamp(card.createdAt)}</span>
            </div>
            <h2 className="text-lg md:text-2xl font-semibold text-slate-100 whitespace-pre-wrap">
              {card.text}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 md:p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition flex-shrink-0"
            aria-label="Close card detail"
          >
            <Icon name="close" className="w-5 h-5" />
          </button>
        </header>

        <section className="flex-1 overflow-hidden flex flex-col">
          {error && (
            <div className="px-4 md:px-6 py-2 bg-red-500/10 text-red-300 text-sm border-b border-red-500/30">
              {error}
            </div>
          )}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 md:px-6 py-3 md:py-5 space-y-3 md:space-y-4 bg-slate-900/40"
          >
            {isLoading ? (
              <div className="text-slate-400 text-sm">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-slate-500 text-sm text-center py-6">
                No comments yet. Start the conversation!
              </div>
            ) : (
              comments.map((comment) => {
                const isOwn = comment.author === 'You' || !comment.author;
                return (
                  <div key={comment.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className="max-w-[80%]">
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm leading-relaxed border ${
                          isOwn
                            ? 'bg-blue-600/70 border-blue-500/60 text-white'
                            : 'bg-slate-800/80 border-slate-700 text-slate-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{comment.body}</p>
                      </div>
                      <div className={`text-[11px] mt-1 ${isOwn ? 'text-blue-200/80 text-right' : 'text-slate-500'}`}>
                        {comment.author || 'You'} · {formatTimestamp(comment.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="p-4 md:p-6 border-t border-slate-800 bg-slate-900/60 flex flex-col gap-3 md:gap-4">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm text-slate-400">
              <span className="hidden md:inline">Action:</span>
              {(
                [
                  { key: 'comment', label: 'Comment', icon: 'chat' },
                  { key: 'mi', label: 'Report Bug', icon: 'alert' },
                  { key: 'upgrade', label: 'Start Upgrade', icon: 'sparkles' },
                ] as const
              ).map((action) => (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => setComposerMode(action.key)}
                  aria-pressed={composerMode === action.key}
                  className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-full border transition text-xs md:text-sm ${
                    composerMode === action.key
                      ? 'bg-blue-600/80 border-blue-500 text-white'
                      : 'bg-slate-800/50 border-slate-700 text-slate-300'
                  }`}
                >
                  <Icon name={action.icon} className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              ))}
            </div>

            {reportError && (
              <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                {reportError}
              </div>
            )}
            {reportSuccess && (
              <div className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
                {reportSuccess}
              </div>
            )}

            {composerMode === 'comment' && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <label htmlFor="card-comment" className="text-sm text-slate-400">
                  Add a comment
                </label>
                <div className="flex gap-3">
                  <textarea
                    id="card-comment"
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    rows={2}
                    placeholder="Share your thoughts..."
                    className="flex-1 resize-none bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isActionBusy}
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || isActionBusy}
                    className="self-end h-12 w-12 rounded-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 flex items-center justify-center text-white transition"
                    aria-label="Send comment"
                  >
                    <Icon name="send" className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500">Press Enter to send, Shift+Enter for a new line.</p>
              </form>
            )}

            {composerMode === 'mi' && (
              <form onSubmit={handleCreateMIReport} className="space-y-3">
                <div className="grid gap-2">
                  <label className="text-sm text-slate-300">Bug summary</label>
                  <input
                    type="text"
                    value={miSummary}
                    onChange={(e) => setMiSummary(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Short description"
                    disabled={isReportSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-slate-300">Details</label>
                  <textarea
                    value={miDetails}
                    onChange={(e) => setMiDetails(e.target.value)}
                    rows={4}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the issue, steps to reproduce, expected vs actual"
                    disabled={isReportSubmitting}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">Severity</label>
                  <select
                    value={miSeverity}
                    onChange={(e) => setMiSeverity(e.target.value as SeverityLevel)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isReportSubmitting}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-500 text-slate-900 font-semibold disabled:opacity-60"
                    disabled={isReportSubmitting}
                  >
                    Create MI Report
                  </button>
                </div>
              </form>
            )}

            {composerMode === 'upgrade' && (
              <form onSubmit={handleCreateUpgradeReport} className="space-y-3">
                <div className="grid gap-2">
                  <label className="text-sm text-slate-300">Upgrade idea</label>
                  <input
                    type="text"
                    value={upgradeDescription}
                    onChange={(e) => setUpgradeDescription(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="What are we improving?"
                    disabled={isReportSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-slate-300">Plan (Plan Mode output)</label>
                  <textarea
                    value={upgradePlan}
                    onChange={(e) => setUpgradePlan(e.target.value)}
                    rows={4}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Outline the implementation steps"
                    disabled={isReportSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-slate-300">Estimated time to implement</label>
                  <input
                    type="text"
                    value={upgradeEstimate}
                    onChange={(e) => setUpgradeEstimate(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 6h, 2 days"
                    disabled={isReportSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-slate-300">Checklist</label>
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      + Add item
                    </button>
                  </div>
                  <div className="space-y-2">
                    {upgradeChecklist.map((item, index) => (
                      <div key={`check-${index}`} className="flex gap-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleChecklistChange(index, e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={`Checklist item ${index + 1}`}
                          disabled={isReportSubmitting}
                        />
                        {upgradeChecklist.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(index)}
                            className="px-2 text-slate-400 hover:text-red-300"
                            aria-label="Remove checklist item"
                          >
                            <Icon name="close" className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-900 font-semibold disabled:opacity-60"
                    disabled={isReportSubmitting}
                  >
                    Create Upgrade Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CardDetailModal;
