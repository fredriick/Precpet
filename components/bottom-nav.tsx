"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"
import { useI18n } from "@/hooks/use-i18n"
import { translate, type TranslationKey } from "@/lib/i18n"

function buildNavItems(): { href: string; labelKey: TranslationKey; icon: React.ReactNode }[] {
  return [
    {
      href: "/dashboard",
      labelKey: "nav.home",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      href: "/practice",
      labelKey: "nav.practice",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      href: "/progress",
      labelKey: "nav.progress",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      href: "/challenges",
      labelKey: "nav.challenges",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M6 9.75V5.25A2.25 2.25 0 018.25 3h7.5A2.25 2.25 0 0118 5.25v4.5m0-4.5l2.25 2.25m-4.5 0l-2.25-2.25M9.75 21v-4.5m0 4.5a2.25 2.25 0 01-2.25-2.25m2.25 2.25h4.5m-4.5 0a2.25 2.25 0 01-2.25-2.25m9 4.5h1.5m-1.5 0a2.25 2.25 0 01-2.25-2.25m2.25 2.25h3a.75.75 0 00.75-.75v-3a.75.75 0 00-.75-.75h-1.5m-13.5 4.5a2.25 2.25 0 002.25-2.25m-2.25 2.25H3.75A.75.75 0 013 20.25v-3a.75.75 0 01.75-.75h1.5M4.5 15V7.5a.75.75 0 01.75-.75h1.5"
          />
        </svg>
      ),
    },
    {
      href: "/coach",
      labelKey: "nav.coach",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      ),
    },
    {
      href: "/profile",
      labelKey: "nav.profile",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
    },
  ]
}

export function BottomNav() {
  const pathname = usePathname()
  const { settings, updateSettings } = useApp()
  const { t } = useI18n()
  const isDark = settings.theme === "dark"
  const navItems = buildNavItems()

  return (
    <nav aria-label="Main navigation" className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border safe-area-pb z-40">
      <div className="flex items-center h-16 max-w-lg mx-auto safe-area-inset-bottom">
        <div className="flex items-center justify-around flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-14 h-14 rounded-xl transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.icon}
                <span className="text-xs font-medium">{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </div>
        <button
          onClick={() => updateSettings({ theme: isDark ? "light" : "dark" })}
          className="flex items-center justify-center w-10 h-10 mr-1 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          aria-label={translate(settings.language, "nav.themeAria")}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
            </svg>
          )}
        </button>
      </div>
    </nav>
  )
}
