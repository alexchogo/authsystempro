'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { deleteCookie } from '@/lib/cookies'
import { useRequireAuth } from '@/hooks/use-auth'
import { useDevice } from '@/hooks/use-device'
import IdleLogout from '@/components/IdleLogout'
import * as authService from '@/lib/authService'
import UserProfile from '@/components/UserProfile'
import type { LucideIcon } from 'lucide-react'
import { Bell, ChartPie, Home, Lock, LogOut, ShieldCheck, UserRound } from 'lucide-react'

type NavItem = {
  id: string
  label: string
  icon: LucideIcon
}

type ActivityItem = {
  id: string
  label: string
  time: string
  type: 'security' | 'profile' | 'login'
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'security', label: 'Security', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'activity', label: 'Activity', icon: ChartPie }
]

const fallbackActivity: ActivityItem[] = [
  { id: '1', label: 'Signed in from Chrome on Windows', time: 'Today · 09:15 EAT', type: 'login' },
  { id: '2', label: 'Changed password', time: 'Yesterday · 18:42 EAT', type: 'security' },
  { id: '3', label: 'Updated profile phone number', time: 'Yesterday · 12:10 EAT', type: 'profile' },
  { id: '4', label: 'OTP verified for sign-in', time: 'Tue · 21:08 EAT', type: 'security' }
]

