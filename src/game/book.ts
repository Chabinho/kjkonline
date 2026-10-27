import pages from "./pages.json" with { type: "json" };
export type Choice = {
  text: string;
  target: string;
  requires?: string;
  absent?: string;
  cost?: number;
};
export type Section = {
  id: string;
  title: string;
  paragraphs: string[];
  choices: Choice[];
  images: string[];
  ending: boolean;
  fatal: boolean;
};
export const sections: Record<string, Section> = pages;
export const ROOM_IDS = ["12", "194", "272", "73", "325", "430", "377", "225"];
const gates: Record<string, [string, string, string]> = {
  "61": ["red-hammer", "50", "A vörös kalapácsot használom"],
  "61_2": ["red-hammer", "50", "A vörös kalapácsot használom"],
  "63": ["light-chest", "248", "Felnyitom a Fényládát"],
  "188_3": ["weedkiller", "40", "Előveszem a gyomirtót"],
  "200_3": ["boat-key", "242", "Kinyitom a Csónakházat"],
  "248": ["cursed-sword", "210", "Az Átkok Kardjával harcolok"],
  "251_2": ["golem-axe", "355", "A Gólemölő kisbaltát használom"],
  "261": ["pantry-key", "10", "Használom az Éléskamra kulcsát"],
  "263": ["wizard-number", "288", "A Varázsló üzenetét adom át"],
  "299": ["earplugs", "454", "Használom a füldugókat"],
  "310": ["insecticide", "60", "Előveszem a Pókirtót"],
  "369_2": ["souls-number", "88", "Kimondom a Lelkek Számát"],
  "409_2": ["poison-paper", "232", "Megvizsgálom a méregjelző papírral"],
  "458": ["talisman", "442", "A kőtalizmán megvéd"],
};
for (const [id, [requires, target, text]] of Object.entries(gates))
  sections[id].choices.unshift({ requires, target, text });
for (const [id, item] of Object.entries({
  "271": "wooden-key",
  "271_2": "lockpick",
  "397_2": "stake",
  "14": "invisibility",
})) {
  sections[id].choices[0].requires = item;
  sections[id].choices[1].absent = item;
}
sections["181_4"].choices.unshift({
  text: "A hat kalapáccsal összetöröm a kapcsolókat",
  target: "390",
  requires: "all-hammers",
});
sections["32_3"].choices[0].requires = "any-hammer";
sections["32_3"].choices[1].absent = "any-hammer";
for (const s of Object.values(sections))
  for (const c of s.choices) {
    const cost: Record<string, number> = {
      "37": 3,
      "93": 5,
      "187": 10,
      "264": 7,
      "404": 4,
      "196": 2,
      "113": 2,
      "253": 2,
    };
    if (cost[c.target]) c.cost = cost[c.target];
    if (s.id === "374" && c.target === "382") c.cost = 2;
  }
sections["27"].choices.push({
  text: "A Varázsló nevét és számát mondom",
  target: "388",
  requires: "wizard-number",
});
sections["23"].choices[0].requires = "mace";
sections["281"].choices[0].requires = "cell-key";
sections["281"].choices[1].absent = "cell-key";
for (const [target, requires] of Object.entries({
  "359": "doubling",
  "469": "spices",
  "392": "pill",
}))
  sections["465"].choices.find((c) => c.target === target)!.requires = requires;
const pictureLabels: Record<string, Record<string, string>> = {
  "303": {
    "451": "Megkóstolom a türkizkék italt",
    "121": "Megkóstolom a sárga italt",
    "284": "Megkóstolom a piros italt",
    "376": "Megkóstolom a fekete italt",
    "343": "Megkóstolom a zöld italt",
    "403": "Megkóstolom a színtelen italt",
  },
  "410_2": {
    "366": "Lókolbászt kóstolok",
    "65": "Banántortát kóstolok",
    "345": "Étcsokoládét kóstolok",
    "457": "Gyümölcsöt kóstolok",
    "424": "Péksüteményt kóstolok",
    "30": "Vörösbort kóstolok",
  },
  "417": { "377": "Az iránytűvel jelölt ajtó", "225": "A halálfejes ajtó" },
};
for (const [id, labels] of Object.entries(pictureLabels))
  for (const c of sections[id].choices)
    if (labels[c.target]) c.text = labels[c.target];
