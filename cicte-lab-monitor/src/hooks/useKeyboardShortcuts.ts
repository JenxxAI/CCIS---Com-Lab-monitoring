import { useEffect } from 'react'
import { useLabStore } from '@/store'

/**
 * Global keyboard shortcuts:
 *   Ctrl+K  (or Cmd+K)  → open global search modal
 *   Ctrl+/  (or Cmd+/)  → focus the search input in the active view
 *   Escape              → deselect the currently selected PC
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName

      // Ctrl+K or Cmd+K → open global search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('cicte:global-search'))
        return
      }

      // Ctrl+/ or Cmd+/ → focus search
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent('cicte:focus-search'))
        return
      }

      // Escape → deselect PC (only when not typing in an input/textarea)
      if (e.key === 'Escape' && tag !== 'INPUT' && tag !== 'TEXTAREA') {
        useLabStore.getState().setSelectedPC(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
