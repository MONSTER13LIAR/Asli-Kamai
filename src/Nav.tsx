import { useLang } from './lang'

export type Tab = 'home' | 'coach' | 'learn' | 'goal'
export const TABS: Tab[] = ['home', 'coach', 'learn', 'goal']

const ICONS: Record<Tab, React.ReactNode> = {
  home: <path d="M3 11.5 12 4l9 7.5M5.5 10.5V20h13v-9.5" />,
  coach: <path d="M4 5h16v11H9l-5 4V5z" />,
  learn: <path d="M4 6.5C7 5 9.5 5 12 6.5c2.5-1.5 5-1.5 8 0v12c-3-1.5-5.5-1.5-8 0-2.5-1.5-5-1.5-8 0v-12zM12 6.5v12" />,
  goal: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="4.5" /><circle cx="12" cy="12" r="1" fill="currentColor" /></>,
}

export function Nav({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { t } = useLang()
  return (
    <nav className="tabs" aria-label="Sections">
      {TABS.map((id) => (
        <button key={id} className={'tab' + (tab === id ? ' is-on' : '')} onClick={() => onTab(id)} aria-current={tab === id ? 'page' : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {ICONS[id]}
          </svg>
          <span>{t(id)}</span>
        </button>
      ))}
    </nav>
  )
}
