"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PreceptLogo } from "@/components/precept-logo"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"
import { startOfDay, subDays } from "date-fns"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { ReactNode } from "react"

const SidebarContext = createContext<{ collapsed: boolean; toggle: () => void } | null>(null)

export function useSidebar() {
    const ctx = useContext(SidebarContext)
    if (!ctx) throw new Error("useSidebar must be used within SidebarProvider")
    return ctx
}

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [collapsed, setCollapsed] = useState(false)
    const toggle = useCallback(() => setCollapsed((c) => !c), [])
    return (
        <SidebarContext.Provider value={{ collapsed, toggle }}>
            {children}
        </SidebarContext.Provider>
    )
}

const navItems = [
    {
        href: "/dashboard",
        label: "Home",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
            </svg>
        ),
    },
    {
        href: "/practice",
        label: "Practice",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        href: "/progress",
        label: "Progress",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
            </svg>
        ),
    },
    {
        href: "/profile",
        label: "Profile",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
            </svg>
        ),
    },
    {
        href: "/settings",
        label: "Settings",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
]

export function Sidebar() {
    const pathname = usePathname()
    const { sessions } = useApp()
    const { collapsed, toggle } = useSidebar()

    useEffect(() => {
        document.documentElement.style.setProperty("--sidebar-w", collapsed ? "4rem" : "16rem")
    }, [collapsed])

    const daysThisWeek = (() => {
        const today = startOfDay(new Date())
        const weekAgo = subDays(today, 6)
        const uniqueDays = new Set(
            sessions
                .filter((s) => s.endTime)
                .map((s) => startOfDay(new Date(s.endTime!)).getTime())
                .filter((t) => t >= weekAgo.getTime() && t <= today.getTime()),
        )
        return uniqueDays.size
    })()

    const weeklyGoal = 5
    const goalProgress = Math.min(100, Math.round((daysThisWeek / weeklyGoal) * 100))

    return (
        <aside aria-label="Sidebar navigation" className={cn(
            "hidden md:flex fixed left-0 top-0 bottom-0 bg-sidebar border-r border-sidebar-border flex-col z-50 transition-all duration-200",
            collapsed ? "w-16 items-center p-4" : "w-64 p-6",
        )}>
            <div className={cn("flex items-center gap-3 mb-10", collapsed ? "flex-col px-0" : "px-2")}>
                <PreceptLogo className="w-8 h-8" />
                {!collapsed && <span className="font-bold text-xl tracking-tight">Precept</span>}
                <button
                    onClick={toggle}
                    className={cn(
                        "shrink-0 hover:opacity-80 transition-opacity",
                        collapsed ? "mt-2" : "ml-auto",
                    )}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <svg className="w-5 h-5 text-sidebar-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        {collapsed ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        )}
                    </svg>
                </button>
            </div>

            <nav className={cn("space-y-2", collapsed ? "flex flex-col items-center" : "flex-1")}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-xl transition-all font-medium",
                                collapsed
                                    ? "p-3 justify-center"
                                    : "px-4 py-3",
                                isActive
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            )}
                        >
                            {item.icon}
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            {!collapsed && (
                <div className="mt-auto space-y-3">
                    <div className="px-4 py-4 rounded-2xl bg-sidebar-accent/50 border border-sidebar-border">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Weekly Goal</p>
                        <div className="w-full bg-secondary rounded-full h-2 mb-2 overflow-hidden">
                            <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
                        </div>
                        <p className="text-xs text-right text-sidebar-foreground">{daysThisWeek}/{weeklyGoal} days</p>
                    </div>
                    <ThemeToggle />
                </div>
            )}
        </aside>
    )
}

function ThemeToggle() {
    const { settings, updateSettings } = useApp()
    const isDark = settings.theme === "dark"

    return (
        <button
            onClick={() => updateSettings({ theme: isDark ? "light" : "dark" })}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all font-medium"
        >
            {isDark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
            )}
            <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>
    )
}
