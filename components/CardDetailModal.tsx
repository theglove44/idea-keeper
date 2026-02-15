import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, SeverityLevel, PriorityLevel, Idea } from '../types';
import Icon from './Icon';
import { LoadingSpinner } from './LoadingSkeleton';
import { useCardComments } from '../hooks/useCardComments';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { createMIReport, createUpgradeReport } from '../services/reportService';
import DueDatePicker from './DueDatePicker';
import PrioritySelector from './PrioritySelector';
import AssigneeSelector from './AssigneeSelector';
import TimeTracker from './TimeTracker';
import TagSelector from './TagSelector';
import { useClaude } from '../hooks/useClaude';
import { containsClaudeMention, extractClaudePrompt } from '../utils/mentionDetection';
import { buildCardContext } from '../utils/claudeContextBuilder';
import { ClaudeAction } from '../services/claudeService';
import ClaudeAvatar from './ClaudeAvatar';

type CardDetailModalProps = {
  card: Card;
  idea: Idea;
  columnTitle: string;
  columnId: string;
  ideaId: string;
  ideaTitle: string;
  onCommentAdded?: (cardId: string) => void;
  onCardUpdate?: (cardId: string, updates: Partial<Card>) => void;
  onAddCard?: (ideaId: string, columnId: string, text: string) => void;
  onMoveCard?: (cardId: string, sourceColumnId: string, destColumnId: string, ideaId: string) => void;
  onClose: () => void;
};

