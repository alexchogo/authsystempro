import { NextRequest } from 'next/server'

/**
 * Extract IP address from request headers
 */
export function getClientIp(req: Request | NextRequest): string | undefined {
  // Try various headers in order of preference
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip', // Cloudflare
    'x-client-ip',
  ]

  for (const header of headers) {
    const value = req.headers.get(header)
    if (value) {
      // x-forwarded-for can be comma-separated, take the first one
      return value.split(',')[0].trim()
    }
  }

  // Fallback for NextRequest
  if ('ip' in req && typeof req.ip === 'string') {
    return req.ip
  }

  return undefined
}

/**
 * Extract User-Agent from request headers
 */
export function getUserAgent(req: Request | NextRequest): string | undefined {
  return req.headers.get('user-agent') || undefined
}

type DeviceInfo = {
  os: 'iOS' | 'Android' | 'Windows' | 'Mac' | 'Linux' | 'Unknown'
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Opera' | 'Other'
  deviceType: 'mobile' | 'tablet' | 'desktop'
}

export function classifyUserAgent(ua?: string | null): DeviceInfo {
  const lower = (ua || '').toLowerCase()
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

  const deviceType: DeviceInfo['deviceType'] = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'

  return { os, browser, deviceType }
}

/**
 * Get request metadata for logging
 */
export function getRequestMetadata(req: Request | NextRequest) {
  const userAgent = getUserAgent(req)
  const device = classifyUserAgent(userAgent)
  return {
    ipAddress: getClientIp(req),
    userAgent,
    device,
  }
}
