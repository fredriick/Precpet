"use client"

import { useCallback } from "react"
import { useApp } from "@/contexts/app-context"
import { translate, type Locale, type TranslationKey } from "@/lib/i18n"

export function useI18n(): { t: (key: TranslationKey, vars?: Record<string, string | number>) => string; locale: Locale } {
  const { settings } = useApp()
  const locale: Locale = settings.language
  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  )
  return { t, locale }
}
