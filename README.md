# KJK Online — Királynők Útvesztője

Mobilbarát, magyar nyelvű fantasy kalandkönyv. React 19, TypeScript, Vite. A játék teljes egészében a böngészőben fut; nincs szerver, regisztráció vagy külső API. A mentés az adott böngésző localStorage tárhelyén marad.

Az eredeti szöveg Martin Stone D. felhasználó által átadott könyvcsomagjából származik. 553 számozott oldal és 4 előhangoldal, eredeti ékezetekkel. A régi HTML JavaScriptje és űrlapjai nem futnak. A feldolgozás forrását és ellenőrzőösszegét a `docs/source-audit.json` tartalmazza.

## Letöltés és indítás Windows alatt

**[A kész játék letöltése ZIP-ben](https://github.com/Chabinho/kjkonline/raw/refs/heads/main/downloads/kjkonline-automatikus-inditas.zip)**

1. Csomagold ki a teljes ZIP-et: jobb klikk → **Az összes kibontása**.
2. A kicsomagolt mappában kattints kétszer az **INDITAS.cmd** fájlra.
3. Várd meg az automatikus előkészítést. A játék megnyílik a böngészőben; az indító ablakot hagyd nyitva játék közben.

Az indító szükség esetén a Node.js-t is letölti a játék saját mappájába. Nem kell parancsokat beírni vagy rendszergazdai jogot adni. Első indításkor internet és 64 bites Windows 10/11 szükséges. A kész ZIP tartalmazza a lefordított oldalt is.

## Fejlesztés

A helyben futtatható ZIP kiadás Windows alatt az `INDITAS.cmd` fájlra kattintva indul. Az indító szükség esetén automatikusan letölti a Node.js 24 hivatalos Windows csomagját, ellenőrzi az SHA-256 összeget, és a projekt `.runtime/` mappájába telepíti. Rendszergazdai jog nem szükséges. A mellékelt `dist/` mappát szolgálja ki és megnyitja a böngészőt; ha a `dist/` hiányzik, az npm-függőségeket és a buildet is elkészíti. 64 bites Windows 10/11 szükséges. Más rendszeren Node.js 24 telepítése után: `node scripts/serve-local.mjs`. A teljes útmutató az `OLVASS-EL.txt` fájlban található.

Node.js 24, npm 11. A meglévő checkoutot használd; a felhőfeladat már elkülönített környezetben fut, külön worktree nem szükséges.

```sh
npm ci
npm run dev
npm test
npm run build
npm run test:e2e
```

A böngészőtesztek helyben `/usr/bin/chromium`-ot használnak. Más telepítésnél a `CHROMIUM_PATH` változóban add meg a Chromium binárist. Az elkészült statikus oldal a `dist/` mappában található. A relatív erőforrásutak miatt GitHub Pages projektkönyvtárból és saját domain gyökeréből is működik.

## Játékmotor

- Kockával generált kezdőértékek, 10 arany, 10 étkezés és választható varázsital.
- Automatikus felszerelés, vásárlás, gyógyulás, sérülés, egymás utáni ellenfelek és fejezeti próbák.
- Harci körönként egy gombnyomás; minden sérülés előtt választható szerencsepróba. A potenciálisan halálos sérülést is csak a döntés után véglegesíti.
- Tárgyhoz és aranyhoz kötött választások, hatkalapácsos kapu, három kötelező ajtó, többkörös kockajátékok, mérgezés és antidótum.
- A lapozgatás eredeti elágazásai megmaradnak; a tárgykódok helyett az érvényes tárgyakhoz műveletgomb jelenik meg.

A könyv teljes végigjátszásának minden útvonala még nincs emberileg ellenőrizve. A forráshibákat és az értelmezett szabályokat a `docs/rules-decisions.md` dokumentálja; a tesztek a kritikus mechanikákat és a teljes rögzített ellenfélállomány számait ellenőrzik.

## Közzététel és domain

Lásd: [GitHub Pages és Cloudflare](docs/deployment.md). A GitHub Actions munkafolyamat tesztel, buildel, majd a `dist` tartalmát publikálja. A GitHub Pages beállításaiban a forrás **GitHub Actions** legyen.

## Könyv újraimportálása

```sh
python -m pip install -r scripts/requirements.txt
python scripts/import_book.py /path/to/kiralynok_utvesztoje.zip
npm test
```

A tartalmi import elkülönül a kézzel felülvizsgált mechanikai tábláktól (`src/game/mechanics.ts`). Másik könyv importálása külön szabályfeldolgozást igényel.
