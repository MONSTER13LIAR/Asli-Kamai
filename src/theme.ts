import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'aslikamai.theme'

const systemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

// The site and the app share one stored choice; with none stored we follow the phone.
export const readTheme = (): Theme => {
  try {
    const t = localStorage.getItem(KEY)
    if (t === 'light' || t === 'dark') return t
  } catch {
    /* fall through to the system setting */
  }
  return systemTheme()
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#121417' : '#17643f')
    try {
      localStorage.setItem(KEY, theme)
    } catch {
      /* the choice just won't survive a reload */
    }
  }, [theme])

  return { theme, toggle: () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')) }
}
