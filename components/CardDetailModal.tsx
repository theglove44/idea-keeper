import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, SeverityLevel } from '../types';
import Icon from './Icon';
import { LoadingSpinner } from './LoadingSkeleton';
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="w-full max-w-3xl max-h-[95vh] md:max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl shadow-2xl flex flex-col"
        onClick={handleContainerClick}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
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
            </motion.h2>
          </div>
          <motion.button
            onClick={onClose}
            className="p-1.5 md:p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition flex-shrink-0"
            aria-label="Close card detail"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Icon name="close" className="w-5 h-5" />
          </motion.button>
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
              <div className="flex flex-col items-center justify-center py-12 text-text-tertiary">
                <LoadingSpinner size="md" />
                <p className="mt-4 text-sm">Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <motion.div
                className="text-text-muted text-sm text-center py-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                No comments yet. Start the conversation!
              </motion.div>
            ) : (
              comments.map((comment, index) => {
                const isOwn = comment.author === 'You' || !comment.author;
                return (
                  <motion.div
                    key={comment.id}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div className="max-w-[80%]">
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-card ${
                          isOwn
                            ? 'bg-gradient-to-r from-brand-purple-600 to-brand-cyan-600 text-white'
                            : 'bg-surface-elevated border border-border text-text-primary'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{comment.body}</p>
                      </div>
                      <div className={`text-[11px] mt-1.5 px-1 ${isOwn ? 'text-brand-purple-300 text-right' : 'text-text-muted'}`}>
                        {comment.author || 'You'} · {formatTimestamp(comment.createdAt)}
                      </div>
                    </div>
                  </motion.div>
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
                <motion.button
                  key={action.key}
                  type="button"
                  onClick={() => setComposerMode(action.key)}
                  aria-pressed={composerMode === action.key}
                  className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 rounded-full border transition text-xs md:text-sm ${
                    composerMode === action.key
                      ? 'bg-gradient-to-r from-brand-purple-600 to-brand-cyan-600 border-brand-purple-500 text-white shadow-card'
                      : 'bg-surface-elevated border-border text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon name={action.icon} className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {reportError && (
                <motion.div
                  className="text-sm text-status-error bg-status-error/10 border border-status-error/30 rounded-xl px-4 py-3 flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Icon name="alert" className="w-4 h-4 flex-shrink-0" />
                  <span>{reportError}</span>
                </motion.div>
              )}
              {reportSuccess && (
                <motion.div
                  className="text-sm text-status-success bg-status-success/10 border border-status-success/30 rounded-xl px-4 py-3 flex items-center gap-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Icon name="check" className="w-4 h-4 flex-shrink-0" />
                  <span>{reportSuccess}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {composerMode === 'comment' && (
              <motion.form
                onSubmit={handleSubmit}
                className="flex flex-col gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label htmlFor="card-comment" className="text-sm text-text-secondary font-medium">
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
                    className="input-field resize-none"
                    disabled={isActionBusy}
                  />
                  <motion.button
                    type="submit"
                    disabled={!draft.trim() || isActionBusy}
                    className="self-end h-12 w-12 rounded-full bg-gradient-to-r from-brand-purple-600 to-brand-cyan-600 hover:shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all"
                    aria-label="Send comment"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon name="send" className="w-5 h-5" />
                  </motion.button>
                </div>
                <p className="text-xs text-text-muted">Press Enter to send, Shift+Enter for a new line.</p>
              </motion.form>
            )}

            {composerMode === 'mi' && (
              <motion.form
                onSubmit={handleCreateMIReport}
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid gap-2">
                  <label className="text-sm text-text-secondary font-medium">Bug summary</label>
                  <input
                    type="text"
                    value={miSummary}
                    onChange={(e) => setMiSummary(e.target.value)}
                    className="input-field"
                    placeholder="Short description"
                    disabled={isReportSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-text-secondary font-medium">Details</label>
                  <textarea
                    value={miDetails}
                    onChange={(e) => setMiDetails(e.target.value)}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Describe the issue, steps to reproduce, expected vs actual"
                    disabled={isReportSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-text-secondary font-medium">Severity</label>
                  <select
                    value={miSeverity}
                    onChange={(e) => setMiSeverity(e.target.value as SeverityLevel)}
                    className="input-field"
                    disabled={isReportSubmitting}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setComposerMode('comment')}
                    className="btn-ghost"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-status-warning text-white font-semibold shadow-card hover:shadow-card-hover disabled:opacity-50 transition-all"
                    disabled={isReportSubmitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isReportSubmitting ? 'Creating...' : 'Create MI Report'}
                  </motion.button>
                </div>
              </motion.form>
            )}

            {composerMode === 'upgrade' && (
              <motion.form
                onSubmit={handleCreateUpgradeReport}
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid gap-2">
                  <label className="text-sm text-text-secondary font-medium">Upgrade idea</label>
                  <input
                    type="text"
                    value={upgradeDescription}
                    onChange={(e) => setUpgradeDescription(e.target.value)}
                    className="input-field"
                    placeholder="What are we improving?"
                    disabled={isReportSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-text-secondary font-medium">Plan (Plan Mode output)</label>
                  <textarea
                    value={upgradePlan}
                    onChange={(e) => setUpgradePlan(e.target.value)}
                    rows={4}
                    className="input-field resize-none"
                    placeholder="Outline the implementation steps"
                    disabled={isReportSubmitting}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm text-text-secondary font-medium">Estimated time to implement</label>
                  <input
                    type="text"
                    value={upgradeEstimate}
                    onChange={(e) => setUpgradeEstimate(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 6h, 2 days"
                    disabled={isReportSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm text-text-secondary font-medium">Checklist</label>
                    <motion.button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="text-xs text-brand-purple-400 hover:text-brand-purple-300 font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      + Add item
                    </motion.button>
                  </div>
                  <div className="space-y-2">
                    {upgradeChecklist.map((item, index) => (
                      <motion.div
                        key={`check-${index}`}
                        className="flex gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => handleChecklistChange(index, e.target.value)}
                          className="input-field flex-1"
                          placeholder={`Checklist item ${index + 1}`}
                          disabled={isReportSubmitting}
                        />
                        {upgradeChecklist.length > 1 && (
                          <motion.button
                            type="button"
                            onClick={() => handleRemoveChecklistItem(index)}
                            className="px-2 text-text-tertiary hover:text-status-error"
                            aria-label="Remove checklist item"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Icon name="close" className="w-4 h-4" />
                          </motion.button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setComposerMode('comment')}
                    className="btn-ghost"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-status-success text-white font-semibold shadow-card hover:shadow-card-hover disabled:opacity-50 transition-all"
                    disabled={isReportSubmitting}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isReportSubmitting ? 'Creating...' : 'Create Upgrade Report'}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
};

export default CardDetailModal;
