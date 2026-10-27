# Cloudflare agent tracing értékelése

A kért hivatalos útmutató: https://developers.cloudflare.com/agent-setup/tracing.md

A közvetlen elérést a környezet egress proxyja 403-mal blokkolta. Az útmutatót a Cloudflare saját `cloudflare/cloudflare-docs` tárházának `production` ágán, a `src/content/agent-setup/tracing.md` fájlból olvastuk el.

## Vizsgálati eredmény

A projekt statikus Vite/React alkalmazás, GitHub Pages célplatformmal. Nem tartalmaz Cloudflare Worker belépési pontot, Think/Flue/AI SDK keretrendszert, LLM-hívást vagy saját ügynökciklust. Ezért a Workers agent tracing jelenleg nem alkalmazható. Nem adtunk hozzá nem működő Wrangler-beállítást, AI-függőséget vagy tartalmat gyűjtő telemetriát. A játékmenet helyben marad a böngészőben.

Ha később Workers alapú AI-funkció készül, az útmutató szerint először azonosítani kell a tényleges ügynök-belépési pontot, majd kifejezetten egyeztetni a mintavételi arányt (1, 0.05 vagy más érték) és a payloadrögzítést (csak metaadatok vagy üzenetek és eszközadatok). E döntések nélkül payloadrögzítés nem kapcsolható be. A keretrendszerhez illő instrumentációt és a `observability.traces.enabled` beállítást akkor kell hozzáadni és validálni.

Traces feltöltését, Cloudflare-telepítést és éles trace-lekérdezést nem végeztünk; a tracing nincs „készre konfigurálva” olyan komponensre, amely nem létezik.
