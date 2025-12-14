import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const update = () => {
      const width = window.innerWidth
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const ua = navigator.userAgent.toLowerCase()
      const uaMobile = /iphone|android.*mobile|mobile safari/.test(ua)
      setIsMobile(uaMobile || (width < MOBILE_BREAKPOINT && hasTouch))
    }
    update()
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`) 
    const onChange = () => update()
    mql.addEventListener("change", onChange)
    window.addEventListener('resize', onChange, { passive: true })
    window.addEventListener('orientationchange', onChange)
    return () => {
      mql.removeEventListener("change", onChange)
      window.removeEventListener('resize', onChange)
      window.removeEventListener('orientationchange', onChange)
    }
  }, [])

  return !!isMobile
}
