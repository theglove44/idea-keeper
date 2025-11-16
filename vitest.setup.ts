import '@testing-library/jest-dom/vitest';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto) {
  // @ts-ignore - webcrypto provides the needed subset for tests
  globalThis.crypto = webcrypto as Crypto;
}
