import type { FC, SVGProps } from 'react'
import { cn } from '@/lib/utils'

// ─── App definition ──────────────────────────────────────────────────────────

export interface AppInfo {
  id:       string
  name:     string
  category: 'Development' | 'Productivity' | 'Design' | 'Utility' | 'Browser'
  color:    string
  /** Path to an image icon in /icons/ (preferred) */
  iconUrl?: string
  /** Fallback SVG component icon */
  icon?:    FC<SVGProps<SVGSVGElement>>
}

// ─── AppIcon helper – renders either <img> or <SVG> ─────────────────────────

export function AppIcon({ app, className }: { app: AppInfo; className?: string }) {
  if (app.iconUrl) {
    return (
      <img
        src={app.iconUrl}
        alt={app.name}
        className={cn('object-contain', className)}
        draggable={false}
      />
    )
  }
  if (app.icon) {
    const Icon = app.icon
    return <Icon className={className} />
  }
  return null
}

// ─── SVG fallback icons (for apps without uploaded images) ───────────────────

/* Typing Master — Keyboard with speed lines */
const IconTypingMaster: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#2B9348"/>
    <rect x="3" y="10" width="18" height="10" rx="2" fill="#fff" fillOpacity="0.95"/>
    <rect x="5" y="11.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="8.5" y="11.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="12" y="11.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="15.5" y="11.5" width="3" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="5" y="14.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="8.5" y="14.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="12" y="14.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="15.5" y="14.5" width="3" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="7" y="17.5" width="10" height="1.5" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <path d="M6 7h4M5 5h6M7 3h3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
  </svg>
)

/* Brackets — Blue background, angle brackets < > */
const IconBrackets: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#0D47A1"/>
    <path d="M9 5L4 12l5 7" stroke="#42A5F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 5l5 7-5 7" stroke="#42A5F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/* Mozilla Firefox — Globe with fox */
const IconFirefox: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#20123A"/>
    <circle cx="12" cy="12" r="7.5" fill="url(#ffGrad)"/>
    <defs>
      <radialGradient id="ffGrad" cx="0.3" cy="0.3" r="0.8">
        <stop offset="0%" stopColor="#FFBD4F"/>
        <stop offset="50%" stopColor="#FF980E"/>
        <stop offset="100%" stopColor="#FF6611"/>
      </radialGradient>
    </defs>
    <path d="M18 7c1 2 1.2 4 .5 6.5C17.5 17 14.5 19 12 19c-4 0-7-3-7-7 0-1 .2-2 .7-3 .3 1.5 1.5 2.5 3 2.5-.5-2 0-4 2-5.5 0 2 1 3 2.5 3.5C14.5 10 16 9 16.5 7c.5-.1 1 0 1.5 0z" fill="#fff" fillOpacity="0.95"/>
    <path d="M13.5 9.5c.5 1 0 2.5-1 3s-2.5 0-3-1 0-2.5 1-3 2.5 0 3 1z" fill="#FF6611" fillOpacity="0.6"/>
  </svg>
)

/* Other Browsers — Generic globe icon */
const IconBrowser: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#5F6368"/>
    <circle cx="12" cy="12" r="7" stroke="#fff" strokeWidth="1.5" fill="none"/>
    <ellipse cx="12" cy="12" rx="3" ry="7" stroke="#fff" strokeWidth="1" fill="none"/>
    <path d="M5 12h14" stroke="#fff" strokeWidth="1"/>
    <path d="M5.8 8.5h12.4M5.8 15.5h12.4" stroke="#fff" strokeWidth="0.7" opacity="0.6"/>
    <path d="M12 5v14" stroke="#fff" strokeWidth="1"/>
  </svg>
)

