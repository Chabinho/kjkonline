export type Enemy = {
  name: string;
  skill: number;
  stamina: number;
  damage?: number;
  heroDamage?: number;
  bonus?: number;
};
export const battles: Record<string, Enemy[]> = {};
const single: Record<string, [string, number, number]> = {
  "26": ["Óriás Minimó", 9, 10],
  "96": ["Negyedik Királynő", 11, 15],
  "115": ["Massza", 12, 15],
  "123": ["Kínzómester", 8, 11],
  "127": ["Vámpír", 7, 10],
  "134": ["Boltos", 7, 8],
  "154": ["Savmassza", 8, 10],
  "169": ["Vámpír", 8, 8],
  "199": ["Első Királynő", 9, 14],
  "229": ["Ogre", 8, 11],
  "292": ["Pincemester", 7, 9],
  "293": ["Morak", 8, 10],
  "297": ["Gólem", 6, 12],
  "310_2": ["Óriáspók", 9, 10],
  "315": ["Vámpír", 8, 9],
  "326": ["Vénember", 5, 4],
  "355": ["Gólem", 6, 12],
  "371": ["Vízivad", 10, 12],
  "387": ["Ötödik Királynő", 12, 10],
  "399": ["Kínzómester", 8, 11],
  "412": ["Alakváltó", 8, 8],
  "432": ["Kovács", 9, 11],
  "437": ["Harmadik Királynő", 10, 15],
  "461": ["Második Királynő", 10, 12],
  "122_2": ["Aqualény", 6, 10],
};
for (const [k, [name, skill, stamina]] of Object.entries(single))
  battles[k] = [{ name, skill, stamina }];
for (const k of ["235", "252", "290", "383", "406", "411"])
  battles[k] = [{ name: "Boszorkánylány", skill: 10, stamina: 7 }];
for (const [k, [name, stats]] of Object.entries({
  "74": [
    "Kobold szobor",
    [
      [6, 5],
      [7, 6],
      [8, 7],
      [6, 8],
    ],
  ],
  "78": [
    "Kísértet",
    [
      [7, 6],
      [8, 6],
    ],
  ],
  "145": [
    "Goblin",
    [
      [5, 5],
      [6, 6],
      [7, 7],
      [8, 8],
    ],
  ],
  "166": [
    "Ork",
    [
      [6, 8],
      [7, 7],
    ],
  ],
  "172": [
    "Óriás őr",
    [
      [8, 12],
      [8, 12],
    ],
  ],
  "173": [
    "Manó",
    [
      [10, 6],
      [8, 5],
    ],
  ],
  "178": [
    "Kentaur",
    [
      [7, 9],
      [7, 10],
    ],
  ],
  "352": [
    "Kobold",
    [
      [7, 7],
      [7, 7],
    ],
  ],
  "368": [
    "Szakácsnő",
    [
      [6, 7],
      [6, 8],
      [6, 6],
    ],
  ],
} as Record<string, [string, number[][]]>))
  battles[k] = stats.map(([skill, stamina], i) => ({
    name: `${name} ${i + 1}.`,
    skill,
    stamina,
  }));
battles["123"][0].bonus = 1;
for (const b of battles["78"]) b.damage = 3;
battles["154"][0].heroDamage = 1;
battles["297"][0].heroDamage = 1;
battles["355"][0].heroDamage = 3;
battles["122_2"][0].damage = 1;
battles["122_2"][0].heroDamage = 1;
// Values transcribed from the original sections, not inferred at runtime.
export const losses: Record<string, number[]> = {
  "40": [1, 0, 0],
  "61_2": [1, 0, 0],
  "118": [0, 1, 0],
  "149": [6, 1, 0],
  "161": [2, 0, 0],
  "176": [4, 0, 0],
  "217": [2, 0, 0],
  "220": [2, 0, 0],
  "277": [0, 1, 0],
  "308": [2, 0, 2],
  "317": [2, 0, 0],
  "325": [3, 0, 0],
  "325_3": [3, 0, 0],
  "331": [1, 0, 0],
  "338": [2, 0, 0],
  "345": [1, 0, 0],
  "349": [1, 0, 0],
  "376": [2, 3, 0],
  "380": [4, 0, 0],
  "391": [1, 0, 0],
  "403": [0, 2, 0],
  "413": [1, 0, 0],
  "422": [1, 0, 0],
  "443": [1, 0, 0],
  "450": [1, 2, 0],
};
for (const k of ["17", "62", "125", "140", "182"]) losses[k] = [0, 0, 1];
for (const k of ["235", "252", "290", "383", "406", "411"])
  losses[k] = [1, 1, 1];
