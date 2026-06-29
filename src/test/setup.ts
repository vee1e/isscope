import '@testing-library/jest-dom';
import { JSDOM } from 'jsdom';
import { vi } from 'vitest';

window.HTMLElement.prototype.scrollIntoView = vi.fn();

const storage = new JSDOM('', { url: 'http://localhost/' }).window;
for (const key of ['localStorage', 'sessionStorage'] as const) {
  Object.defineProperty(globalThis, key, {
    value: storage[key],
    configurable: true,
    writable: true,
  });
}