/* Notepad++ — Green chameleon on a notepad */
const IconNotepadPP: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#90BE6D"/>
    <rect x="5" y="4" width="14" height="17" rx="1.5" fill="#fff" fillOpacity="0.95"/>
    <rect x="5" y="4" width="14" height="3.5" rx="1.5" fill="#E8E8E8"/>
    <circle cx="8" cy="5.5" r="0.7" fill="#90BE6D"/>
    <circle cx="11" cy="5.5" r="0.7" fill="#90BE6D"/>
    <circle cx="14" cy="5.5" r="0.7" fill="#90BE6D"/>
    <circle cx="17" cy="5.5" r="0.7" fill="#90BE6D"/>
    <path d="M7.5 10h9M7.5 12.5h9M7.5 15h6M7.5 17.5h7.5" stroke="#B0B0B0" strokeWidth="0.9" strokeLinecap="round"/>
    <circle cx="17" cy="17" r="2.5" fill="#5D9A2B" fillOpacity="0.8"/>
    <circle cx="17.5" cy="16.5" r="0.6" fill="#fff"/>
  </svg>
)

/* Adobe Creative Cloud — Red "A" triangle */
const IconAdobe: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#FF0000"/>
    <path d="M4 19V5l8 14H4z" fill="#fff"/>
    <path d="M20 19V5l-8 14h8z" fill="#fff"/>
    <path d="M12 10l3 6h-3.5l-1-2.5L12 10z" fill="#FF0000"/>
  </svg>
)

// ─── Full app catalog ────────────────────────────────────────────────────────

export const APP_CATALOG: AppInfo[] = [
  // Development — image-based
  { id: 'xampp',           name: 'XAMPP',               category: 'Development',  color: '#FB7A24', iconUrl: '/icons/xampp.png' },
  { id: 'vscode',          name: 'VS Code',             category: 'Development',  color: '#007ACC', iconUrl: '/icons/vscode.png' },
  { id: 'vscode-purple',   name: 'VS Code (Purple)',    category: 'Development',  color: '#8B5CF6', iconUrl: '/icons/vscode-purple.png' },
  { id: 'postman',         name: 'Postman',             category: 'Development',  color: '#FF6C37', iconUrl: '/icons/postman.png' },
  // Development — SVG fallback
  { id: 'brackets',        name: 'Brackets',            category: 'Development',  color: '#0D47A1', icon: IconBrackets },
  { id: 'notepad-pp',      name: 'Notepad++',           category: 'Development',  color: '#90BE6D', icon: IconNotepadPP },
  // Productivity — image-based (split from MS Office)
  { id: 'word',            name: 'Microsoft Word',      category: 'Productivity', color: '#2B579A', iconUrl: '/icons/word.png' },
  { id: 'excel',           name: 'Microsoft Excel',     category: 'Productivity', color: '#217346', iconUrl: '/icons/excel.jpeg' },
  { id: 'ppt',             name: 'Microsoft PowerPoint',category: 'Productivity', color: '#D24726', iconUrl: '/icons/ppt.png' },
  // Productivity — SVG fallback
  { id: 'typing-master',   name: 'Typing Master',       category: 'Productivity', color: '#2B9348', icon: IconTypingMaster },
  // Design — image-based
  { id: 'blender',         name: 'Blender',             category: 'Design',       color: '#EA7600', iconUrl: '/icons/blender.png' },
  // Design — SVG fallback
  { id: 'adobe-apps',      name: 'Adobe Apps',          category: 'Design',       color: '#FF0000', icon: IconAdobe },
  // Browser — image-based
  { id: 'chrome',          name: 'Google Chrome',       category: 'Browser',      color: '#1A73E8', iconUrl: '/icons/chrome.png' },
  // Browser — SVG fallback
  { id: 'firefox',         name: 'Mozilla Firefox',     category: 'Browser',      color: '#FF7139', icon: IconFirefox },
  { id: 'browsers',        name: 'Other Browsers',      category: 'Browser',      color: '#4285F4', icon: IconBrowser },
]

export const APP_MAP = Object.fromEntries(APP_CATALOG.map(a => [a.id, a]))
