import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible")
  })

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("px-4", "px-6")).toBe("px-6")
  })

  it("handles clsx array syntax", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c")
  })

  it("returns empty string for no inputs", () => {
    expect(cn()).toBe("")
  })

  it("filters falsy values", () => {
    expect(cn("a", undefined, null, false, "b")).toBe("a b")
  })
})
