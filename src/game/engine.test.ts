import { describe, it, expect } from "vitest";
import {
  newGame,
  move,
  fight,
  resolve,
  rollChallenge,
  parseSave,
  STORAGE_KEY,
  choiceReason,
  buy,
  drink,
  eat,
} from "./engine";
import type { Game } from "./engine";
import { sections } from "./book";
import { battles } from "./mechanics";
const rolls = (...values: number[]) => {
  let i = 0;
  return () => {
    if (i >= values.length) throw Error("Unexpected extra dice");
    return values[i++];
  };
};
function at(id: string): Game {
  const g = newGame(() => 6);
  g.section = id;
  g.visited.push(id);
  return g;
}
function combat(id = "26"): Game {
  const g = at(id),
    e = battles[id][0];
  g.battle = {
    ...e,
    maxStamina: e.stamina,
    round: 0,
    damage: e.damage ?? 2,
    heroDamage: e.heroDamage ?? 2,
    bonus: e.bonus ?? 0,
  };
  return g;
}
describe("KJK rules", () => {
  it("creates the specified character, gold, food and one selected potion", () => {
    const g = newGame(rolls(1, 2, 3, 4), "luck");
    expect(g.hero).toMatchObject({
      skill: 7,
      stamina: 17,
      luck: 10,
      gold: 10,
      provisions: 10,
      potion: "luck",
    });
    expect(g.section).toBe("start");
  });
  it("imports 557 pages and retains the one missing source reference explicitly", () => {
    expect(Object.keys(sections)).toHaveLength(557);
    const missing = Object.values(sections).flatMap((s) =>
      s.choices
        .filter((c) => !sections[c.target])
        .map((c) => `${s.id}->${c.target}`),
    );
    expect(missing).toEqual(["114->160"]);
  });
  it("imports all 42 fixed combat encounters with their exact statistics", () => {
    let count = 0;
    for (const s of Object.values(sections)) {
      const pairs = [
        ...s.paragraphs
          .join(" ")
          .matchAll(/ÜGYESSÉG:\s*(\d+)\s*ÉLETERŐ:\s*(\d+)/g),
      ];
      if (pairs.length) {
        count++;
        expect(
          battles[s.id]?.map((b) => [b.skill, b.stamina]),
          s.id,
        ).toEqual(pairs.map((p) => [+p[1], +p[2]]));
      }
    }
    expect(count).toBeGreaterThan(35);
  });
  it("adds the opening torch once and permits only authored choices", () => {
    let g = newGame(() => 6);
    for (const id of ["start_2", "start_3", "start_4", "1"]) g = move(g, id);
    expect(g.hero.inventory.some((i) => i.id === "torch")).toBe(true);
    expect(move(g, "390")).toBe(g);
    expect(move(g, "243").section).toBe("243");
  });
  it("locks a round until the player resolves a hit, including potentially fatal ones", () => {
    let g = combat();
    g.hero.stamina = 1;
    g = fight(g, rolls(6, 6, 1, 1));
    expect(g.pending?.kind).toBe("injury");
    expect(g.hero.stamina).toBe(1);
    expect(fight(g)).toBe(g);
    g = resolve(g, true, rolls(1, 1));
    expect(g.hero.stamina).toBe(0);
    expect(g.hero.luck).toBe(11);
  });
  it("can save the player from a one-point injury", () => {
    let g = at("40");
    g.hero.stamina = 1;
    g.pending = { kind: "injury", amount: 1, source: "Gyomirtó" };
    g = resolve(g, true, rolls(1, 1));
    expect(g.hero.stamina).toBe(1);
  });
  it("applies successful and failed luck to actual special enemy damage", () => {
    const g = combat("78");
    g.pending = { kind: "injury", amount: 3, source: "Kísértet" };
    expect(resolve(g, true, rolls(1, 1)).hero.stamina).toBe(22);
    g.hero.luck = 2;
    expect(resolve(g, true, rolls(6, 6)).hero.stamina).toBe(20);
  });
  it("offers luck on a killing blow before resolving the enemy death", () => {
    let g = combat();
    g.battle!.stamina = 2;
    g = fight(g, rolls(1, 1, 6, 6));
    g.hero.luck = 2;
    g = resolve(g, true, rolls(6, 6));
    expect(g.battle!.stamina).toBe(1);
  });
  it("advances sequential enemies only after hit resolution", () => {
    let g = combat();
    g.battle!.stamina = 1;
    g.enemies = [{ ...g.battle!, name: "Második", stamina: 5 }];
    g = fight(g, rolls(1, 1, 6, 6));
    g = resolve(g, false);
    expect(g.battle!.name).toBe("Második");
  });
  it("uses enemy-first dice and preserves ties", () => {
    let g = combat();
    g.hero.skill = 9;
    g = fight(g, rolls(3, 3, 3, 3));
    expect(g.pending).toBeNull();
    expect(g.battle!.stamina).toBe(10);
  });
  it("does not allow unowned objects, missing pages or unaffordable purchases", () => {
    const g = at("263");
    expect(choiceReason(g, sections["263"].choices[0])).toContain("tárgy");
    const b = at("108");
    b.hero.gold = 1;
    expect(buy(b, "lamp")).toBe(b);
    expect(
      choiceReason(
        at("114"),
        sections["114"].choices.find((c) => c.target === "160")!,
      ),
    ).toContain("hiányzik");
  });
  it("buys an item and deducts its price exactly once", () => {
    const g = buy(at("108"), "lamp");
    expect(g.hero.gold).toBe(7);
    expect(buy(g, "lamp")).toBe(g);
  });
  it("requires three distinct rooms to leave the eight doors", () => {
    const g = at("417"),
      c = sections["417"].choices.find((c) => c.target === "435")!;
    expect(choiceReason(g, c)).not.toBeNull();
    g.visited.push("12", "73", "325");
    expect(choiceReason(g, c)).toBeNull();
  });
  it("deducts entry costs and gives automatic damage a luck decision", () => {
    const g = move(at("274"), "196");
    expect(g.hero.gold).toBe(8);
    const damaged = move(at("240"), "317");
    expect(damaged.pending?.amount).toBe(2);
  });
  it("caps healing, consumes provisions, disallows food in combat", () => {
    const g = at("1");
    g.hero.stamina = 23;
    expect(eat(g).hero).toMatchObject({ stamina: 24, provisions: 9 });
    expect(eat(combat())).toEqual(combat());
  });
  it("luck potion increases the maximum once", () => {
    const g = newGame(() => 6, "luck");
    const used = drink(g);
    expect(used.hero).toMatchObject({ luck: 13, maxLuck: 13, potion: null });
    expect(drink(used)).toBe(used);
  });
  it("persists valid states and rejects malformed saves", () => {
    const g = newGame(() => 4);
    expect(parseSave(JSON.stringify(g))).toEqual(g);
    expect(parseSave("{bad")).toBeNull();
    g.hero.stamina = -4;
    expect(parseSave(JSON.stringify(g))).toBeNull();
    expect(STORAGE_KEY).toContain("v2");
  });
  it("handles skill rolls with equality as success", () => {
    let g = move(at("200_3"), "71");
    g.hero.skill = 7;
    g = rollChallenge(g, rolls(3, 3));
    expect(g.section).toBe("443");
    expect(g.pending?.amount).toBe(1);
  });
  it("offers luck for random damage without rerolling on reload", () => {
    const g = move(at("109"), "109_2");
    const rolled = rollChallenge(g, rolls(4));
    expect(rolled.pending?.amount).toBe(4);
    expect(parseSave(JSON.stringify(rolled))?.pending?.amount).toBe(4);
    expect(rollChallenge(rolled)).toBe(rolled);
  });
  it("runs free double luck at the black door", () => {
    let g = move(at("390_3"), "458");
    g = rollChallenge(g, rolls(1, 1));
    expect(g.hero.luck).toBe(12);
    g = rollChallenge(g, rolls(1, 1));
    expect(g.section).toBe("381");
    expect(g.hero.luck).toBe(12);
  });
  it("does not allow reused food samples or unowned cooking supplies", () => {
    const g = at("410_2");
    g.visited.push("457");
    expect(
      choiceReason(
        g,
        sections["410_2"].choices.find((c) => c.target === "457")!,
      ),
    ).toContain("egyszer");
    expect(choiceReason(at("465"), sections["465"].choices[0])).toContain(
      "tárgy",
    );
  });
  it("settles the chosen stake correctly", () => {
    const g = at("124_3");
    g.stake = 5;
    expect(move(g, "39").hero.gold).toBe(25);
    expect(move(g, "54").hero.gold).toBe(5);
  });
  it("makes all six hammers mandatory at the end gate", () => {
    const g = at("181_4"),
      c = sections["181_4"].choices[0];
    expect(choiceReason(g, c)).not.toBeNull();
    for (const id of ["red", "metal", "stone", "bronze", "silver", "gold"])
      g.hero.inventory.push({ id: `${id}-hammer`, name: id });
    expect(move(g, "390").section).toBe("390");
  });
});
