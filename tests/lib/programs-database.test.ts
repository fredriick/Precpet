import { describe, it, expect } from "vitest"
import {
  trainingPrograms,
  getProgramById,
  getProgramsByDifficulty,
  getProgramsByCategory,
  getProgramsBySport,
  getProgramsBySports,
} from "@/lib/programs-database"
import { allSkills } from "@/lib/skills-database"

describe("programs-database", () => {
  it("has 6 soccer, 4 basketball, 3 tennis = 13 total programs", () => {
    expect(getProgramsBySport("soccer")).toHaveLength(6)
    expect(getProgramsBySport("basketball")).toHaveLength(4)
    expect(getProgramsBySport("tennis")).toHaveLength(3)
    expect(trainingPrograms).toHaveLength(13)
  })

  it("has unique program ids", () => {
    const ids = trainingPrograms.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("each program has required fields and valid steps", () => {
    for (const p of trainingPrograms) {
      expect(p.id).toBeTruthy()
      expect(p.name).toBeTruthy()
      expect(p.description).toBeTruthy()
      expect(p.sport).toMatch(/^(soccer|basketball|tennis)$/)
      expect(p.difficulty).toMatch(/^(beginner|intermediate|advanced)$/)
      expect(p.estimatedMinutes).toBeGreaterThan(0)
      expect(p.steps.length).toBeGreaterThan(0)
      for (const step of p.steps) {
        expect(step.duration).toBeGreaterThan(0)
        expect(step.reps).toBeGreaterThan(0)
        expect(step.instruction).toBeTruthy()
      }
    }
  })

  it("every step references an existing skill in the same sport", () => {
    for (const p of trainingPrograms) {
      for (const step of p.steps) {
        const skill = allSkills.find((s) => s.id === step.skillId)
        expect(skill, `unknown skillId "${step.skillId}" in ${p.id}`).toBeDefined()
        expect(step.sport).toBe(p.sport)
        expect(skill?.sport).toBe(p.sport)
      }
    }
  })

  it("each sport has at least one beginner program", () => {
    for (const sport of ["soccer", "basketball", "tennis"] as const) {
      const beginners = getProgramsBySport(sport).filter((p) => p.difficulty === "beginner")
      expect(beginners.length).toBeGreaterThan(0)
    }
  })

  describe("getProgramById", () => {
    it("returns programs across sports", () => {
      expect(getProgramById("beginner-fundamentals")?.sport).toBe("soccer")
      expect(getProgramById("bb-all-around")?.sport).toBe("basketball")
      expect(getProgramById("tn-baseline")?.sport).toBe("tennis")
    })

    it("returns undefined for unknown id", () => {
      expect(getProgramById("nonexistent")).toBeUndefined()
    })
  })

  describe("filters", () => {
    it("getProgramsByDifficulty filters correctly", () => {
      const advanced = getProgramsByDifficulty("advanced")
      expect(advanced.length).toBeGreaterThanOrEqual(2)
      expect(advanced.every((p) => p.difficulty === "advanced")).toBe(true)
    })

    it("getProgramsByCategory filters correctly", () => {
      const full = getProgramsByCategory("full")
      expect(full.length).toBeGreaterThanOrEqual(4)
      expect(full.every((p) => p.category === "full")).toBe(true)
    })

    it("getProgramsBySports unions across sports", () => {
      const result = getProgramsBySports(["basketball", "tennis"])
      expect(result).toHaveLength(7)
      expect(result.every((p) => p.sport !== "soccer")).toBe(true)
    })

    it("getProgramsBySports returns empty for empty input", () => {
      expect(getProgramsBySports([])).toEqual([])
    })
  })
})
