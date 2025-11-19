import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcutOptions {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
  enabled?: boolean;
  description?: string;
}

/**
 * Global keyboard shortcut hook
 *
 * @example
 * useKeyboardShortcut({
 *   key: 'k',
 *   ctrl: true,
 *   meta: true,
 *   description: 'Open search',
 * }, () => openSearch());
 */
export function useKeyboardShortcut(
  options: KeyboardShortcutOptions,
  callback: () => void
) {
  const callbackRef = useRef(callback);
  const { enabled = true, preventDefault = true } = options;

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      // Check if we're in an input field (exclude shortcuts when typing)
      const target = event.target as HTMLElement;
      const isInInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow Escape and Cmd/Ctrl shortcuts even in input fields
      const isAllowedInInput =
        event.key === 'Escape' ||
        event.metaKey ||
        event.ctrlKey;

      if (isInInput && !isAllowedInInput) {
        return;
      }

      // Match the shortcut
      const keyMatches = event.key.toLowerCase() === options.key.toLowerCase();
      const ctrlMatches = options.ctrl ? event.ctrlKey : true;
      const metaMatches = options.meta ? event.metaKey : true;
      const shiftMatches = options.shift !== undefined ? event.shiftKey === options.shift : true;
      const altMatches = options.alt !== undefined ? event.altKey === options.alt : true;

      // Handle Cmd/Ctrl (cross-platform)
      const cmdCtrlMatches = (options.ctrl || options.meta)
        ? (event.ctrlKey || event.metaKey)
        : (!options.ctrl && !options.meta) ? (!event.ctrlKey && !event.metaKey) : true;

      if (
        keyMatches &&
        (options.ctrl || options.meta ? cmdCtrlMatches : ctrlMatches && metaMatches) &&
        shiftMatches &&
        altMatches
      ) {
        if (preventDefault) {
          event.preventDefault();
        }
        callbackRef.current();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, options.key, options.ctrl, options.meta, options.shift, options.alt, preventDefault]);
}

/**
 * Hook to register multiple keyboard shortcuts
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{
    options: KeyboardShortcutOptions;
    callback: () => void;
  }>
) {
  shortcuts.forEach(({ options, callback }) => {
    useKeyboardShortcut(options, callback);
  });
}

/**
 * Get keyboard shortcut display string
 */
export function getShortcutDisplay(options: KeyboardShortcutOptions): string {
  const parts: string[] = [];
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  if (options.ctrl || options.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (options.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (options.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  // Format the key
  let key = options.key.toUpperCase();
  if (key === 'ESCAPE') key = isMac ? '⎋' : 'Esc';
  if (key === 'ENTER') key = isMac ? '↵' : 'Enter';
  if (key === 'ARROWUP') key = '↑';
  if (key === 'ARROWDOWN') key = '↓';
  if (key === 'ARROWLEFT') key = '←';
  if (key === 'ARROWRIGHT') key = '→';

  parts.push(key);

  return parts.join(isMac ? '' : '+');
}

/**
 * Registry of all keyboard shortcuts for the help modal
 */
export interface ShortcutDefinition {
  options: KeyboardShortcutOptions;
  description: string;
  category: string;
}

export const KEYBOARD_SHORTCUTS: ShortcutDefinition[] = [
  // General
  {
    options: { key: '?', shift: true },
    description: 'Show keyboard shortcuts',
    category: 'General',
  },
  {
    options: { key: 'Escape' },
    description: 'Close modal or cancel',
    category: 'General',
  },

  // Navigation
  {
    options: { key: 'j' },
    description: 'Next idea',
    category: 'Navigation',
  },
  {
    options: { key: 'k' },
    description: 'Previous idea',
    category: 'Navigation',
  },
  {
    options: { key: '1' },
    description: 'Jump to first column',
    category: 'Navigation',
  },
  {
    options: { key: '2' },
    description: 'Jump to second column',
    category: 'Navigation',
  },
  {
    options: { key: '3' },
    description: 'Jump to third column',
    category: 'Navigation',
  },
  {
    options: { key: '4' },
    description: 'Jump to fourth column',
    category: 'Navigation',
  },

  // Actions
  {
    options: { key: 'k', ctrl: true, meta: true },
    description: 'Open quick search',
    category: 'Actions',
  },
  {
    options: { key: 'n', ctrl: true, meta: true },
    description: 'Create new idea',
    category: 'Actions',
  },
  {
    options: { key: 'n', ctrl: true, meta: true, shift: true },
    description: 'Create new card',
    category: 'Actions',
  },
  {
    options: { key: 'e' },
    description: 'Edit selected card',
    category: 'Actions',
  },
  {
    options: { key: 'c' },
    description: 'Add comment',
    category: 'Actions',
  },
  {
    options: { key: 'b' },
    description: 'Brainstorm with AI',
    category: 'Actions',
  },
  {
    options: { key: 'Enter', ctrl: true, meta: true },
    description: 'Submit form',
    category: 'Actions',
  },
];
