# GitHub Pages és kjkonline.hu

## GitHub Pages

A tárház: `Chabinho/kjkonline`. A projektoldal várható címe: `https://chabinho.github.io/kjkonline/`.

1. A tárház **Settings → Pages → Build and deployment → Source** beállítása legyen **GitHub Actions**.
2. A `main` ágra érkező commit elindítja a `.github/workflows/pages.yml` folyamatot. Manuálisan az **Actions → Build, test and publish GitHub Pages → Run workflow** is használható.
3. A sikeres `deploy` után a Pages beállításokban megjelenő tényleges címet ellenőrizd.

A forráskód megléte vagy egy sikeres helyi build önmagában nem jelenti, hogy az oldal publikálva van. Privát tárháznál a GitHub-előfizetésnek támogatnia kell a Pages használatát.

## A teljes mappa feltöltése GitHub Desktopból

A github.io egy statikus weboldal, nem általános feltöltőszolgáltatás. A GitHub webes feltöltésének 25 MiB korlátját az oldal létrehozása nem módosítja.

1. GitHub Desktop → File → Clone repository → `Chabinho/kjkonline`.
2. **Fetch origin**, majd **Pull origin**, ha elérhető, hogy a legfrissebb projektből indulj.
3. A régi könyv kibontott tartalmát új alkönyvtárba másold, például `source-books/kiralynok_utvesztoje/`. A projekt meglévő fájljait ne írd felül.
4. Adj commitüzenetet, kattints **Commit to main**, majd **Push origin**.

A GitHub fájlonkénti Git-korlátja 100 MiB; 50 MiB fölött figyelmeztet. A kibontott könyv fájljai kicsik, így ehhez nem kell egy óriás ZIP-et verziózni. A `source-books` fájljai nem kerülnek automatikusan a kész weboldalba. Könyvimport után külön build szükséges.

## Saját domain Cloudflare DNS-sel

A GitHub Pages marad a webtárhely; a Cloudflare a DNS-t kezeli. Ehhez nem kell Cloudflare Worker vagy AI-ügynök.

1. A `kjkonline.hu` zónát add hozzá a saját Cloudflare-fiókodhoz. A regisztrátornál a Cloudflare által a saját zónádhoz megadott két névszervert állítsd be. A konkrét névszervereket nem lehet előre kitalálni.
2. Őrizd meg a meglévő e-mail-, MX-, SPF-, DKIM- és egyéb rekordokat. Csak az ütköző webes A/AAAA/CNAME rekordokat módosítsd.
3. GitHub profil → Settings → Pages alatt ellenőrizd a domain tulajdonjogát az ott generált TXT-rekorddal.
4. A Cloudflare DNS-ben a gyökérdomainhez (`@`) az alábbi GitHub Pages A-rekordok kellenek: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
5. A `www` CNAME célja `chabinho.github.io` legyen, útvonal nélkül. Az első ellenőrzéshez a rekordok legyenek **DNS only** állapotban.
6. A tárház Settings → Pages → Custom domain mezőjébe `kjkonline.hu` kerüljön. Várd meg a DNS-ellenőrzést és a tanúsítvány kiállítását, majd kapcsold be az **Enforce HTTPS** lehetőséget.
7. Ha később Cloudflare proxyt kapcsolsz be, csak érvényes GitHub-oldali HTTPS-tanúsítvánnyal, **Full (strict)** SSL-módban használd.

A forrásban szándékosan nincs `CNAME` fájl: a még nem ellenőrzött domainre történő átirányítás megszakíthatná a működő github.io címet. A saját domaint csak a fenti DNS-beállítások után aktiváld. A Cloudflare-fiókhoz ebben a munkamenetben nincs csatlakoztatott hozzáférés; zónát és DNS-rekordot nem módosítottunk.

Alternatívaként Cloudflare Pages is kiszolgálhatja a projektet: Git repository `Chabinho/kjkonline`, production branch `main`, build `npm run build`, output `dist`, Node 24. Ebben az esetben a saját domaint a Cloudflare Pages projektjéhez kell kapcsolni, és nem a GitHub Pages A-rekordjait használni.
