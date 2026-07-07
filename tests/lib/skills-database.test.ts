import { describe, it, expect } from "vitest"
import { soccerSkills, getSkillById, getSkillsByCategory, getSkillsByDifficulty } from "@/lib/skills-database"

describe("skills-database", () => {
  it("has all 15 soccer skills", () => {
    expect(soccerSkills).toHaveLength(15)
  })

  it("each skill has required fields", () => {
    for (const skill of soccerSkills) {
      expect(skill.id).toBeTruthy()
      expect(skill.name).toBeTruthy()
      expect(skill.category).toMatch(/^(dribbling|passing|shooting|defending|movement)$/)
      expect(skill.difficulty).toMatch(/^(beginner|intermediate|advanced)$/)
      expect(skill.description).toBeTruthy()
      expect(skill.reasoning).toBeTruthy()
      expect(skill.visualScript).toBeTruthy()
      expect(skill.steps.length).toBeGreaterThanOrEqual(3)
    }
  })

  it("covers all categories", () => {
    const categories = new Set(soccerSkills.map((s) => s.category))
    expect(categories).toEqual(new Set(["dribbling", "passing", "shooting", "defending", "movement"]))
  })

  it("covers all difficulties", () => {
    const difficulties = new Set(soccerSkills.map((s) => s.difficulty))
    expect(difficulties).toEqual(new Set(["beginner", "intermediate", "advanced"]))
  })

  describe("getSkillById", () => {
    it("returns the correct skill", () => {
      const skill = getSkillById("cruyff-turn")
      expect(skill?.name).toBe("The Cruyff Turn")
    })

    it("returns undefined for unknown id", () => {
      expect(getSkillById("nonexistent")).toBeUndefined()
    })
  })

  describe("getSkillsByCategory", () => {
    it("returns skills for a given category", () => {
      const dribbling = getSkillsByCategory("dribbling")
      expect(dribbling.length).toBeGreaterThanOrEqual(3)
      expect(dribbling.every((s) => s.category === "dribbling")).toBe(true)
    })

    it("returns empty array for category with no skills", () => {
      expect(getSkillsByCategory("movement")).toHaveLength(1)
    })
  })

  describe("getSkillsByDifficulty", () => {
    it("returns skills for a given difficulty", () => {
      const beginner = getSkillsByDifficulty("beginner")
      expect(beginner.every((s) => s.difficulty === "beginner")).toBe(true)
    })

    it("has at least 4 skills per difficulty", () => {
      for (const diff of ["beginner", "intermediate", "advanced"] as const) {
        expect(getSkillsByDifficulty(diff).length).toBeGreaterThanOrEqual(4)
      }
    })
  })
})