export const gains: Record<string, number[]> = {
  "13_3": [0, 0, 1],
  "14": [0, 0, 2],
  "18": [5, 0, 2],
  "28": [4, 1, 2],
  "73": [0, 0, 1],
  "74": [2, 0, 0],
  "92": [0, 0, 1],
  "113_2": [1, 0, 1],
  "138": [1, 1, 1],
  "142": [1, 0, 0],
  "163": [3, 0, 0],
  "283_3": [0, 0, 1],
  "284": [6, 0, 0],
  "298": [0, 0, 1],
  "322_2": [0, 0, 1],
  "324": [0, 0, 1],
  "336": [1, 1, 1],
  "364": [0, 0, 1],
  "366": [2, 0, 0],
  "370": [4, 0, 0],
  "372": [0, 0, 1],
  "384": [2, 0, 1],
  "388": [0, 0, 2],
  "403": [2, 0, 0],
  "424": [1, 0, 1],
  "425": [0, 0, 3],
  "428": [3, 0, 0],
  "453": [5, 0, 0],
  "457": [5, 0, 0],
  "469_2": [5, 0, 0],
};
export const items: Record<string, [string, string][]> = {
  "1": [["torch", "Fáklya"]],
  "8": [["red-hammer", "Vörös kalapács · 50"]],
  "22": [
    ["stake", "Fakaró"],
    ["cell-key", "Cellakulcs"],
  ],
  "141": [["cell-key", "Cellakulcs"]],
  "33": [["cursed-sword", "Átkok Kardja · 210"]],
  "37": [["bronze-hammer", "Bronzkalapács · 172"]],
  "134_2": [["bronze-hammer", "Bronzkalapács · 172"]],
  "52": [["talisman", "Kőtalizmán · 442"]],
  "73": [["poison-paper", "Méregjelző papír · 232"]],
  "100": [["invisibility", "Láthatatlanság itala"]],
  "140": [["invisibility", "Láthatatlanság itala"]],
  "264": [["invisibility", "Láthatatlanság itala"]],
  "105": [["souls-number", "Lelkek Száma · 88"]],
  "113_2": [["earplugs", "Füldugók · 454"]],
  "130": [["insecticide", "Pókirtó · 60"]],
  "156": [["golem-axe", "Gólemölő kisbalta · 355"]],
  "159": [["boat-key", "Csónakház kulcsa · 242"]],
  "167": [["map", "Térképdarab"]],
  "215": [["metal-hammer", "Fémkalapács · 30"]],
  "253": [["wizard-number", "Varázsló száma · 388"]],
  "262": [
    ["weedkiller", "Gyomirtó · 40"],
    ["pantry-key", "Éléskamra kulcsa · 10"],
  ],
  "288": [["stone-hammer", "Kőkalapács · 41"]],
  "388_2": [["stone-hammer", "Kőkalapács · 41"]],
  "404": [["stone-hammer", "Kőkalapács · 41"]],
  "322_2": [["silver-hammer", "Ezüstkalapács · 79"]],
  "325_2": [["wooden-key", "Fakulcs"]],
  "325_3": [["wooden-key", "Fakulcs"]],
  "378": [["tiny-key", "Apró kulcs"]],
  "425": [["gold-hammer", "Aranykalapács · 18"]],
  "431": [["light-chest", "Fényláda · 248"]],
  "459": [["quilli", "Quilli Víz"]],
  "462": [["sleep-gas", "Altatógáz"]],
};
export const gold: Record<string, number> = {
  "100": 8,
  "140": 8,
  "156": 5,
  "159": 2,
  "262": 5,
  "431": 5,
};
export const removed: Record<string, string[]> = {
  "15": ["metal-hammer"],
  "198": ["invisibility"],
  "271_3": ["wooden-key"],
  "285": ["lockpick"],
  "312": ["lockpick"],
  "442": ["talisman"],
  "169": ["stake"],
  "414": ["stake"],
};
export const shop = [
  { id: "lamp", name: "Lámpás", cost: 3 },
  { id: "lockpick", name: "Álkulcs", cost: 2 },
  { id: "wooden-key", name: "Fakulcs", cost: 3 },
  { id: "doubling", name: "Duplázóital", cost: 4 },
  { id: "spear", name: "Lándzsa", cost: 4 },
  { id: "spices", name: "Fűszerek", cost: 4 },
  { id: "pill", name: "Varázspirula", cost: 1 },
];
items["295"] = [["mace", "Szöges buzogány"]];
items["93"] = [["fake-helmet", "Harci sisak (bóvli)"]];
items["187"] = [["fake-sword", "Pallos (bóvli)"]];
removed["359"] = ["doubling"];
removed["469"] = ["spices"];
removed["392"] = ["pill"];
