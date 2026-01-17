"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { exportUserData, importUserData, clearAllData } from "@/lib/storage"
import { cn } from "@/lib/utils"

export default function ExportPage() {
    const router = useRouter()
    const [importData, setImportData] = useState("")
    const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

    const handleExport = () => {
        const data = exportUserData()
        // In a real app we might create a file download
        // For now, copy to clipboard
        navigator.clipboard.writeText(data).then(() => {
            setStatus({ type: "success", message: "Data copied to clipboard! Save it somewhere safe." })
        }).catch(() => {
            setStatus({ type: "error", message: "Failed to copy to clipboard." })
        })
    }

    const handleImport = () => {
        try {
            if (!importData) {
                setStatus({ type: "error", message: "Please paste your data first." })
                return
            }

            const success = importUserData(importData)
            if (success) {
                setStatus({ type: "success", message: "Data imported successfully! Reloading..." })
                setTimeout(() => {
                    window.location.href = "/"
                }, 1500)
            } else {
                setStatus({ type: "error", message: "Invalid data format." })
            }
        } catch (e) {
            setStatus({ type: "error", message: "Error importing data." })
        }
    }

    const handleClear = () => {
        if (confirm("Are you sure? This will delete ALL your progress, badges, and settings. This cannot be undone.")) {
            clearAllData()
            window.location.href = "/"
        }
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="sticky top-0 z-40 glass border-b border-border/50">
                <div className="px-4 py-4 max-w-lg md:max-w-5xl mx-auto flex items-center gap-3">
                    <button onClick={() => router.back()} className="p-2 -ml-2 hover:bg-secondary rounded-full">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold">Data Management</h1>
                </div>
            </header>

            <main className="px-4 py-8 max-w-lg md:max-w-5xl mx-auto space-y-8">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Export Data</h2>
                    <p className="text-sm text-muted-foreground">
                        Save your progress by exporting your data. We'll copy a JSON code to your clipboard which you can save as a text file.
                    </p>
                    <Button onClick={handleExport} className="w-full">
                        Copy Data to Clipboard 📋
                    </Button>
                </div>

                <div className="h-px bg-border/50" />

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">Import Data</h2>
                    <p className="text-sm text-muted-foreground">
                        Paste your previously exported data here to restore your progress.
                    </p>
                    <textarea
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        placeholder="Paste your JSON data here..."
                        className="w-full h-32 p-3 rounded-xl bg-card border border-border text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button onClick={handleImport} variant="outline" className="w-full">
                        Import Data 📥
                    </Button>
                </div>

                <div className="h-px bg-border/50" />

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
                    <p className="text-sm text-muted-foreground">
                        Delete all your data and start fresh. This action is irreversible.
                    </p>
                    <Button onClick={handleClear} variant="destructive" className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 shadow-none border border-destructive/20">
                        Reset All Data 🗑️
                    </Button>
                </div>

                {status && (
                    <div className={cn(
                        "fixed bottom-24 left-4 right-4 p-4 rounded-xl shadow-lg animate-bounce-in text-center font-medium",
                        status.type === "success" ? "bg-emerald-500 text-white" :
                            status.type === "error" ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                    )}>
                        {status.message}
                    </div>
                )}
            </main>

            <BottomNav />
        </div>
    )
}
