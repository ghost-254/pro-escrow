// hooks/use-media-query.ts

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const media = window.matchMedia(query)
    setMatches(media.matches)
    /* eslint-enable react-hooks/set-state-in-effect */
    const listener = () => setMatches(media.matches)
    media.addListener(listener)
    return () => media.removeListener(listener)
  }, [query])

  return matches
}
