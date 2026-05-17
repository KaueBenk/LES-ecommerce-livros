import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

const createMemoryStorage = () => {
  const store = new Map();

  return {
    getItem: (key) => (store.has(String(key)) ? store.get(String(key)) : null),
    setItem: (key, value) => {
      store.set(String(key), String(value));
    },
    removeItem: (key) => {
      store.delete(String(key));
    },
    clear: () => {
      store.clear();
    },
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
};

const ensureLocalStorage = () => {
  const ls = globalThis.localStorage;
  const isValid =
    ls &&
    typeof ls.getItem === 'function' &&
    typeof ls.setItem === 'function' &&
    typeof ls.removeItem === 'function' &&
    typeof ls.clear === 'function';

  if (isValid) return;

  const mock = createMemoryStorage();

  Object.defineProperty(globalThis, 'localStorage', {
    value: mock,
    configurable: true,
    writable: true,
  });

  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', {
      value: mock,
      configurable: true,
      writable: true,
    });
  }
};

ensureLocalStorage();

// Cleanup after each test
afterEach(() => {
  cleanup();
});
