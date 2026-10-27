import { z } from "zod";
import { sections, ROOM_IDS } from "./book";
import type { Choice } from "./book";
import {
  battles,
  gains,
  losses,
  items,
  gold,
  removed,
  shop,
} from "./mechanics";
export type Dice = () => number;
export type Potion = "skill" | "stamina" | "luck";
const integer = z.number().int().nonnegative().max(1000000);
const itemSchema = z.object({
  id: z.string().max(60),
  name: z.string().max(100),
});
const battleSchema = z.object({
  name: z.string().max(100),
  skill: integer,
  stamina: integer,
  maxStamina: integer,
  round: integer,
  damage: integer,
  heroDamage: integer,
  bonus: z.number().int(),
});
const pendingSchema = z.object({
  kind: z.enum(["injury", "strike"]),
  amount: integer,
  source: z.string().max(100),
});
const challengeSchema = z.object({
  kind: z.enum([
    "luck",
    "skill",
    "face",
    "damage",
    "food",
    "scythes",
    "trial",
    "goblin",
    "balls",
    "xurius",
    "double-luck",
    "retry",
  ]),
  round: integer,
  total: integer,
  successes: integer,
  heroTotal: integer,
  enemyTotal: integer,
  done: z.boolean(),
});
const gameSchema = z.object({
  version: z.literal(2),
  hero: z.object({
    skill: integer,
    stamina: integer,
    luck: integer,
    maxSkill: integer,
    maxStamina: integer,
    maxLuck: integer,
    provisions: integer,
    gold: integer,
    potion: z.enum(["skill", "stamina", "luck"]).nullable(),
    inventory: z.array(itemSchema).max(100),
  }),
  section: z.string(),
  visited: z.array(z.string()).max(600),
  battle: battleSchema.nullable(),
  enemies: z.array(battleSchema).max(5),
  pending: pendingSchema.nullable(),
  injuries: z.array(pendingSchema).max(10),
  challenge: challengeSchema.nullable(),
  log: z.array(z.string().max(400)).max(100),
  lastRoll: z
    .object({
      label: z.string().max(200),
      values: z.array(z.number().int().min(1).max(6)).max(8),
    })
    .nullable(),
  poisoned: z.boolean(),
  stake: integer,
  stakePaid: z.boolean(),
  resume: z.string().nullable(),
});
export type Game = z.infer<typeof gameSchema>;
export function die() {
  const v = new Uint32Array(1);
  do {
    crypto.getRandomValues(v);
  } while (v[0] >= 4294967292);
  return (v[0] % 6) + 1;
}
function dice(roll: Dice, n: number) {
  return Array.from({ length: n }, () => {
    const v = roll();
    if (!Number.isInteger(v) || v < 1 || v > 6)
      throw Error("Érvénytelen kocka");
    return v;
  });
}
function note(g: Game, s: string) {
  g.log = [s, ...g.log].slice(0, 100);
}
function change(g: Game, stat: "skill" | "stamina" | "luck", amount: number) {
  const key = {
    skill: "maxSkill",
    stamina: "maxStamina",
    luck: "maxLuck",
  } as const;
  g.hero[stat] = Math.max(
    0,
    Math.min(g.hero[key[stat]], g.hero[stat] + amount),
  );
}
function add(g: Game, id: string, name: string) {
  if (!has(g, id)) {
    g.hero.inventory.push({ id, name });
    note(g, `Megszerezted: ${name}.`);
  }
}
function remove(g: Game, id: string) {
  g.hero.inventory = g.hero.inventory.filter((i) => i.id !== id);
}
function harm(g: Game, amount: number, source: string) {
  const injury = { kind: "injury" as const, amount, source };
  if (g.pending) g.injuries.push(injury);
  else g.pending = injury;
  note(g, `Sérülés: ${amount} pont (${source}). Dönts a szerencsepróbáról.`);
}
const luckTests: Record<string, [string, string]> = {
  "373": ["273", "24"],
  "212": ["212_2", "5"],
  "94": ["218", "327"],
  "269": ["393", "444"],
  "244": ["58", "186"],
  "43": ["43_2", "43_3"],
  "325": ["325_2", "325_3"],
  "44": ["103", "449"],
  "194": ["249", "9"],
  "466": ["428", "246"],
  "441": ["398", "463"],
  "153": ["434", "371"],
  "369_2": ["276", "314"],
};
const skillTests: Record<string, [string, string]> = {
  "168_2": ["70", "338"],
  "333": ["423", "244"],
  "276": ["363", "413"],
  "71": ["217", "443"],
  "282": ["282_2", "282_3"],
  "287_2": ["44", "110"],
  "120": ["277", "219"],
  "167_2": ["167_3", "167_4"],
  "444": ["214", "379"],
  "240": ["317", "468"],
  "174": ["118", "351"],
  "24": ["24_2", "24_3"],
  "238": ["49", "306"],
  "331": ["157", "422"],
  "271_5": ["312", "285"],
  "430": ["294", "127"],
  "301": ["94", "204"],
};
function challenge(id: string): Game["challenge"] {
  let kind: NonNullable<Game["challenge"]>["kind"] | undefined;
  let total = 1;
  if (luckTests[id]) kind = "luck";
  if (skillTests[id]) kind = "skill";
  if (["5", "306", "319_3", "89_2"].includes(id)) kind = "face";
  if (["109_2", "121"].includes(id)) kind = "damage";
  if (["142", "434"].includes(id)) kind = "food";
  if (["249", "194_2"].includes(id)) {
    kind = "scythes";
    total = 10;
  }
  if (id === "440") {
    kind = "trial";
    total = 3;
  }
  if (id === "20") {
    kind = "goblin";
    total = 6;
  }
  if (id === "344_2") {
    kind = "balls";
    total = 5;
  }
  if (id === "272_2") {
    kind = "xurius";
    total = 10;
  }
  if (id === "458") {
    kind = "double-luck";
    total = 2;
  }
  if (id === "277") kind = "retry";
  return kind
    ? {
        kind,
        total,
        round: 0,
        successes: 0,
        heroTotal: 0,
        enemyTotal: 0,
        done: false,
      }
    : null;
}
function enter(g: Game, id: string): Game {
  const s = sections[id];
  if (!s) return g;
  const fresh = !g.visited.includes(id);
  g.section = id;
  g.battle = null;
  g.enemies = [];
  g.challenge = challenge(id);
  g.stakePaid = false;
  g.stake = id === "124_3" ? 2 : 1;
  if (fresh) {
    g.visited.push(id);
    for (const [key, name] of items[id] ?? []) add(g, key, name);
    g.hero.gold += gold[id] ?? 0;
    const gain = gains[id] ?? [0, 0, 0];
    change(g, "stamina", gain[0]);
    change(g, "skill", gain[1]);
    change(g, "luck", gain[2]);
    if (gain.some(Boolean))
      note(
        g,
        `Állapotváltozás: életerő +${gain[0]}, ügyesség +${gain[1]}, szerencse +${gain[2]}.`,
      );
    if (["159", "229_2"].includes(id)) g.hero.provisions++;
    if (id === "258")
      change(
        g,
        "luck",
        Math.min(
          3,
          g.hero.inventory.filter((i) => i.id.endsWith("-hammer")).length,
        ),
      );
    if (id === "100")
      g.hero.gold += g.visited.includes("187")
        ? 10
        : g.visited.includes("93")
          ? 5
          : 0;
  }
  // Harm repeats on re-entry. One-off finds and rewards are recorded once.
  const loss = losses[id] ?? [0, 0, 0];
  change(g, "skill", -loss[1]);
  change(g, "luck", -loss[2]);
  if (loss[0]) harm(g, loss[0], `${id}. fejezet`);
  for (const key of removed[id] ?? []) remove(g, key);
  if (id === "246") g.poisoned = true;
  if (id === "18") g.poisoned = false;
  if (id === "196") {
    g.hero.stamina = g.hero.maxStamina;
    g.hero.luck = g.hero.maxLuck;
  }
  if (id === "374") g.hero.skill = g.hero.maxSkill;
  if (id === "451") g.hero.luck = g.hero.maxLuck;
  if (id === "272_5") g.hero.gold = 0;
  const enemies =
    id === "309_2"
      ? [
          {
            name: "Hasonmásod",
            skill: g.hero.skill,
            stamina: g.hero.stamina,
            damage: 1,
            heroDamage: 1,
          },
        ]
      : (battles[id] ?? []);
  g.enemies = enemies.map((e) => ({
    ...e,
    maxStamina: e.stamina,
    round: 0,
    damage: e.damage ?? 2,
    heroDamage:
      has(g, "cursed-sword") && ["199", "461", "437", "96", "387"].includes(id)
        ? 4
        : (e.heroDamage ?? 2),
    bonus: e.bonus ?? 0,
  }));
  g.battle = g.enemies.shift() ?? null;
  note(g, `${s.title}`);
  return g;
}
export function newGame(roll: Dice = die, potion: Potion = "stamina"): Game {
  const v = dice(roll, 4),
    skill = v[0] + 6,
    stamina = v[1] + v[2] + 12,
    luck = v[3] + 6;
  return enter(
    {
      version: 2,
      hero: {
        skill,
        stamina,
        luck,
        maxSkill: skill,
        maxStamina: stamina,
        maxLuck: luck,
        provisions: 10,
        gold: 10,
        potion,
        inventory: [
          { id: "sword", name: "Kard" },
          { id: "leather", name: "Bőrvért" },
        ],
      },
      section: "start",
      visited: [],
      battle: null,
      enemies: [],
      pending: null,
      injuries: [],
      challenge: null,
      log: ["A kaland elkezdődött."],
      lastRoll: { label: "Ügyesség · életerő · szerencse", values: v },
      poisoned: false,
      stake: 1,
      stakePaid: false,
      resume: null,
    },
    "start",
  );
}
export function has(g: Game, id: string): boolean {
  if (id === "all-hammers")
    return ["red", "metal", "stone", "bronze", "silver", "gold"].every((v) =>
      has(g, `${v}-hammer`),
    );
  if (id === "any-hammer")
    return g.hero.inventory.some((i) => i.id.endsWith("-hammer"));
  return g.hero.inventory.some((i) => i.id === id);
}
export function alive(g: Game) {
  return g.hero.stamina > 0 && !sections[g.section].fatal;
}
export function canMove(g: Game) {
  return (
    alive(g) &&
    !g.pending &&
    (!g.battle || g.battle.stamina === 0) &&
    (!g.challenge || g.challenge.done)
  );
}
export function choiceReason(g: Game, c: Choice): string | null {
  if (!sections[c.target]) return "Ez a fejezet hiányzik az eredeti csomagból.";
  if (c.requires && !has(g, c.requires))
    return "A szükséges tárgy még nincs nálad.";
  if (c.absent && has(g, c.absent))
    return "A tárgy nálad van; használd a másik lehetőséget.";
  if (c.cost && g.hero.gold < c.cost) return `Ehhez ${c.cost} arany szükséges.`;
  if (
    ["303", "410_2"].includes(g.section) &&
    g.visited.includes(c.target) &&
    !["296", "83"].includes(c.target)
  )
    return "Ezt már megkóstoltad; csak egyszer választható.";
  if (
    g.section === "116" &&
    ((c.target === "267" && !g.visited.includes("159")) ||
      (c.target === "330" && g.visited.includes("159")))
  )
    return "A korábbi kalandjaid alapján a másik válasz érvényes.";
  if (
    g.section === "30" &&
    ((c.target === "18" && !g.visited.includes("466")) ||
      (c.target === "453" && g.visited.includes("466")))
  )
    return "Ezt a korábbi borkóstolásod dönti el.";
  if (["20", "344", "124_3"].includes(c.target) && g.visited.includes(c.target))
    return "Ezt a szerencsejátékot már kipróbáltad.";
  if (
    g.section === "124_2" &&
    c.target === "302" &&
    !["20", "344_2", "124_3"].some((id) => g.visited.includes(id))
  )
    return "Előbb legalább egy játékot végig kell játszanod.";
  if (
    c.target === "435" &&
    ROOM_IDS.filter((id) => g.visited.includes(id)).length < 3
  )
    return "Előbb legalább három különböző ajtót kell felfedezned.";
  if (
    g.section === "272" &&
    ((c.target === "272_2" && g.hero.gold < 1) ||
      (c.target === "319" && g.hero.gold > 0))
  )
    return "Ezt a választ az aranyaid száma dönti el.";
  if (
    ["417", "124_2", "20_2", "344_2"].includes(g.section) &&
    g.visited.includes(c.target) &&
    [
      "12",
      "194",
      "272",
      "73",
      "325",
      "430",
      "377",
      "225",
      "20",
      "344",
      "124",
    ].includes(c.target)
  )
    return "Ezt a lehetőséget már kipróbáltad.";
  if (
    g.section === "124_3" &&
    (g.stake < 2 || g.stake > 5 || g.hero.gold < g.stake)
  )
    return "Válassz kifizethető tétet (2–5 arany).";
  if (g.section === "20_2" && c.target === "145" && g.hero.gold > 0)
    return "Van még aranyad.";
  if (g.section === "344_2" && c.target === "145" && g.hero.gold >= 2)
    return "A dobások döntik el ezt az eredményt.";
  if (
    g.challenge &&
    !g.challenge.done &&
    !c.requires &&
    !(g.section === "277" && c.target === "166")
  )
    return "Előbb dobnod kell a kockákkal.";
  if (g.pending || !alive(g) || (g.battle && g.battle.stamina > 0))
    return "Előbb zárd le a jelenlegi eseményt.";
  return null;
}
export function move(game: Game, target: string): Game {
  const c = sections[game.section].choices.find((c) => c.target === target);
  if (!c || choiceReason(game, c)) return game;
  const g = structuredClone(game);
  if (c.cost) g.hero.gold -= c.cost;
  if (g.section === "124_3") {
    g.hero.gold -= g.stake;
    const wager = g.stake;
    enter(g, target);
    if (target === "39") g.hero.gold += wager * 4;
    return g;
  }
  if (g.section === "355") remove(g, "golem-axe");
  if (g.poisoned && !/tovább/i.test(c.text)) {
    g.resume = target;
    harm(g, 1, "Mérgezés");
    return g;
  }
  return enter(g, target);
}
export function fight(game: Game, roll: Dice = die): Game {
  if (!game.battle || game.battle.stamina <= 0 || !alive(game) || game.pending)
    return game;
  const g = structuredClone(game),
    b = g.battle!,
    v = dice(roll, 4);
  b.round++;
  const enemy = b.skill + v[0] + v[1],
    hero = g.hero.skill + b.bonus + v[2] + v[3];
  g.lastRoll = {
    label: `${b.round}. kör · ellenfél: ${enemy} / te: ${hero}`,
    values: v,
  };
  if (hero === enemy)
    note(g, `${b.round}. kör: kivédtétek egymást (${hero}–${enemy}).`);
  else {
    g.pending = {
      kind: hero > enemy ? "strike" : "injury",
      amount: hero > enemy ? b.heroDamage : b.damage,
      source: b.name,
    };
    note(
      g,
      `${b.round}. kör: ${hero > enemy ? "találtál" : "megsebeztek"} (${hero}–${enemy}).`,
    );
  }
  if (g.section === "387") {
    const acid = dice(roll, 1)[0];
    g.lastRoll.values.push(acid);
    g.lastRoll.label += ` · sav: ${acid}`;
    if (acid === 1 || acid === 6) harm(g, 1, "Királynő savköpése");
  }
  return g;
}
export function resolve(game: Game, testLuck: boolean, roll: Dice = die): Game {
  if (!game.pending || (testLuck && game.hero.luck <= 0)) return game;
  const g = structuredClone(game),
    p = g.pending!;
  let amount = p.amount;
  if (testLuck) {
    const v = dice(roll, 2),
      lucky = v[0] + v[1] <= g.hero.luck;
    change(g, "luck", -1);
    g.lastRoll = {
      label: lucky ? "Sikeres szerencsepróba" : "Sikertelen szerencsepróba",
      values: v,
    };
    amount =
      p.kind === "strike"
        ? Math.max(0, amount + (lucky ? 2 : -1))
        : Math.max(0, amount + (lucky ? -1 : 1));
    note(
      g,
      `${lucky ? "Szerencséd volt" : "Balszerencse"} (${v.join(" + ")}). SZERENCSE −1.`,
    );
  }
  if (p.kind === "injury") {
    change(g, "stamina", -amount);
    note(g, `ÉLETERŐ −${amount} · ${p.source}.`);
  } else if (g.battle) {
    g.battle.stamina = Math.max(0, g.battle.stamina - amount);
    note(g, `${g.battle.name}: ÉLETERŐ −${amount}.`);
  }
  g.pending = g.injuries.shift() ?? null;
  if (g.hero.stamina === 0) {
    g.pending = null;
    g.injuries = [];
    g.resume = null;
    note(g, "Kalandod véget ért.");
    return g;
  }
  if (!g.pending && g.battle?.stamina === 0) {
    note(g, `Legyőzted: ${g.battle.name}.`);
    if (g.enemies.length) g.battle = g.enemies.shift()!;
  }
  if (!g.pending && g.resume) {
    const target = g.resume;
    g.resume = null;
    enter(g, target);
  }
  return g;
}
export function eat(game: Game): Game {
  if (
    !canRest(game) ||
    game.hero.provisions <= 0 ||
    game.hero.stamina >= game.hero.maxStamina
  )
    return game;
  const g = structuredClone(game);
  g.hero.provisions--;
  change(g, "stamina", 4);
  note(g, "Elfogyasztottál egy adag élelmet. ÉLETERŐ +4, a kezdőértékig.");
  return g;
}
export function canRest(g: Game) {
  return (
    alive(g) &&
    !g.pending &&
    !sections[g.section].ending &&
    (!g.battle ||
      g.battle.stamina === 0 ||
      (["199", "461", "437", "96", "387"].includes(g.section) &&
        g.battle.round === 0))
  );
}
export function drink(game: Game): Game {
  if (!canRest(game) || !game.hero.potion) return game;
  const g = structuredClone(game),
    p = g.hero.potion!;
  if (p === "luck") {
    g.hero.maxLuck++;
    g.hero.luck = g.hero.maxLuck;
  }
  if (p === "stamina") g.hero.stamina = g.hero.maxStamina;
  if (p === "skill") g.hero.skill = g.hero.maxSkill;
  g.hero.potion = null;
  note(g, "Megittad a kezdő varázsitalodat.");
  return g;
}
export function buy(game: Game, id: string): Game {
  const item = shop.find((i) => i.id === id);
  if (
    game.section !== "108" ||
    !canMove(game) ||
    !item ||
    has(game, id) ||
    game.hero.gold < item.cost
  )
    return game;
  const g = structuredClone(game);
  g.hero.gold -= item.cost;
  add(g, item.id, item.name);
  return g;
}
export function setStake(game: Game, stake: number): Game {
  if (
    !["124_3", "272_2"].includes(game.section) ||
    game.stakePaid ||
    !Number.isInteger(stake) ||
    stake < 1 ||
    stake > game.hero.gold ||
    (game.section === "124_3" && (stake < 2 || stake > 5))
  )
    return game;
  return { ...game, stake };
}
export function rollChallenge(game: Game, roll: Dice = die): Game {
  if (!game.challenge || game.challenge.done || game.pending || !alive(game))
    return game;
  const g = structuredClone(game),
    c = g.challenge!,
    id = g.section;
  let v: number[] = [];
  let target: string | null = null;
  const luck = (free = false) => {
    const a = dice(roll, 2);
    v.push(...a);
    const success = a[0] + a[1] <= g.hero.luck;
    if (!free) change(g, "luck", -1);
    return success;
  };
  const skill = () => {
    const a = dice(roll, 2);
    v.push(...a);
    return a[0] + a[1] + (id === "71" ? 1 : 0) <= g.hero.skill;
  };
  if (c.kind === "luck") target = luck() ? luckTests[id][0] : luckTests[id][1];
  if (c.kind === "skill")
    target = skill() ? skillTests[id][1] : skillTests[id][0];
  if (c.kind === "face") {
    v = dice(roll, id === "89_2" ? 2 : 1);
    if (id === "5") target = v[0] <= 5 ? "5_2" : "305";
    if (id === "306") target = v[0] <= 4 ? "414" : "169";
    if (id === "319_3") target = v[0] === 5 ? "98" : "319_4";
    if (id === "89_2") target = v[0] + v[1] <= 6 ? "361" : "318";
  }
  if (c.kind === "damage") {
    v = dice(roll, id === "121" ? 2 : 1);
    harm(
      g,
      v.reduce((a, b) => a + b, 0),
      "Kockadobás szerinti sérülés",
    );
  }
  if (c.kind === "food") {
    v = dice(roll, 1);
    g.hero.provisions = Math.max(0, g.hero.provisions - v[0]);
    note(g, `Elázott elemózsia: −${v[0]} adag.`);
  }
  if (c.kind === "scythes") {
    if (id === "194_2" && !luck()) target = "9";
    else if (!skill()) harm(g, 1, "Kasza");
    if (c.round + 1 === 10 && !target) target = "194_3";
  }
  if (c.kind === "trial") {
    if (skill()) c.successes++;
    if (c.round + 1 === 3) target = c.successes >= 2 ? "309" : "35";
  }
  if (c.kind === "double-luck") {
    if (!luck(true)) target = "408";
    else if (c.round + 1 === 2) target = "381";
  }
  if (c.kind === "retry") {
    if (skill()) target = "219";
    else {
      change(g, "skill", -1);
      note(g, "A kard kicsorbult: ÜGYESSÉG −1.");
      c.round--;
    }
  }
  if (c.kind === "goblin") {
    v = dice(roll, 4);
    const delta = Math.sign(v[0] + v[1] - v[2] - v[3]) * 2;
    g.hero.gold = Math.max(0, g.hero.gold + delta);
    note(g, `Kockázás: ${delta >= 0 ? "+" : ""}${delta} arany.`);
    if (!g.hero.gold) target = "145";
  }
  if (c.kind === "balls") {
    v = dice(roll, 1);
    const delta = v[0] % 2 === 0 ? 2 : -2;
    if (g.hero.gold + delta < 0) target = "145";
    g.hero.gold = Math.max(0, g.hero.gold + delta);
    note(g, `Célbadobós: ${delta > 0 ? "+" : ""}${delta} arany.`);
  }
  if (c.kind === "xurius") {
    if (!g.stakePaid) {
      if (g.stake < 1 || g.stake > g.hero.gold) return game;
      g.hero.gold -= g.stake;
      g.stakePaid = true;
    }
    v = dice(roll, 2);
    c.heroTotal += v[0];
    c.enemyTotal += v[1];
    if (c.round + 1 >= 10) {
      if (c.heroTotal < c.enemyTotal) {
        g.hero.gold += g.stake * 2;
        target = "272_3";
      } else if (c.heroTotal > c.enemyTotal) target = "272_4";
      else {
        c.total++;
        note(g, "Döntetlen: egy újabb döntő dobás következik.");
      }
    }
  }
  c.round++;
  c.done = c.round >= c.total;
  g.lastRoll = {
    label: `${c.round}. dobás · ${v.join(" + ")}${c.kind === "xurius" ? ` · összesen: ${c.heroTotal} / ${c.enemyTotal}` : ""}`,
    values: v,
  };
  note(g, g.lastRoll.label);
  if (target) {
    if (g.pending) g.resume = target;
    else enter(g, target);
  }
  return g;
}
export const STORAGE_KEY = "kjkonline.book.v2";
export function parseSave(raw: string | null): Game | null {
  try {
    if (!raw) return null;
    const parsed = gameSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const g = parsed.data,
      h = g.hero;
    if (
      !sections[g.section] ||
      !g.visited.includes(g.section) ||
      !g.visited.every((id) => sections[id]) ||
      h.skill > h.maxSkill ||
      h.stamina > h.maxStamina ||
      h.luck > h.maxLuck ||
      h.maxSkill < 7 ||
      h.maxSkill > 12 ||
      h.maxStamina < 14 ||
      h.maxStamina > 24 ||
      h.maxLuck < 7 ||
      h.maxLuck > 13 ||
      (g.resume && !sections[g.resume])
    )
      return null;
    if (g.battle && g.battle.stamina > g.battle.maxStamina) return null;
    return g;
  } catch {
    return null;
  }
}
