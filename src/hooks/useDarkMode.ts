import { useCallback, useEffect, useState } from 'react';

const KEY = 'exif-tool:dark';

export function useDarkMode(): { dark: boolean; toggle: () => void } {
  const [dark, setDark] = useState<boolean>(() => {
    const saved = localStorage.getItem(KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem(KEY, dark ? '1' : '0');
  }, [dark]);

  const toggle = useCallback(() => setDark((d) => !d), []);
  return { dark, toggle };
}
