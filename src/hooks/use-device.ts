'use client'

import * as React from 'react'

type DeviceInfo = {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  hasTouch: boolean
  os: 'iOS' | 'Android' | 'Windows' | 'Mac' | 'Linux' | 'Unknown'
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'Other'
}

function parseUA(ua: string): Pick<DeviceInfo, 'isMobile' | 'isTablet' | 'os' | 'browser'> {
  const lower = ua.toLowerCase()
  const isIPad = /ipad/.test(lower)
  const isAndroid = /android/.test(lower)
  const isIPhone = /iphone/.test(lower)
  const isMobile = isIPhone || (isAndroid && /mobile/.test(lower))
  const isTablet = isIPad || (isAndroid && !/mobile/.test(lower))

  let os: DeviceInfo['os'] = 'Unknown'
  if (isIPhone || isIPad) os = 'iOS'
  else if (isAndroid) os = 'Android'
  else if (/windows/.test(lower)) os = 'Windows'
  else if (/mac os x/.test(lower)) os = 'Mac'
  else if (/linux/.test(lower)) os = 'Linux'

  let browser: DeviceInfo['browser'] = 'Other'
  if (/edg\//.test(lower)) browser = 'Edge'
  else if (/chrome\//.test(lower)) browser = 'Chrome'
  else if (/safari\//.test(lower) && !/chrome\//.test(lower)) browser = 'Safari'
  else if (/firefox\//.test(lower)) browser = 'Firefox'
  else if (/opera|opr\//.test(lower)) browser = 'Opera'

  return { isMobile, isTablet, os, browser }
}

export function useDevice(): DeviceInfo {
  const [info, setInfo] = React.useState<DeviceInfo>(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    hasTouch: false,
    os: 'Unknown',
    browser: 'Other',
  }))

  React.useEffect(() => {
    const update = () => {
      const width = window.innerWidth
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const ua = navigator.userAgent || ''
      const parsed = parseUA(ua)
      const viewportMobile = width < 768
      const isMobile = parsed.isMobile || (viewportMobile && hasTouch)
      const isTablet = parsed.isTablet || (width >= 768 && width <= 1024 && hasTouch)
      const isDesktop = !isMobile && !isTablet

      setInfo({
        isMobile,
        isTablet,
        isDesktop,
        hasTouch,
        os: parsed.os,
        browser: parsed.browser,
      })
    }
    update()
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return info
}
