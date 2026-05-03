import { useEffect, useMemo, useState } from 'react';
import { Camera, HelpCircle, Home as HomeIcon, Moon, Sun } from 'lucide-react';
import HomePage from './pages/Home';
import EditorPage from './pages/Editor';
import AboutPage from './pages/About';
import OfflineIndicator from './components/OfflineIndicator';
import UpdatePrompt from './components/UpdatePrompt';
import { useDarkMode } from './hooks/useDarkMode';
import { useShareTargetFiles } from './hooks/useShareTargetFiles';

type Tab = 'home' | 'editor' | 'about';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const { dark, toggle } = useDarkMode();
  const sharedFiles = useShareTargetFiles();

  // Share Target で受け取ったらエディタへ
  useEffect(() => {
    if (sharedFiles && sharedFiles.length > 0) {
      setTab('editor');
    }
  }, [sharedFiles]);

  const tabs = useMemo(
    () =>
      [
        { id: 'home' as const, label: 'ホーム', icon: HomeIcon },
        { id: 'editor' as const, label: 'エディタ', icon: Camera },
        { id: 'about' as const, label: '使い方', icon: HelpCircle },
      ] satisfies { id: Tab; label: string; icon: typeof HomeIcon }[],
    [],
  );

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            type="button"
            className="flex items-center gap-2 font-bold"
            onClick={() => setTab('home')}
          >
            <span className="text-xl">📷</span>
            <span>EXIF プライバシーツール</span>
          </button>
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <button
              type="button"
              aria-label={dark ? 'ライトモードへ' : 'ダークモードへ'}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={toggle}
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4">
        {tab === 'home' && <HomePage onStart={() => setTab('editor')} />}
        {tab === 'editor' && <EditorPage initialFiles={sharedFiles ?? undefined} />}
        {tab === 'about' && <AboutPage />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div
          className="mx-auto grid max-w-3xl grid-cols-3"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`flex flex-col items-center gap-1 py-3 text-xs ${
                  active
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
                onClick={() => setTab(t.id)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={20} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <UpdatePrompt />
    </div>
  );
}
