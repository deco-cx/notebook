// Lightweight storage debugging utility. Enable via ?debugStorage=1 or localStorage.DEBUG_STORAGE=1

type LS = typeof window.localStorage;

function safeParse<T = any>(str: string | null): T | undefined {
  if (!str) return undefined;
  try { return JSON.parse(str) as T; } catch { return undefined; }
}

function short(str: string | null, n = 120) {
  if (!str) return 'null';
  return str.length > n ? str.slice(0, n) + '…' : str;
}

function shouldEnable(): boolean {
  try {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get('debugStorage');
    if (qp === '0') return false;
    if (qp === '1') return true;
    if (localStorage.getItem('DEBUG_STORAGE') === '1') return true;
    // Default ON in dev unless explicitly disabled
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) return true;
    return false;
  } catch {
    return false;
  }
}

function diffNotebooks(beforeRaw: string | null, afterRaw: string | null) {
  const before = safeParse<Record<string, any>>(beforeRaw) || {};
  const after = safeParse<Record<string, any>>(afterRaw) || {};

  const beforeIds = Object.keys(before);
  const afterIds = Object.keys(after);
  const addedNotebooks = afterIds.filter(k => !beforeIds.includes(k));
  const removedNotebooks = beforeIds.filter(k => !afterIds.includes(k));
  const changed: Array<{ id: string; before: number; after: number; }> = [];
  for (const id of afterIds) {
    const b = before[id];
    const a = after[id];
    const bc = Array.isArray(b?.cells) ? b.cells.length : -1;
    const ac = Array.isArray(a?.cells) ? a.cells.length : -1;
    if (bc !== ac) changed.push({ id, before: bc, after: ac });
  }
  return { addedNotebooks, removedNotebooks, changed };
}

export function enableStorageDebug() {
  if (!shouldEnable()) return;
  if ((window as any).__storageDebugEnabled) return;

  (window as any).__storageDebugEnabled = true;
  const original: LS = window.localStorage;

  console.log('🧩 Storage debug enabled');

  const patched: LS = {
    get length() { return original.length; },
    clear() {
      console.groupCollapsed('localStorage.clear()');
      console.trace();
      console.groupEnd();
      return original.clear();
    },
    getItem(key: string) {
      const value = original.getItem(key);
      if (key === 'notebooks') {
        console.log('localStorage.getItem("notebooks") =>', value ? `len=${value.length}` : 'null');
      }
      return value;
    },
    key(index: number) { return original.key(index); },
    removeItem(key: string) {
      const before = original.getItem(key);
      console.groupCollapsed(`localStorage.removeItem("${key}")`);
      if (key === 'notebooks') {
        console.log('Before:', short(before));
      }
      console.trace();
      console.groupEnd();
      return original.removeItem(key);
    },
    setItem(key: string, value: string) {
      const before = original.getItem(key);
      const result = original.setItem(key, value);
      console.groupCollapsed(`localStorage.setItem("${key}")`);
      if (key === 'notebooks') {
        try {
          const { addedNotebooks, removedNotebooks, changed } = diffNotebooks(before, value);
          console.log('Before:', short(before));
          console.log('After :', short(value));
          console.log('Diff  :', { addedNotebooks, removedNotebooks, changed });
        } catch (e) {
          console.log('Before:', short(before));
          console.log('After :', short(value));
        }
      }
      console.trace();
      console.groupEnd();
      return result;
    },
  } as LS;

  // Monkey-patch global
  Object.defineProperty(window, 'localStorage', {
    get() { return patched; }
  });

  // Add helper to print current notebooks
  (window as any).debugNotebooks = () => {
    const raw = original.getItem('notebooks');
    console.log('📚 notebooks raw:', short(raw, 500));
    const parsed = safeParse(raw);
    console.log('📚 notebooks parsed:', parsed);
    return parsed;
  };
}


