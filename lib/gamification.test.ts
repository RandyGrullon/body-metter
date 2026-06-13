import { describe, expect, it } from "vitest";
import {
  computeStreak,
  computeTotalXp,
  levelFromXp,
} from "@/lib/gamification";
import type { Workout } from "@/types/gym";

function wk(daysAgo: number): Workout {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(10, 0, 0, 0);
  return {
    id: `w${daysAgo}`,
    title: "t",
    status: "completed",
    blockType: "strength",
    startedAt: d,
    endedAt: d,
    notes: null,
    exercises: [],
    cardioSegments: [],
    createdAt: d,
    updatedAt: d,
  };
}

describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak([wk(0), wk(1), wk(2)]).current).toBe(3);
  });
  it("counts streak ending yesterday", () => {
    expect(computeStreak([wk(1), wk(2)]).current).toBe(2);
  });
  it("breaks on a gap", () => {
    expect(computeStreak([wk(0), wk(1), wk(4)]).current).toBe(2);
  });
  it("resets to 0 if last workout is too old", () => {
    expect(computeStreak([wk(5)]).current).toBe(0);
  });
  it("dedupes multiple workouts same day", () => {
    expect(computeStreak([wk(0), wk(0), wk(1)]).current).toBe(2);
  });
  it("tracks best streak", () => {
    expect(computeStreak([wk(0), wk(3), wk(4), wk(5)]).best).toBe(3);
  });
});

describe("levelFromXp", () => {
  it("level 1 at 0 xp", () => {
    expect(levelFromXp(0).level).toBe(1);
  });
  it("levels up at thresholds", () => {
    expect(levelFromXp(400).level).toBe(2);
    expect(levelFromXp(900).level).toBe(3);
  });
});

describe("computeTotalXp", () => {
  it("ignores non-completed workouts", () => {
    const abandoned = { ...wk(0), status: "abandoned" as const };
    expect(computeTotalXp([abandoned])).toBe(0);
  });
  it("awards base xp per completed workout", () => {
    expect(computeTotalXp([wk(0)])).toBe(100);
  });
});
