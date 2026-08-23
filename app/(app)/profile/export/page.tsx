"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { BottomNav } from "@/components/bottom-nav"
import { Button } from "@/components/ui/button"
import { exportUserData, importUserData, clearAllData } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { useI18n } from "@/hooks/use-i18n"

export default function ExportPage() {
    const router = useRouter()
    const { t } = useI18n()
    const [importData, setImportData] = useState("")
    const [status, setStatus] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null)

    const handleExport = () => {
        const data = exportUserData()
        // Download as file
        const blob = new Blob([data], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `precept-backup-${new Date().toISOString().split("T")[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
        setStatus({ type: "success", message: t("export.downloaded") })
    }

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
            const text = typeof ev.target?.result === "string" ? ev.target.result : ""
            setImportData(text)
            setStatus({ type: "info", message: t("export.fileLoaded") })
        }
        reader.onerror = () => setStatus({ type: "error", message: t("export.readError") })
        reader.readAsText(file)
    }

    const handleImport = () => {
        try {
            if (!importData) {
                setStatus({ type: "error", message: t("export.pasteFirst") })
                return
            }

            const result = importUserData(importData)
            if (result.success) {
                setStatus({ type: "success", message: t("export.imported") })
                setTimeout(() => {
                    // Full reload intentionally resets all in-memory state after import.
                    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                    window.location.href = "/dashboard"
                }, 1500)
            } else {
                setStatus({ type: "error", message: t("export.invalidFormat") })
            }
        } catch {
            setStatus({ type: "error", message: t("export.importError") })
        }
    }

    const handleClear = () => {
        if (confirm(t("export.confirmClear"))) {
            clearAllData()
            // Full reload intentionally resets all in-memory state after clearing.
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination
            window.location.href = "/dashboard"
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
                    <h1 className="text-xl font-bold">{t("settings.dataManagement")}</h1>
                </div>
            </header>

            <main className="px-4 py-8 max-w-lg md:max-w-5xl mx-auto space-y-8">
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{t("export.exportData")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("export.exportDesc")}
                    </p>
                    <Button onClick={handleExport} className="w-full">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        {t("export.downloadBackup")}
                    </Button>
                </div>

                <div className="h-px bg-border/50" />

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold">{t("export.importData")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("export.importDesc")}
                    </p>
                    <label className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground cursor-pointer hover:bg-secondary/50 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12L12 7.5m0 0L16.5 12M12 7.5v13.5" />
                        </svg>
                        {t("export.chooseBackup")}
                        <input type="file" accept="application/json,.json" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <textarea
                        value={importData}
                        onChange={(e) => setImportData(e.target.value)}
                        placeholder={t("export.pastePlaceholder")}
                        className="w-full h-32 p-3 rounded-xl bg-card border border-border text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <Button onClick={handleImport} variant="outline" className="w-full">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12L12 7.5m0 0L16.5 12M12 7.5v13.5" />
                        </svg>
                        {t("export.importData")}
                    </Button>
                </div>

                <div className="h-px bg-border/50" />

                <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-destructive">{t("export.dangerZone")}</h2>
                    <p className="text-sm text-muted-foreground">
                        {t("export.dangerZoneDesc")}
                    </p>
                    <Button onClick={handleClear} variant="destructive" className="w-full bg-destructive/10 text-destructive hover:bg-destructive/20 shadow-none border border-destructive/20">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                        {t("export.resetAllData")}
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
