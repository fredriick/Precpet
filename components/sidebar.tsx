"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { PreceptLogo } from "@/components/precept-logo"
import { cn } from "@/lib/utils"

const navItems = [
    {
        href: "/",
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
        href: "/skills",
        label: "Skills",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-sidebar border-r border-sidebar-border flex-col p-6 z-50">
            <div className="flex items-center gap-3 mb-10 px-2">
                <PreceptLogo className="w-8 h-8" />
                <span className="font-bold text-xl tracking-tight">Precept</span>
            </div>

            <nav className="space-y-2 flex-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                                isActive
                                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-sidebar-primary/20"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            )}
                        >
                            {item.icon}
                            <span>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            <div className="mt-auto px-4 py-4 rounded-2xl bg-sidebar-accent/50 border border-sidebar-border">
                <p className="text-xs text-muted-foreground font-medium mb-1">Weekly Goal</p>
                <div className="w-full bg-secondary rounded-full h-2 mb-2 overflow-hidden">
                    <div className="bg-primary h-full w-[65%]" />
                </div>
                <p className="text-xs text-right text-sidebar-foreground">3/5 days</p>
            </div>
        </aside>
    )
}
