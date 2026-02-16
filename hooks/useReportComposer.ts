import { FormEvent, useEffect, useState } from 'react';
import { Card, SeverityLevel } from '../types';
import { createMIReport, createUpgradeReport } from '../services/reportService';

export type ComposerMode = 'comment' | 'mi' | 'upgrade' | 'claude';

const defaultChecklist = ['Define scope', 'Review plan', 'QA sign-off'];

type UseReportComposerParams = {
  card: Card;
  ideaId: string;
  ideaTitle: string;
  columnId: string;
  columnTitle: string;
  onCommentAdded?: (cardId: string) => void;
  submitComment: (body: string, author?: string | null) => Promise<void>;
};

export const useReportComposer = ({
  card,
  ideaId,
  ideaTitle,
  columnId,
  columnTitle,
  onCommentAdded,
  submitComment,
}: UseReportComposerParams) => {
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

  const handleComposerModeChange = (mode: ComposerMode) => {
    setComposerMode(mode);
    setReportError(null);
    setReportSuccess(null);
  };

  const handleCreateMIReport = async (event?: FormEvent) => {
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

  const handleCreateUpgradeReport = async (event?: FormEvent) => {
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
      await submitComment(`🚀 Upgrade report ${result.id} created (Est. ${upgradeEstimate.trim()}).`);
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

  return {
    composerMode,
    handleComposerModeChange,
    miSummary,
    setMiSummary,
    miDetails,
    setMiDetails,
    miSeverity,
    setMiSeverity,
    upgradeDescription,
    setUpgradeDescription,
    upgradePlan,
    setUpgradePlan,
    upgradeEstimate,
    setUpgradeEstimate,
    upgradeChecklist,
    reportError,
    reportSuccess,
    isReportSubmitting,
    handleCreateMIReport,
    handleCreateUpgradeReport,
    handleChecklistChange,
    handleAddChecklistItem,
    handleRemoveChecklistItem,
  };
};

