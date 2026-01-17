"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface SkillSearchProps {
    onSearch: (query: string) => void
    placeholder?: string
}

export function SkillSearch({ onSearch, placeholder = "Search skills..." }: SkillSearchProps) {
    const [query, setQuery] = useState("")

    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query)
        }, 300)

        return () => clearTimeout(timer)
    }, [query, onSearch])

    return (
        <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border",
                    "text-sm placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                    "transition-all duration-200",
                )}
            />
            {query && (
                <button
                    onClick={() => setQuery("")}
                    className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    )
}
