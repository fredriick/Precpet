import { describe, it, expect } from "vitest"
import { SUPPORTED_LOCALES, LOCALE_NAMES, translate, type TranslationKey } from "@/lib/i18n"

describe("translate", () => {
  it("returns the English string for the en locale", () => {
    expect(translate("en", "nav.home")).toBe("Home")
  })

  it("returns the Spanish string for the es locale", () => {
    expect(translate("es", "nav.home")).toBe("Inicio")
  })

  it("interpolates variables", () => {
    expect(translate("en", "nav.daysCount", { count: 3 })).toBe("3 days")
    expect(translate("es", "nav.daysCount", { count: 3 })).toBe("3 días")
  })

  it("localizes the migrated content pages", () => {
    expect(translate("en", "programs.step", { number: 2 })).toBe("Step 2")
    expect(translate("es", "programs.step", { number: 2 })).toBe("Paso 2")
    expect(translate("en", "programs.completeTitle")).toBe("Program Complete!")
    expect(translate("es", "programs.completeTitle")).toBe("¡Programa completado!")
    expect(translate("en", "export.importData")).toBe("Import Data")
    expect(translate("es", "export.importData")).toBe("Importar datos")
    expect(translate("en", "dashboard.you")).toBe("You")
    expect(translate("es", "dashboard.you")).toBe("Tú")
  })
})

describe("dictionary integrity", () => {
  it("has unique locale names", () => {
    const names = Object.values(LOCALE_NAMES)
    expect(new Set(names).size).toBe(names.length)
  })

  it("supports both locales", () => {
    expect(SUPPORTED_LOCALES).toEqual(["en", "es"])
  })
})
