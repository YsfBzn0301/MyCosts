import { Gem, LayoutDashboard, Receipt, Settings } from 'lucide-react';
import { useI18n } from '../i18n';

export type Tab = 'dashboard' | 'fixed' | 'assets' | 'settings';

const TABS: Array<{ id: Tab; icon: typeof Receipt; key: string }> = [
  { id: 'dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { id: 'fixed', icon: Receipt, key: 'nav.fixed' },
  { id: 'assets', icon: Gem, key: 'nav.assets' },
  { id: 'settings', icon: Settings, key: 'nav.settings' },
];

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const { t } = useI18n();
  return (
    <nav aria-label={t('nav.main')} className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
      <ul className="mx-auto flex max-w-md justify-between rounded-[28px] bg-surface/90 p-2 shadow-lift ring-1 ring-line/60 backdrop-blur-md">
        {TABS.map(({ id, icon: Icon, key }) => {
          const active = id === tab;
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => onChange(id)}
                aria-current={active ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2 text-xs font-medium transition-all duration-300 ${
                  active ? 'bg-accent-soft text-accent' : 'text-muted hover:text-ink'
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 2} className={active ? 'scale-110 transition-transform' : ''} aria-hidden />
                <span>{t(key)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
