import type { FC, SVGProps } from 'react'

// ─── App definition ──────────────────────────────────────────────────────────

export interface AppInfo {
  id:       string
  name:     string
  category: 'Development' | 'Productivity' | 'Design' | 'Utility' | 'Browser'
  color:    string
  icon:     FC<SVGProps<SVGSVGElement>>
}

// ─── Brand-accurate SVG icons (24×24 viewBox) ───────────────────────────────

/* XAMPP — Orange background, stylised "X" with server stack lines */
const IconXAMPP: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#FB7A24"/>
    <path d="M7 6l5 6 5-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 18l5-6 5 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="1.5" fill="#fff"/>
  </svg>
)

/* VS Code — Blue background, the recognisable folded-ribbon / angular bracket mark */
const IconVSCode: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#007ACC"/>
    <path d="M16.5 4v16L6 15l3.5-3L6 9l10.5-5z" fill="#fff" fillOpacity="0.95"/>
    <path d="M16.5 4L9.5 12l7 8" stroke="#007ACC" strokeWidth="1.5" fill="none"/>
    <path d="M6 9l3.5 3L6 15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

/* VS Code (Purple / Insiders) — Purple version of the same mark */
const IconVSCodePurple: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#8B5CF6"/>
    <path d="M16.5 4v16L6 15l3.5-3L6 9l10.5-5z" fill="#fff" fillOpacity="0.95"/>
    <path d="M16.5 4L9.5 12l7 8" stroke="#8B5CF6" strokeWidth="1.5" fill="none"/>
    <path d="M6 9l3.5 3L6 15" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
)

/* MS Office — The Microsoft "M" + four‑colour square motif */
const IconMSOffice: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#D83B01"/>
    <rect x="5" y="5" width="6" height="6" rx="0.5" fill="#F25022"/>
    <rect x="13" y="5" width="6" height="6" rx="0.5" fill="#7FBA00"/>
    <rect x="5" y="13" width="6" height="6" rx="0.5" fill="#00A4EF"/>
    <rect x="13" y="13" width="6" height="6" rx="0.5" fill="#FFB900"/>
  </svg>
)

/* Typing Master — Keyboard with speed lines */
const IconTypingMaster: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#2B9348"/>
    {/* Keyboard body */}
    <rect x="3" y="10" width="18" height="10" rx="2" fill="#fff" fillOpacity="0.95"/>
    {/* Keys row 1 */}
    <rect x="5" y="11.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="8.5" y="11.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="12" y="11.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="15.5" y="11.5" width="3" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    {/* Keys row 2 */}
    <rect x="5" y="14.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="8.5" y="14.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="12" y="14.5" width="2.5" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    <rect x="15.5" y="14.5" width="3" height="2" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    {/* Spacebar */}
    <rect x="7" y="17.5" width="10" height="1.5" rx="0.5" fill="#2B9348" fillOpacity="0.7"/>
    {/* Speed lines */}
    <path d="M6 7h4M5 5h6M7 3h3" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.8"/>
  </svg>
)

/* Brackets — Blue background, the iconic angle brackets < > */
const IconBrackets: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#0D47A1"/>
    <path d="M9 5L4 12l5 7" stroke="#42A5F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 5l5 7-5 7" stroke="#42A5F5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

/* Postman — Orange background, the rocket / space-helmet mark */
const IconPostman: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#FF6C37"/>
    {/* Outer ring */}
    <circle cx="12" cy="12" r="7" stroke="#fff" strokeWidth="1.5" fill="none"/>
    {/* Rocket body */}
    <path d="M12 6c-1.5 2-2 4-2 6s.5 4 2 6c1.5-2 2-4 2-6s-.5-4-2-6z" fill="#fff" fillOpacity="0.9"/>
    {/* Horizontal line */}
    <path d="M5 12h14" stroke="#fff" strokeWidth="1" opacity="0.6"/>
    {/* Center dot */}
    <circle cx="12" cy="12" r="1.5" fill="#FF6C37"/>
  </svg>
)