const formatTimestamp = (iso: string) => {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

type ComposerMode = 'comment' | 'mi' | 'upgrade' | 'claude';

const defaultChecklist = ['Define scope', 'Review plan', 'QA sign-off'];

const CardDetailModal: React.FC<CardDetailModalProps> = ({ card, idea, columnTitle, columnId, ideaId, ideaTitle, onCommentAdded, onCardUpdate, onAddCard, onMoveCard, onClose }) => {
  const { comments, isLoading, isSubmitting, error, submitComment } = useCardComments(card?.id ?? null);
  const claude = useClaude();
  const normalizedAssignees = Array.isArray(card.assignedTo) ? card.assignedTo : [];
  const normalizedTags = Array.isArray(card.tags) ? card.tags : [];
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
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useFocusTrap({
    active: true,
    containerRef: dialogRef,
    initialFocusRef: inputRef,
    onEscape: onClose,
  });

  // New card metadata handlers
  const handleDueDateChange = (dueDate: string | undefined) => {
    onCardUpdate?.(card.id, { dueDate });
  };

  const handlePriorityChange = (priority: PriorityLevel | undefined) => {
    onCardUpdate?.(card.id, { priority });
  };

  const handleAssigneesChange = (assignedTo: string[]) => {
    onCardUpdate?.(card.id, { assignedTo });
  };

  const handleEstimateChange = (estimatedHours: number | undefined) => {
    onCardUpdate?.(card.id, { estimatedHours });
  };

  const handleActualChange = (actualHours: number | undefined) => {
    onCardUpdate?.(card.id, { actualHours });
  };

  const handleTagsChange = (tags: string[]) => {
    onCardUpdate?.(card.id, { tags });
  };

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

  useEffect(() => {
    if (composerMode !== 'comment') return;
    const rafId = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => cancelAnimationFrame(rafId);
  }, [composerMode]);

  useEffect(() => {
    if (composerMode === 'claude' && !draft.startsWith('@claude ')) {
      setDraft('@claude ');
    }
  }, [composerMode, draft]);

  const handleBackdropClick = () => onClose();
  const handleContainerClick = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!draft.trim()) return;
    const commentText = draft;
    await submitComment(commentText);
    onCommentAdded?.(card.id);
    setDraft('');

    // Check for @claude mention and trigger Claude
    if (containsClaudeMention(commentText)) {
      const prompt = extractClaudePrompt(commentText);
      const context = buildCardContext(idea, card, columnTitle, comments);
      const response = await claude.sendMessage(prompt, context);
      if (response && response.message) {
        await submitComment(response.message, 'Claude');
        onCommentAdded?.(card.id);
      }
    }
  };

  const handleComposerModeChange = (mode: ComposerMode) => {
    setComposerMode(mode);
    setReportError(null);
    setReportSuccess(null);
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

  const handleApproveAction = async (action: ClaudeAction, index: number) => {
    if (action.type === 'create_card' && onAddCard) {
      onAddCard(ideaId, action.params.columnId || 'todo', action.params.text);
      await submitComment(`Created card: "${action.params.text}" in ${action.params.columnId || 'todo'}`, 'Claude');
      onCommentAdded?.(card.id);
    } else if (action.type === 'move_card' && onMoveCard) {
      onMoveCard(card.id, columnId, action.params.columnId, ideaId);
      await submitComment(`Moved card to ${action.params.columnId}`, 'Claude');
      onCommentAdded?.(card.id);
    }
    claude.removeAction(index);
  };

  const handleDismissAction = (index: number) => {
    claude.removeAction(index);
  };

  const handleDismissAllActions = () => {
    claude.clearPendingActions();
  };

  const columnBadge = useMemo(() => columnTitle || 'Untitled', [columnTitle]);
  const isActionBusy = isSubmitting || isReportSubmitting || claude.isThinking;
  const actionOptions = [
    { key: 'comment' as const, label: 'Comment', icon: 'chat', description: 'Discuss and update the card' },
    { key: 'mi' as const, label: 'Report Bug', icon: 'alert', description: 'Raise an MI report from this card' },
    { key: 'upgrade' as const, label: 'Start Upgrade', icon: 'sparkles', description: 'Plan and log an upgrade task' },
    { key: 'claude' as const, label: 'Ask Claude', icon: 'sparkles', description: 'Chat with Claude about this card' },
  ];
  const activityCountLabel = `${comments.length} ${comments.length === 1 ? 'update' : 'updates'}`;
  const selectedActionDescription =
    actionOptions.find((option) => option.key === composerMode)?.description ?? '';

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start md:items-center justify-center p-2 md:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-detail-title"
        className="w-full max-w-3xl my-2 md:my-4 max-h-[calc(100dvh-1rem)] md:max-h-[calc(100dvh-2rem)] min-h-0 overflow-y-auto overscroll-contain bg-slate-900 border border-slate-800 rounded-xl md:rounded-2xl shadow-2xl flex flex-col"
        onClick={handleContainerClick}
        tabIndex={-1}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <header className="p-4 md:p-6 border-b border-slate-800 bg-slate-900/85">
          <div className="flex items-start gap-2 md:gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <span className="text-[11px] uppercase tracking-wide text-slate-300 bg-slate-800/80 border border-slate-700 px-2 py-0.5 rounded-full">
                  {ideaTitle}
                </span>
                <span className="text-[11px] uppercase tracking-wide text-slate-400 bg-slate-800/70 border border-slate-700/80 px-2 py-0.5 rounded-full">
                  {columnBadge}
                </span>
              </div>
              <h2 id="card-detail-title" className="text-lg md:text-2xl font-semibold text-slate-100 whitespace-pre-wrap leading-snug">
                {card.text}
              </h2>
              <p className="mt-2 text-xs text-slate-500">Created {formatTimestamp(card.createdAt)}</p>
            </div>
            <motion.button
              type="button"
              onClick={onClose}
              className="p-1.5 md:p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition flex-shrink-0"
              aria-label="Close card detail"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Icon name="close" className="w-5 h-5" />
            </motion.button>
          </div>
        </header>

        {/* Card Metadata Section */}
        <div className="px-4 md:px-6 py-4 border-b border-slate-800 bg-slate-900/45">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800/90 bg-slate-950/35 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="flag" className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Planning</h3>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <DueDatePicker dueDate={card.dueDate} onChange={handleDueDateChange} />
                <PrioritySelector priority={card.priority} onChange={handlePriorityChange} />
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800/80">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 mb-2">Assignees</p>
                <AssigneeSelector assignees={normalizedAssignees} onChange={handleAssigneesChange} />
              </div>
            </div>
            <div className="rounded-xl border border-slate-800/90 bg-slate-950/35 p-3 md:p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon name="clock" className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Effort</h3>
              </div>
              <p className="text-xs text-slate-500 mb-2.5">Track estimate vs actual time for better planning.</p>
              <TimeTracker
                estimatedHours={card.estimatedHours}
                actualHours={card.actualHours}
                onEstimateChange={handleEstimateChange}
                onActualChange={handleActualChange}
                className="flex-wrap"
              />
            </div>
          </div>
          <div className="mt-3 rounded-xl border border-slate-800/90 bg-slate-950/35 p-3 md:p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Icon name="tag" className="w-4 h-4 text-slate-400" />
              <h3 className="text-sm font-semibold text-slate-200">Tags</h3>
            </div>
            <TagSelector tags={normalizedTags} onChange={handleTagsChange} />
          </div>
        </div>

        <section className="flex flex-col">
          <div className="px-4 md:px-6 py-2.5 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-300">Activity</h3>
            <span className="text-xs text-slate-500">{activityCountLabel}</span>
          </div>
          {error && (
            <div className="px-4 md:px-6 py-2 bg-red-500/10 text-red-300 text-sm border-b border-red-500/30">
              {error}
            </div>
          )}
          {claude.error && (
            <div className="px-4 md:px-6 py-2 bg-amber-500/10 text-amber-300 text-sm border-b border-amber-500/30">
              Claude: {claude.error}
            </div>
          )}
          <div
            ref={scrollContainerRef}
            className="px-4 md:px-6 py-3 md:py-5 space-y-3 md:space-y-4 bg-slate-900/40"
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
                const isClaude = comment.author === 'Claude';
                return (
                  <motion.div
                    key={comment.id}
                    className={`flex ${isClaude ? 'justify-start' : isOwn ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    {isClaude && (
                      <div className="mr-2 mt-1">
                        <ClaudeAvatar size="sm" />
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-card ${
                          isClaude
                            ? 'bg-amber-500/10 border border-amber-500/30 text-slate-200'
                            : isOwn
                            ? 'bg-gradient-to-r from-brand-purple-600 to-brand-cyan-600 text-white'
                            : 'bg-surface-elevated border border-border text-text-primary'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{comment.body}</p>
                      </div>
                      <div className={`text-[11px] mt-1.5 px-1 ${isClaude ? 'text-amber-400' : isOwn ? 'text-brand-purple-300 text-right' : 'text-text-muted'}`}>
                        {comment.author || 'You'} · {formatTimestamp(comment.createdAt)}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
          {claude.isThinking && (
            <div className="px-4 md:px-6 py-3 flex items-center gap-3 bg-amber-500/5 border-t border-amber-500/20">
              <ClaudeAvatar size="sm" />
              <span className="text-sm text-amber-400 animate-pulse">Claude is thinking...</span>
            </div>
          )}

          {/* Claude action proposals */}
          {claude.pendingActions.length > 0 && (
            <div className="px-4 md:px-6 py-3 space-y-2 bg-amber-500/5 border-t border-amber-500/20">
              <div className="flex items-center justify-between">
                <p className="text-xs text-amber-400 font-medium">Claude suggests ({claude.pendingActions.length} remaining):</p>
                {claude.pendingActions.length > 1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        for (const action of [...claude.pendingActions]) {
                          if (action.type === 'create_card' && onAddCard) {
                            onAddCard(ideaId, action.params.columnId || 'todo', action.params.text);
                          }
                        }
                        await submitComment(`Approved all ${claude.pendingActions.length} suggested actions`, 'Claude');
                        onCommentAdded?.(card.id);
                        claude.clearPendingActions();
                      }}
                      className="px-2 py-1 text-xs rounded bg-amber-600 hover:bg-amber-500 text-white transition"
                    >
                      Approve All
                    </button>
                    <button
                      onClick={handleDismissAllActions}
                      className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                    >
                      Dismiss All
                    </button>
                  </div>
                )}
              </div>
              {claude.pendingActions.map((action, i) => (
                <div key={i} className="flex items-center justify-between gap-2 bg-slate-900/60 rounded-lg px-3 py-2 border border-slate-800">
                  <span className="text-sm text-slate-300">
                    {action.type === 'create_card' && `Create card: "${action.params.text}" in ${action.params.columnId || 'todo'}`}
                    {action.type === 'move_card' && `Move card to ${action.params.columnId}`}
                    {action.type === 'modify_card' && `Update card: ${action.params.text || 'changes'}`}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveAction(action, i)}
                      className="px-2 py-1 text-xs rounded bg-amber-600 hover:bg-amber-500 text-white transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDismissAction(i)}
                      className="px-2 py-1 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="p-4 md:p-6 border-t border-slate-800 bg-slate-900/60 flex flex-col gap-3 md:gap-4">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                <h4 className="text-sm font-semibold text-slate-200">Next Action</h4>
                <p className="text-xs text-slate-500">{selectedActionDescription}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {actionOptions.map((action) => (
                  <motion.button
                    key={action.key}
                    type="button"
                    onClick={() => handleComposerModeChange(action.key)}
                    aria-pressed={composerMode === action.key}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border transition text-xs sm:text-sm ${
                      composerMode === action.key
                        ? 'bg-gradient-to-r from-brand-purple-600 to-brand-cyan-600 border-brand-purple-500 text-white shadow-card'
                        : 'bg-surface-elevated border-border text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon name={action.icon} className="w-3.5 h-3.5" />
                    <span>{action.label}</span>
                  </motion.button>
                ))}
              </div>
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

            <div className="rounded-xl border border-slate-800/80 bg-slate-950/35 p-3 md:p-4">
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
                    rows={3}
                    placeholder="Share your thoughts..."
                    className="input-field resize-none"
                    disabled={isActionBusy}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-text-muted">Press Enter to send, Shift+Enter for a new line.</p>
                    <motion.button
                      type="submit"
                      disabled={!draft.trim() || isActionBusy}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-brand-purple-600 to-brand-cyan-600 hover:shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
                      aria-label="Send comment"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Icon name="send" className="w-4 h-4" />
                      <span>Send</span>
                    </motion.button>
                  </div>
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
                  <p className="text-xs text-slate-500">Capture reproducible bug details and log a formal MI record.</p>
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
                    onClick={() => handleComposerModeChange('comment')}
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
                  <p className="text-xs text-slate-500">Document the implementation plan before creating an upgrade report.</p>
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
                    onClick={() => handleComposerModeChange('comment')}
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

              {composerMode === 'claude' && (
                <motion.form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!draft.trim()) return;
                    handleSubmit();
                  }}
                  className="flex flex-col gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <label htmlFor="claude-prompt" className="text-sm text-text-secondary font-medium">
                    Ask Claude
                  </label>
                  <textarea
                    id="claude-prompt"
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.startsWith('@claude ') ? e.target.value : `@claude ${e.target.value}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit();
                      }
                    }}
                    rows={3}
                    placeholder="Ask Claude anything about this card..."
                    className="input-field resize-none"
                    disabled={isActionBusy || claude.isThinking}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-text-muted">Claude has context about this card and your board.</p>
                    <motion.button
                      type="submit"
                      disabled={!draft.trim() || isActionBusy || claude.isThinking}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:shadow-glow-purple disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all"
                      aria-label="Send to Claude"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Icon name="sparkles" className="w-4 h-4" />
                      <span>{claude.isThinking ? 'Thinking...' : 'Ask Claude'}</span>
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </div>
          </div>
        </section>
      </motion.div>
    </motion.div>
  );
};

export default CardDetailModal;
