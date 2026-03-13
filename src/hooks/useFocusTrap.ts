import { useEffect, useRef } from 'react'

/**
 * Traps focus within a container element while active.
 * Returns a ref to attach to the container.
 */
export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(active = true) {
  const containerRef = useRef<T>(null)

  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    // Save previously focused element to restore later
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Focus first focusable element
    const focusFirst = () => {
      const focusable = container.querySelectorAll<HTMLElement>(focusableSelector)
      if (focusable.length > 0) focusable[0].focus()
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(focusFirst, 50)

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusable = Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timer)
      container.removeEventListener('keydown', handleKeyDown)
      // Restore focus
      if (previouslyFocused && previouslyFocused.focus) {
        previouslyFocused.focus()
      }
    }
  }, [active])

  return containerRef
}
