import { describe, it, expect } from "vitest"
import { soccerSkills, basketballSkills, tennisSkills, allSkills, getSkillById, getSkillsByCategory, getSkillsByDifficulty, getSkillsBySport } from "@/lib/skills-database"

describe("skills-database", () => {
  it("has 15 soccer, 10 basketball, 7 tennis = 32 total skills", () => {
    expect(soccerSkills).toHaveLength(15)
    expect(basketballSkills).toHaveLength(10)
    expect(tennisSkills).toHaveLength(7)
    expect(allSkills).toHaveLength(32)
  })

  it("each skill has required fields", () => {
    for (const skill of allSkills) {
      expect(skill.id).toBeTruthy()
      expect(skill.name).toBeTruthy()
      expect(skill.sport).toMatch(/^(soccer|basketball|tennis)$/)
      expect(skill.category).toMatch(/^(dribbling|passing|shooting|defending|movement|striking)$/)
      expect(skill.difficulty).toMatch(/^(beginner|intermediate|advanced)$/)
      expect(skill.description).toBeTruthy()
      expect(skill.reasoning).toBeTruthy()
      expect(skill.visualScript).toBeTruthy()
      expect(skill.steps.length).toBeGreaterThanOrEqual(3)
    }
  })

  it("each sport has at least one skill in each difficulty", () => {
    const sports = ["soccer", "basketball", "tennis"] as const
    for (const sport of sports) {
      const skills = getSkillsBySport(sport)
      expect(skills.length).toBeGreaterThan(0)
      const diffs = new Set(skills.map((s) => s.difficulty))
      expect(diffs.has("beginner")).toBe(true)
    }
  })

  it("soccer covers all 5 original categories", () => {
    const categories = new Set(soccerSkills.map((s) => s.category))
    expect(categories).toEqual(new Set(["dribbling", "passing", "shooting", "defending", "movement"]))
  })

  it("covers all difficulties", () => {
    const difficulties = new Set(allSkills.map((s) => s.difficulty))
    expect(difficulties).toEqual(new Set(["beginner", "intermediate", "advanced"]))
  })

  describe("getSkillById", () => {
    it("returns the correct skill across sports", () => {
      expect(getSkillById("cruyff-turn")?.name).toBe("The Cruyff Turn")
      expect(getSkillById("b-crossover")?.sport).toBe("basketball")
      expect(getSkillById("t-forehand")?.sport).toBe("tennis")
    })

    it("returns undefined for unknown id", () => {
      expect(getSkillById("nonexistent")).toBeUndefined()
    })
  })

  describe("getSkillsByCategory", () => {
    it("returns skills for a given category across sports", () => {
      const dribbling = getSkillsByCategory("dribbling")
      expect(dribbling.length).toBeGreaterThanOrEqual(5)
      expect(dribbling.every((s) => s.category === "dribbling")).toBe(true)
    })

    it("includes the striking category", () => {
      expect(getSkillsByCategory("striking").length).toBeGreaterThanOrEqual(5)
    })
  })

  describe("getSkillsByDifficulty", () => {
    it("returns skills for a given difficulty", () => {
      const beginner = getSkillsByDifficulty("beginner")
      expect(beginner.every((s) => s.difficulty === "beginner")).toBe(true)
    })

    it("has at least 4 skills per difficulty across all sports", () => {
      for (const diff of ["beginner", "intermediate", "advanced"] as const) {
        expect(getSkillsByDifficulty(diff).length).toBeGreaterThanOrEqual(4)
      }
    })
  })

  describe("getSkillsBySport", () => {
    it("returns only skills for the given sport", () => {
      const bb = getSkillsBySport("basketball")
      expect(bb.length).toBe(10)
      expect(bb.every((s) => s.sport === "basketball")).toBe(true)
    })

    it("returns empty for unknown sport", () => {
      expect(getSkillsBySport("football" as never).length).toBe(0)
    })
  })
})
