import type { FC, SVGProps } from 'react'

// ─── App definition ──────────────────────────────────────────────────────────

export interface AppInfo {
  id:       string
  name:     string
  category: 'Development' | 'Productivity' | 'Design' | 'Utility' | 'Browser'
  color:    string          // brand color for the icon
  icon:     FC<SVGProps<SVGSVGElement>>
}

// ─── Tiny SVG icons (16×16 viewBox) ──────────────────────────────────────────

const IconXAMPP: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#FB7A24" />
    <path d="M4 4l4 4m0-4L4 8M8 8l4 4m0-4L8 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const IconVSCode: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#007ACC" />
    <path d="M11 3v10l-7-5 7-5zM4 4.5l5 3.5-5 3.5" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
)

const IconVSCodePurple: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#8B5CF6" />
    <path d="M11 3v10l-7-5 7-5zM4 4.5l5 3.5-5 3.5" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
)

const IconMSOffice: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#D83B01" />
    <path d="M4 4h3v8H4V4zm5 1h3v6H9V5z" fill="#fff" fillOpacity="0.9" />
  </svg>
)

const IconTypingMaster: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#2B9348" />
    <rect x="3" y="8" width="10" height="5" rx="1" fill="#fff" fillOpacity="0.9" />
    <rect x="4" y="9.5" width="1.5" height="1" rx="0.2" fill="#2B9348" />
    <rect x="6" y="9.5" width="1.5" height="1" rx="0.2" fill="#2B9348" />
    <rect x="8" y="9.5" width="1.5" height="1" rx="0.2" fill="#2B9348" />
    <rect x="10" y="9.5" width="1.5" height="1" rx="0.2" fill="#2B9348" />
    <rect x="5" y="11" width="6" height="1" rx="0.2" fill="#2B9348" />
    <path d="M5 7l3-3.5L11 7" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconBrackets: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#0D47A1" />
    <path d="M5 3.5L3 8l2 4.5M11 3.5l2 4.5-2 4.5" stroke="#42A5F5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconPostman: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#FF6C37" />
    <circle cx="8" cy="8" r="4" fill="#fff" fillOpacity="0.9" />
    <path d="M6.5 8l1 1 2.5-2.5" stroke="#FF6C37" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconBrowser: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#4285F4" />
    <circle cx="8" cy="8.5" r="3.5" stroke="#fff" strokeWidth="1.2" />
    <path d="M4.5 8.5h7M8 5v7M5.2 6.3a4 4 0 005.6 0M5.2 10.7a4 4 0 015.6 0" stroke="#fff" strokeWidth="0.7" />
  </svg>
)

const IconNotepadPP: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#90BE6D" />
    <rect x="4" y="3" width="8" height="10" rx="1" fill="#fff" fillOpacity="0.9" />
    <path d="M6 6h4M6 8h4M6 10h2.5" stroke="#555" strokeWidth="0.8" strokeLinecap="round" />
  </svg>
)

const IconAdobe: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#FF0000" />
    <path d="M3 12L8 3l5 9H3z" fill="#fff" fillOpacity="0.9" />
    <path d="M8 7.5l2 4.5H6l2-4.5z" fill="#FF0000" />
  </svg>
)

// Chrome
const IconChrome: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#1A73E8" />
    <circle cx="8" cy="8" r="3" fill="#fff" />
    <circle cx="8" cy="8" r="1.5" fill="#1A73E8" />
    <path d="M11 8a3 3 0 00-.5-1.7L14 5" stroke="#EA4335" strokeWidth="1.2" />
    <path d="M6.5 10.6A3 3 0 015 8l-3.5 1" stroke="#34A853" strokeWidth="1.2" />
    <path d="M9.5 10.6a3 3 0 01-1.5.4L6.5 14" stroke="#FBBC05" strokeWidth="1.2" />
  </svg>
)

// Firefox
const IconFirefox: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect width="16" height="16" rx="3" fill="#FF7139" />
    <circle cx="8" cy="8.5" r="4" fill="#fff" fillOpacity="0.85" />
    <path d="M6 5c1-2 5-1 5 2s-2 3-3 4" stroke="#FF7139" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// ─── Full app catalog ────────────────────────────────────────────────────────

export const APP_CATALOG: AppInfo[] = [
  { id: 'xampp',           name: 'XAMPP',               category: 'Development',  color: '#FB7A24', icon: IconXAMPP },
  { id: 'vscode',          name: 'VS Code',             category: 'Development',  color: '#007ACC', icon: IconVSCode },
  { id: 'vscode-purple',   name: 'VS Code (Purple)',    category: 'Development',  color: '#8B5CF6', icon: IconVSCodePurple },
  { id: 'ms-office',       name: 'MS Office',           category: 'Productivity', color: '#D83B01', icon: IconMSOffice },
  { id: 'typing-master',   name: 'Typing Master',       category: 'Productivity', color: '#2B9348', icon: IconTypingMaster },
  { id: 'brackets',        name: 'Brackets',            category: 'Development',  color: '#0D47A1', icon: IconBrackets },
  { id: 'postman',         name: 'Postman',             category: 'Development',  color: '#FF6C37', icon: IconPostman },
  { id: 'chrome',          name: 'Google Chrome',       category: 'Browser',      color: '#1A73E8', icon: IconChrome },
  { id: 'firefox',         name: 'Mozilla Firefox',     category: 'Browser',      color: '#FF7139', icon: IconFirefox },
  { id: 'browsers',        name: 'Other Browsers',      category: 'Browser',      color: '#4285F4', icon: IconBrowser },
  { id: 'notepad-pp',      name: 'Notepad++',           category: 'Development',  color: '#90BE6D', icon: IconNotepadPP },
  { id: 'adobe-apps',      name: 'Adobe Apps',          category: 'Design',       color: '#FF0000', icon: IconAdobe },
]

export const APP_MAP = Object.fromEntries(APP_CATALOG.map(a => [a.id, a]))