export default function DashboardPage() {
  useRequireAuth()
  const router = useRouter()
  const device = useDevice()

  const [activeSection, setActiveSection] = useState<string>('overview')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [twoFaEnabled, setTwoFaEnabled] = useState(true)
  const [loginAlerts, setLoginAlerts] = useState(true)
  const [newsletter, setNewsletter] = useState(false)
  const [productUpdates, setProductUpdates] = useState(true)
  const [securityUpdates, setSecurityUpdates] = useState(true)
  const [activity, setActivity] = useState<ActivityItem[]>(fallbackActivity)

  const isMobile = device.isMobile

  const summary = useMemo(
    () => ([
      { label: 'Sessions', value: '3 active', hint: 'Web · iOS · Desktop' },
      { label: 'Security score', value: '82%', hint: 'MFA on · Alerts on' },
      { label: 'Notifications', value: 'Custom', hint: 'Security + Updates' },
      { label: 'Last login', value: 'Today 09:15', hint: 'Nairobi (EAT)' }
    ]),
    []
  )

  const ids = navItems.map((n) => n.id)

  const handleNavClick = (id: string) => {
    setActiveSection(id)
  }

  const lastScrollAt = useRef(0)
  const touchStartY = useRef<number | null>(null)

  const changeSectionBy = useCallback((delta: number) => {
    const cur = Math.max(0, ids.indexOf(activeSection))
    const next = Math.min(ids.length - 1, Math.max(0, cur + delta))
    const nextId = ids[next]
    if (nextId && nextId !== activeSection) setActiveSection(nextId)
  }, [activeSection, ids])

  const onWheel: React.WheelEventHandler = (e) => {
    const now = Date.now()
    if (now - lastScrollAt.current < 600) return
    if (Math.abs(e.deltaY) < 20) return
    lastScrollAt.current = now
    changeSectionBy(e.deltaY > 0 ? 1 : -1)
  }

  const onTouchStart: React.TouchEventHandler = (e) => {
    touchStartY.current = e.touches[0]?.clientY ?? null
  }

  const onTouchEnd: React.TouchEventHandler = (e) => {
    const start = touchStartY.current
    touchStartY.current = null
    if (start == null) return
    const end = e.changedTouches[0]?.clientY ?? start
    const diff = start - end
    if (Math.abs(diff) < 30) return
    changeSectionBy(diff > 0 ? 1 : -1)
  }

  // Persist preferences locally
  useEffect(() => {
    const stored = window.localStorage.getItem('dash-preferences')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setTwoFaEnabled(parsed.twoFaEnabled ?? true)
        setLoginAlerts(parsed.loginAlerts ?? true)
        setNewsletter(parsed.newsletter ?? false)
        setProductUpdates(parsed.productUpdates ?? true)
        setSecurityUpdates(parsed.securityUpdates ?? true)
      } catch {
        /* ignore corrupted storage */
      }
    }
  }, [])

  useEffect(() => {
    const state = { twoFaEnabled, loginAlerts, newsletter, productUpdates, securityUpdates }
    window.localStorage.setItem('dash-preferences', JSON.stringify(state))
  }, [twoFaEnabled, loginAlerts, newsletter, productUpdates, securityUpdates])

  // Fetch recent activity from API; fall back to local sample
  useEffect(() => {
    let active = true
    const fmt = new Intl.DateTimeFormat('en-KE', {
      timeZone: 'Africa/Nairobi',
      hour12: false,
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    fetch('/api/activity', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        const mapped: ActivityItem[] = (data.logs || []).map((log: { id: string; action?: string; createdAt: string }) => ({
          id: log.id,
          label: log.action?.toString().replace(/_/g, ' ') || 'Activity',
          time: `${fmt.format(new Date(log.createdAt))} · EAT`,
          type: log.action?.toString().toLowerCase().includes('otp') ? 'security' : 'login'
        }))
        if (active && mapped.length) setActivity(mapped)
      })
      .catch(() => {
        /* keep fallback */
      })

    return () => {
      active = false
    }
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const token = localStorage.getItem('authToken')
      await authService.logout({ token: token || undefined })
      deleteCookie('authToken')
      localStorage.removeItem('authToken')
      toast.success('Logged out successfully')
      router.push('/authpage/signin')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed'
      toast.error(errorMessage)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <IdleLogout timeoutMs={15 * 60 * 1000} />
      <div className="mx-auto flex max-w-6xl flex-col gap-6 p-4 md:flex-row md:p-8">
        {/* Sidebar */}
        <Card className="md:w-64 md:shrink-0 md:sticky md:top-6 h-fit">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Dashboard
              <Badge variant="secondary">EAT</Badge>
            </CardTitle>
            <CardDescription>Navigate your account areas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = activeSection === item.id
              return (
                <Button
                  key={item.id}
                  variant={active ? 'default' : 'ghost'}
                  className="w-full justify-start gap-2"
                  onClick={() => handleNavClick(item.id)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              )
            })}
            <Separator className="my-4" />
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout} disabled={isLoggingOut}>
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Signing out…' : 'Sign out'}
            </Button>
          </CardContent>
        </Card>

        {/* Main content */}
        <div className="flex-1 space-y-8" onWheel={onWheel} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Welcome back</p>
              <h1 className="text-2xl font-semibold">Your account overview</h1>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="hidden md:inline">Runtime</span>
              <Badge>Node</Badge>
              <Separator orientation="vertical" className="h-5" />
              <span>{device.os}</span>
              <Separator orientation="vertical" className="h-5" />
              <span>{isMobile ? 'Mobile' : device.isTablet ? 'Tablet' : 'Desktop'}</span>
            </div>
          </header>

          {activeSection === 'overview' && (
            <section id="overview" className="space-y-4 scroll-m-20">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {summary.map((item) => (
                <Card key={item.label}>
                  <CardHeader className="pb-2">
                    <CardDescription>{item.label}</CardDescription>
                    <CardTitle className="text-xl">{item.value}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.hint}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            </section>
          )}

          {activeSection === 'profile' && (
            <section id="profile" className="space-y-4 scroll-m-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Profile</h2>
                <p className="text-sm text-muted-foreground">Manage your personal info and avatar.</p>
              </div>
              <Badge variant="secondary">Live</Badge>
            </div>
            <Card>
              <CardContent className="pt-6">
                <UserProfile />
              </CardContent>
            </Card>
            </section>
          )}

          {activeSection === 'security' && (
            <section id="security" className="space-y-4 scroll-m-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Security</h2>
                <p className="text-sm text-muted-foreground">Keep your account locked down.</p>
              </div>
              <Badge variant={twoFaEnabled ? 'default' : 'outline'}>{twoFaEnabled ? 'MFA On' : 'MFA Off'}</Badge>
            </div>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-factor authentication</p>
                    <p className="text-sm text-muted-foreground">OTP via email for sign-ins.</p>
                  </div>
                  <Switch checked={twoFaEnabled} onCheckedChange={setTwoFaEnabled} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Login alerts</p>
                    <p className="text-sm text-muted-foreground">Notify when a new device signs in.</p>
                  </div>
                  <Switch checked={loginAlerts} onCheckedChange={setLoginAlerts} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">Security posture</p>
                    <span className="text-sm text-muted-foreground">82%</span>
                  </div>
                  <Progress value={82} className="h-2" />
                  <p className="text-xs text-muted-foreground">Boost by enabling device alerts and rotating password.</p>
                </div>
                <div className="flex justify-end">
                  <Button variant="secondary">Update security</Button>
                </div>
              </CardContent>
            </Card>
            </section>
          )}

          {activeSection === 'notifications' && (
            <section id="notifications" className="space-y-4 scroll-m-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Notifications</h2>
                <p className="text-sm text-muted-foreground">Choose what reaches your inbox.</p>
              </div>
              <Badge variant="outline">Email</Badge>
            </div>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Security updates</p>
                    <p className="text-sm text-muted-foreground">Recommended. Critical account alerts.</p>
                  </div>
                  <Switch checked={securityUpdates} onCheckedChange={setSecurityUpdates} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Product updates</p>
                    <p className="text-sm text-muted-foreground">Release notes and improvements.</p>
                  </div>
                  <Switch checked={productUpdates} onCheckedChange={setProductUpdates} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Newsletter</p>
                    <p className="text-sm text-muted-foreground">Occasional tips and best practices.</p>
                  </div>
                  <Switch checked={newsletter} onCheckedChange={setNewsletter} />
                </div>
                <div className="flex justify-end">
                  <Button variant="default">Save preferences</Button>
                </div>
              </CardContent>
            </Card>
            </section>
          )}

          {activeSection === 'activity' && (
            <section id="activity" className="space-y-4 scroll-m-20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Recent activity</h2>
                <p className="text-sm text-muted-foreground">Latest account events (all timestamps EAT).</p>
              </div>
              <Badge variant="secondary">Live</Badge>
            </div>
            <Card>
              <CardContent className="space-y-4 pt-6">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 border-b pb-4 last:border-none last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.label}</span>
                        <Badge variant={item.type === 'security' ? 'default' : 'outline'} className="capitalize">{item.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </CardContent>
            </Card>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