/* Google Chrome — The four‑colour pinwheel + blue center circle */
const IconChrome: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#fff"/>
    {/* Red section (top) */}
    <path d="M12 5a7 7 0 016.06 3.5H12V5z" fill="#EA4335"/>
    <path d="M18.06 8.5A7 7 0 0119 12h-3.5L12 8.5h6.06z" fill="#EA4335"/>
    {/* Yellow section (bottom-right) */}
    <path d="M19 12a7 7 0 01-3.5 6.06L12 12h7z" fill="#FBBC05"/>
    <path d="M15.5 18.06A7 7 0 0112 19v-3.5l3.5-5.5v8.06z" fill="#FBBC05"/>
    {/* Green section (bottom-left) */}
    <path d="M12 19a7 7 0 01-6.06-3.5L12 12v7z" fill="#34A853"/>
    <path d="M5.94 15.5A7 7 0 015 12h3.5l3.5 3.5-6.06-0z" fill="#34A853"/>
    {/* Red section cont. */}
    <path d="M5 12a7 7 0 013.5-6.06L12 12H5z" fill="#EA4335"/>
    {/* Outer circle to clean up */}
    <circle cx="12" cy="12" r="7" fill="none" stroke="#fff" strokeWidth="0.5"/>
    {/* Blue center */}
    <circle cx="12" cy="12" r="3" fill="#4285F4"/>
    <circle cx="12" cy="12" r="3" fill="none" stroke="#fff" strokeWidth="0.8"/>
  </svg>
)

/* Mozilla Firefox — Globe with fox wrapping around */
const IconFirefox: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#20123A"/>
    {/* Globe */}
    <circle cx="12" cy="12" r="7.5" fill="url(#ffGrad)"/>
    <defs>
      <radialGradient id="ffGrad" cx="0.3" cy="0.3" r="0.8">
        <stop offset="0%" stopColor="#FFBD4F"/>
        <stop offset="50%" stopColor="#FF980E"/>
        <stop offset="100%" stopColor="#FF6611"/>
      </radialGradient>
    </defs>
    {/* Fox tail/wrap */}
    <path d="M18 7c1 2 1.2 4 .5 6.5C17.5 17 14.5 19 12 19c-4 0-7-3-7-7 0-1 .2-2 .7-3 .3 1.5 1.5 2.5 3 2.5-.5-2 0-4 2-5.5 0 2 1 3 2.5 3.5C14.5 10 16 9 16.5 7c.5-.1 1 0 1.5 0z" fill="#fff" fillOpacity="0.95"/>
    {/* Inner flame */}
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

/* Notepad++ — The green chameleon on a notepad */
const IconNotepadPP: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#90BE6D"/>
    {/* Notepad */}
    <rect x="5" y="4" width="14" height="17" rx="1.5" fill="#fff" fillOpacity="0.95"/>
    <rect x="5" y="4" width="14" height="3.5" rx="1.5" fill="#E8E8E8"/>
    {/* Spiral binding holes */}
    <circle cx="8" cy="5.5" r="0.7" fill="#90BE6D"/>
    <circle cx="11" cy="5.5" r="0.7" fill="#90BE6D"/>
    <circle cx="14" cy="5.5" r="0.7" fill="#90BE6D"/>
    <circle cx="17" cy="5.5" r="0.7" fill="#90BE6D"/>
    {/* Text lines */}
    <path d="M7.5 10h9M7.5 12.5h9M7.5 15h6M7.5 17.5h7.5" stroke="#B0B0B0" strokeWidth="0.9" strokeLinecap="round"/>
    {/* Green chameleon accent */}
    <circle cx="17" cy="17" r="2.5" fill="#5D9A2B" fillOpacity="0.8"/>
    <circle cx="17.5" cy="16.5" r="0.6" fill="#fff"/>
  </svg>
)

/* Adobe Creative Cloud — The iconic red "A" triangle */
const IconAdobe: FC<SVGProps<SVGSVGElement>> = (p) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...p}>
    <rect width="24" height="24" rx="5" fill="#FF0000"/>
    {/* Left triangle */}
    <path d="M4 19V5l8 14H4z" fill="#fff"/>
    {/* Right triangle */}
    <path d="M20 19V5l-8 14h8z" fill="#fff"/>
    {/* Center cutout / "A" crossbar */}
    <path d="M12 10l3 6h-3.5l-1-2.5L12 10z" fill="#FF0000"/>
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
