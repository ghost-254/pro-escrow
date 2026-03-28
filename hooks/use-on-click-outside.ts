import { useEffect, type RefObject } from "react"

type Event = MouseEvent | TouchEvent

export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: (_event: Event) => void,
) {
  useEffect(() => {
    const listener = (_event: Event) => {
      const el = ref?.current
      if (!el || el.contains(((_event?.target as Node) || null))) {
        return
      }

      handler(_event)
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}

