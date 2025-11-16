import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
import { vi } from 'vitest';
import CardDetailModal from '../CardDetailModal';
import { Card } from '../../types';

const submitCommentMock = vi.fn();
const reloadMock = vi.fn();
const createMIReportMock = vi.fn();
const createUpgradeReportMock = vi.fn();

let hookState = {
  comments: [],
  isLoading: false,
  isSubmitting: false,
  error: null as string | null,
  submitComment: submitCommentMock,
  reloadComments: reloadMock,
};

vi.mock('../../hooks/useCardComments', () => ({
  useCardComments: () => hookState,
}));

vi.mock('../../services/reportService', () => ({
  createMIReport: (...args: any[]) => createMIReportMock(...args),
  createUpgradeReport: (...args: any[]) => createUpgradeReportMock(...args),
}));

const baseCard: Card = {
  id: 'card-1',
  text: 'Brainstorm onboarding ideas',
  createdAt: new Date('2023-01-01T00:00:00Z').toISOString(),
};

const renderModal = (overrides: Partial<typeof hookState> = {}) => {
  hookState = { ...hookState, ...overrides };
  return render(
    <CardDetailModal
      card={baseCard}
      columnTitle="Backlog"
      columnId="backlog"
      ideaId="idea-1"
      ideaTitle="Sample Idea"
      onClose={vi.fn()}
    />
  );
};

beforeEach(() => {
  submitCommentMock.mockReset();
  reloadMock.mockReset();
  createMIReportMock.mockReset();
  createUpgradeReportMock.mockReset();
  submitCommentMock.mockResolvedValue(undefined);
  hookState = {
    comments: [
      {
        id: 'c1',
        cardId: baseCard.id,
        body: 'Kick off with a welcome video',
        author: 'Alex',
        createdAt: new Date('2023-01-02T00:00:00Z').toISOString(),
      },
    ],
    isLoading: false,
    isSubmitting: false,
    error: null,
    submitComment: submitCommentMock,
    reloadComments: reloadMock,
  };
});

describe('CardDetailModal', () => {
  it('renders card details and existing comments', () => {
    renderModal();

    expect(screen.getByText(baseCard.text)).toBeInTheDocument();
    expect(screen.getByText('Kick off with a welcome video')).toBeInTheDocument();
    expect(screen.getByText(/Backlog/i)).toBeInTheDocument();
  });

  it('submits a new comment when Enter is pressed', async () => {
    renderModal();

    const input = screen.getByPlaceholderText('Share your thoughts...');

    await act(async () => {
      fireEvent.change(input, { target: { value: 'Add product tour' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(submitCommentMock).toHaveBeenCalledWith('Add product tour');
  });

  it('creates an MI report when bug action is submitted', async () => {
    createMIReportMock.mockResolvedValue({ id: 'MI-123', filePath: '/MI Reports/MI-123.json' });
    renderModal();

    const bugButton = screen.getByRole('button', { name: /report bug/i });
    fireEvent.click(bugButton);

    fireEvent.change(screen.getByPlaceholderText('Short description'), {
      target: { value: 'Broken link' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Describe the issue, steps to reproduce, expected vs actual'),
      {
        target: { value: 'Steps to reproduce...' },
      }
    );

    await act(async () => {
      fireEvent.click(screen.getByText(/create mi report/i));
    });

    expect(createMIReportMock).toHaveBeenCalledWith(
      expect.objectContaining({ summary: 'Broken link', cardId: baseCard.id })
    );
    expect(submitCommentMock).toHaveBeenCalledWith(
      expect.stringContaining('MI report MI-123')
    );
  });

  it('creates an upgrade report with checklist items', async () => {
    createUpgradeReportMock.mockResolvedValue({ id: 'UPG-9', filePath: '/Upgrade/UPG-9.json' });
    renderModal();

    const upgradeButton = screen.getByRole('button', { name: /start upgrade/i });
    fireEvent.click(upgradeButton);

    fireEvent.change(screen.getByPlaceholderText('What are we improving?'), {
      target: { value: 'Improve onboarding' },
    });
    fireEvent.change(screen.getByPlaceholderText('Outline the implementation steps'), {
      target: { value: '1. Plan 2. Build' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 6h, 2 days'), {
      target: { value: '2 days' },
    });

    await act(async () => {
      fireEvent.click(screen.getByText(/create upgrade report/i));
    });

    expect(createUpgradeReportMock).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Improve onboarding', checklist: expect.any(Array) })
    );
    expect(submitCommentMock).toHaveBeenCalledWith(
      expect.stringContaining('Upgrade report UPG-9')
    );
  });
});
