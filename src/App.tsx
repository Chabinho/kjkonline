import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Clover,
  Compass,
  Crown,
  Dices,
  Feather,
  Heart,
  Menu,
  RotateCcw,
  ScrollText,
  Shield,
  Sparkles,
  Sword,
  Volume2,
  VolumeX,
  Wheat,
  X,
  Backpack,
  CheckCheck,
} from "lucide-react";
import {
  alive,
  canRest,
  choiceReason,
  eat,
  fight,
  move,
  newGame,
  parseSave,
  resolve,
  STORAGE_KEY,
  rollChallenge,
  buy,
  drink,
  setStake,
} from "./game/engine";
import type { Game, Potion } from "./game/engine";
import { sections } from "./game/book";
import { shop } from "./game/mechanics";
import originalRules from "./game/original-rules.json";

type Modal = "rules" | "character" | "restart" | null;
function load(): Game | null {
  try {
    return parseSave(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}
function DiceFace({ value }: { value: number }) {
  return (
    <span className="die" aria-label={`${value}`}>
      <span>{["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][value]}</span>
    </span>
  );
}
function Stat({
  icon,
  label,
  value,
  max,
  color,
}: {
  icon: ReactNode;
  label: string;
  value?: number;
  max?: number;
  color: string;
}) {
  return (
    <div className={`stat ${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <span>{label}</span>
        <div className="stat-meter">
          <i
            style={{
              width:
                value !== undefined && max ? `${(value / max) * 100}%` : "68%",
            }}
          />
        </div>
      </div>
      <strong>
        {value ?? "—"}
        <small> / {max ?? "—"}</small>
      </strong>
    </div>
  );
}
function App() {
  const [potion, setPotion] = useState<Potion>("stamina");
  const [game, setGame] = useState<Game | null>(load),
    [modal, setModal] = useState<Modal>(null),
    [tab, setTab] = useState<"book" | "journal">("book"),
    [mobileMenu, setMobileMenu] = useState(false),
    [saveFailed, setSaveFailed] = useState(false),
    [sound, setSound] = useState(false),
    [rolling, setRolling] = useState(false),
    [reducedMotion, setReducedMotion] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const reader = useRef<HTMLElement>(null),
    audioRef = useRef<AudioContext | null>(null),
    rollLock = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    dialog = useRef<HTMLDialogElement>(null);
  const section = sections[game?.section ?? "1"];
  useEffect(() => {
    if (game) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
        setSaveFailed(false);
      } catch {
        setSaveFailed(true);
      }
    }
  }, [game]);
  useEffect(() => {
    if (modal) dialog.current?.showModal();
    else dialog.current?.close();
  }, [modal]);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      void audioRef.current?.close();
    },
    [],
  );
  function chime() {
    if (!sound) return;
    try {
      const a = audioRef.current ?? new AudioContext();
      audioRef.current = a;
      void a.resume();
      const o = a.createOscillator(),
        v = a.createGain();
      o.connect(v);
      v.connect(a.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(440, a.currentTime);
      o.frequency.exponentialRampToValueAtTime(660, a.currentTime + 0.15);
      v.gain.setValueAtTime(0.04, a.currentTime);
      v.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.3);
      o.start();
      o.stop(a.currentTime + 0.3);
    } catch {
      /* Sound is optional. */
    }
  }
  function roll(action: (g: Game | null) => Game) {
    if (rollLock.current) return;
    rollLock.current = true;
    setRolling(true);
    chime();
    timer.current = setTimeout(
      () => {
        setGame(action(game));
        setRolling(false);
        rollLock.current = false;
      },
      reducedMotion ? 0 : 400,
    );
  }
  function scrollToBook() {
    setTimeout(
      () =>
        reader.current?.scrollIntoView({
          behavior: reducedMotion ? "instant" : "smooth",
          block: "start",
        }),
      30,
    );
  }
  function openGame() {
    if (game) {
      setTab("book");
      scrollToBook();
    } else setModal("character");
  }
  const canEat =
    game &&
    canRest(game) &&
    game.hero.provisions > 0 &&
    game.hero.stamina < game.hero.maxStamina &&
    !section.ending;
  return (
    <div className={reducedMotion ? "site still" : "site"}>
      <header className="topbar">
        <a className="brand" href="#" aria-label="KJK Online főoldal">
          <span className="brand-icon">
            <Crown size={23} />
          </span>
          <span>
            KJK<span className="brand-light">ONLINE</span>
            <small>A KALAND BENNED ÉL</small>
          </span>
        </a>
        <nav
          aria-label="Fő navigáció"
          className={mobileMenu ? "nav opened" : "nav"}
        >
          <button
            className={tab === "book" ? "nav-link active" : "nav-link"}
            onClick={() => {
              setTab("book");
              setMobileMenu(false);
              scrollToBook();
            }}
          >
            <BookOpen size={15} /> A kaland
          </button>
          <button
            className="nav-link"
            onClick={() => {
              setModal("rules");
              setMobileMenu(false);
            }}
          >
            Játékszabályok
          </button>
          <button
            className={tab === "journal" ? "nav-link active" : "nav-link"}
            onClick={() => {
              setTab("journal");
              setMobileMenu(false);
              scrollToBook();
            }}
          >
            Kalandnapló {game && <span className="tiny-dot" />}
          </button>
        </nav>
        <div className="header-actions">
          <span className="edition">EGY DOBÁS. EZER LEHETŐSÉG.</span>
          <button
            className="icon-button"
            title={sound ? "Hang kikapcsolása" : "Dobáshang bekapcsolása"}
            aria-label={sound ? "Hang kikapcsolása" : "Dobáshang bekapcsolása"}
            aria-pressed={sound}
            onClick={() => setSound(!sound)}
          >
            {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <button
            className="icon-button mobile-toggle"
            aria-label="Menü"
            aria-expanded={mobileMenu}
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-art" aria-hidden="true" />
          <div className="hero-shade" />
          <div className="mist mist-one" />
          <div className="mist mist-two" />
          <div className="motes" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <i
                key={i}
                style={{
                  left: `${32 + i * 5.4}%`,
                  top: `${20 + ((i * 17) % 60)}%`,
                  animationDelay: `-${i * 1.7}s`,
                }}
              />
            ))}
          </div>
          <div className="hero-content">
            <div className="breadcrumb">
              <Compass size={13} /> A KALANDOK KÖNYVTÁRA{" "}
              <ChevronRight size={12} /> <span>ELSŐ KALAND</span>
            </div>
            <div className="eyebrow">
              <span /> KALAND · JÁTÉK · KOCKÁZAT
            </div>
            <h1>
              Királynők
              <br />
              <em>Útvesztője</em>
            </h1>
            <p>
              Egy elfeledett világ. Számtalan elágazás.
              <br />A következő fejezetet a döntéseid írják.
            </p>
            <div className="hero-buttons">
              <button className="button gold" onClick={openGame}>
                <BookOpen size={18} />
                {game ? "A kaland folytatása" : "Kaland indítása"}
                <ArrowRight size={17} />
              </button>
              <button className="text-button" onClick={() => setModal("rules")}>
                Hogyan játszhatok? <CircleHelp size={15} />
              </button>
            </div>
            <div className="hero-details">
              <span>
                <Clover size={13} /> A sors a kezedben
              </span>
              <span>
                <CheckCheck size={14} /> Automatikus kalandlap
              </span>
            </div>
          </div>
          <div className="art-caption">
            <span>01</span>
            <div>
              AZ ISMERETLEN HÍVÁSA
              <small>Minden kaland egyetlen lépéssel kezdődik.</small>
            </div>
          </div>
        </section>
        <div className="feature-strip">
          <div>
            <Dices size={22} />
            <span>
              Te dobsz.<small>A kockák döntenek.</small>
            </span>
          </div>
          <div>
            <Sword size={22} />
            <span>
              Te választasz.<small>A harcot mi számoljuk.</small>
            </span>
          </div>
          <div>
            <Feather size={22} />
            <span>
              Te kalandozol.<small>A történeted megmarad.</small>
            </span>
          </div>
          <span className="version-tag">
            <span /> JÁTSZHATÓ ELŐZETES
          </span>
        </div>
        <div className="content-layout">
          <section
            className="reader"
            ref={reader}
            id="kaland"
            aria-label="Kalandkönyv"
          >
            <div className="section-heading">
              <div>
                <BookOpen size={18} />
                <h2>{tab === "book" ? "A kaland könyve" : "Kalandnapló"}</h2>
              </div>
              <span>
                {game
                  ? `${game.visited.length} felfedezett fejezet`
                  : "A történeted itt kezdődik"}
              </span>
            </div>
            <div className="demo-notice">
              <Sparkles size={15} />
              <p>
                <strong>Martin Stone D. · Királynők Útvesztője</strong> Az
                eredeti kaland, automatikus kalandlappal. 557 történetoldal.
              </p>
            </div>
            {tab === "journal" ? (
              <article className="story journal">
                <span className="eyebrow">MINDEN DÖNTÉS NYOMOT HAGY</span>
                <h2>Utad krónikája</h2>
                {game ? (
                  <ol>
                    {game.log.map((line, i) => (
                      <li key={`${i}-${line}`}>
                        <span className="journal-dot" />
                        {line}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>
                    A naplód első lapja még üres. Indítsd el a kalandot, és írd
                    meg a történeted!
                  </p>
                )}
                <button className="text-button" onClick={() => setTab("book")}>
                  Vissza a könyvhöz <ArrowRight size={16} />
                </button>
              </article>
            ) : (
              <article className="story" aria-busy={rolling}>
                <div className="chapter-label">
                  <span />
                  {game
                    ? `${game.section.startsWith("start") ? "ELŐHANG" : game.section.replace("_", " / ") + ". FEJEZET"}`
                    : "A KALAND KÜSZÖBÉN"}
                  <span />
                </div>
                <h2>{game ? section.title : "Mersz belépni?"}</h2>
                <div className="ornament">◇</div>
                <div className="prose">
                  {(game
                    ? section.paragraphs
                    : [
                        "Vannak kapuk, amelyek csak a bátrak előtt nyílnak meg. És vannak történetek, amelyek arra várnak, hogy te légy a hősük.",
                        "Készítsd elő a kockáidat, bízz az ösztöneidben, és lépj az ismeretlenbe. Mi vezetjük a kalandlapodat — neked csak a döntésekre kell figyelned.",
                      ]
                  ).map((p, i) => (
                    <p className={i === 0 ? "first-paragraph" : ""} key={p}>
                      {p}
                    </p>
                  ))}
                </div>
                {game &&
                  section.images.map((src) => (
                    <img
                      className="original-illustration"
                      key={src}
                      src={`${import.meta.env.BASE_URL}book/${src}`}
                      alt="A könyv eredeti illusztrációja"
                    />
                  ))}
                {!game ? (
                  <div className="begin-callout">
                    <span className="outlined-icon">
                      <Dices size={23} />
                    </span>
                    <div>
                      <h3>Először is: ki vagy te, kalandor?</h3>
                      <p>Egy dobással életre kel a karaktered.</p>
                    </div>
                    <button
                      className="button muted"
                      onClick={() => setModal("character")}
                    >
                      Karakter létrehozása <ArrowRight size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    {game.challenge && !game.challenge.done && (
                      <div className="challenge-panel">
                        <div className="eyebrow">
                          <Dices size={17} /> A KOCKÁK DÖNTENEK
                        </div>
                        <p>
                          {game.challenge.total > 1
                            ? `${game.challenge.round} / ${game.challenge.total} dobás teljesítve`
                            : "A dobás eredménye alapján automatikusan tovább lapozunk."}
                        </p>
                        <button
                          className="button gold full"
                          disabled={
                            rolling || Boolean(game.pending) || !alive(game)
                          }
                          onClick={() => roll((g) => rollChallenge(g!))}
                        >
                          <Dices size={18} />
                          {rolling ? "Peregnek a kockák…" : "Dobok a kockákkal"}
                        </button>
                      </div>
                    )}
                    {["124_3", "272_2"].includes(game.section) && (
                      <div className="stake-panel">
                        <label htmlFor="stake">Tét: {game.stake} arany</label>
                        <input
                          id="stake"
                          type="range"
                          min={game.section === "124_3" ? 2 : 1}
                          max={
                            game.section === "124_3"
                              ? Math.min(5, game.hero.gold)
                              : Math.max(1, game.hero.gold)
                          }
                          value={game.stake}
                          disabled={
                            game.stakePaid || rolling || Boolean(game.pending)
                          }
                          onChange={(e) =>
                            setGame((g) => setStake(g!, Number(e.target.value)))
                          }
                        />
                      </div>
                    )}
                    {game.section === "108" && (
                      <div className="shop">
                        <h3>A boltos portékái</h3>
                        {shop.map((item) => (
                          <button
                            className="choice"
                            key={item.id}
                            disabled={
                              game.hero.gold < item.cost ||
                              game.hero.inventory.some(
                                (i) => i.id === item.id,
                              ) ||
                              rolling
                            }
                            onClick={() => setGame((g) => buy(g!, item.id))}
                          >
                            <span>{item.name}</span>
                            <span>{item.cost} arany</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {game.battle && (
                      <div className="battle">
                        <div className="battle-head">
                          <div className="outlined-icon">
                            <Sword size={22} />
                          </div>
                          <div>
                            <small>ELLENFELED</small>
                            <h3>{game.battle.name}</h3>
                          </div>
                          <span className="battle-round">
                            {game.battle.round}. kör
                          </span>
                        </div>
                        <div className="enemy-stats">
                          <span>
                            <Sword size={14} /> Ügyesség{" "}
                            <b>{game.battle.skill}</b>
                          </span>
                          <span>
                            <Heart size={14} /> Életerő{" "}
                            <b>
                              {game.battle.stamina} / {game.battle.maxStamina}
                            </b>
                          </span>
                        </div>
                        {game.battle.stamina === 0 ? (
                          <p className="success">
                            <Check size={16} /> Győztél! Az út szabad előtted.
                          </p>
                        ) : (
                          <button
                            className="button gold full"
                            disabled={
                              Boolean(game.pending) ||
                              rolling ||
                              game.hero.stamina === 0
                            }
                            onClick={() => roll((g) => fight(g!))}
                          >
                            <Dices size={18} />{" "}
                            {rolling
                              ? "Peregnek a kockák…"
                              : "Következő harci kör"}
                          </button>
                        )}
                      </div>
                    )}
                    {game.pending && (
                      <div
                        className="luck-panel"
                        role="region"
                        aria-label="Szerencsepróba"
                      >
                        <Clover size={24} />
                        <div>
                          <h3>
                            {game.pending.kind === "injury"
                              ? "Megsebeztek. Kísérted a szerencséd?"
                              : "Találtál! Kísérted a szerencséd?"}
                          </h3>
                          <p>
                            {game.pending.kind === "injury"
                              ? `A sérülés ${game.pending.amount} pont. Sikerrel 1 ponttal kevesebb, balszerencsével 1 ponttal több életerőt veszítesz.`
                              : `Az ellenfél ${game.pending.amount} pontot veszít. Sikerrel további 2, balszerencsével 1 ponttal kevesebbet sebzel.`}{" "}
                            A próba 1 SZERENCSE pontba kerül.
                          </p>
                          <div className="luck-actions">
                            <button
                              className="button gold"
                              disabled={rolling || game.hero.luck === 0}
                              onClick={() => roll((g) => resolve(g!, true))}
                            >
                              <Dices size={16} /> Szerencsepróba
                            </button>
                            <button
                              className="text-button"
                              disabled={rolling}
                              onClick={() => setGame((g) => resolve(g!, false))}
                            >
                              Elfogadom a {game.pending.amount} sebzést
                            </button>
                          </div>
                          {game.hero.luck === 0 && (
                            <p>
                              A szerencséd elfogyott; fogadd el az alap sebzést.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {game.log[0] && (
                      <p className="event-note" aria-live="polite">
                        {game.log.find(
                          (l) => !l.includes("fejezet") && !l.includes("Yuron"),
                        )}
                      </p>
                    )}
                    {game.lastRoll && (
                      <div
                        className={
                          rolling ? "roll-result rolling" : "roll-result"
                        }
                        aria-live="polite"
                      >
                        <div className="dice-row">
                          {game.lastRoll.values.map((v, i) => (
                            <DiceFace value={v} key={i} />
                          ))}
                        </div>
                        <span>
                          {rolling ? "Peregnek a kockák…" : game.lastRoll.label}
                        </span>
                      </div>
                    )}
                    {!alive(game) ? (
                      <div className="ending">
                        <h3>Kalandod itt véget ért.</h3>
                        <p>A következő úton másképp fordulhat a szerencse.</p>
                        <button
                          className="button gold"
                          onClick={() => setModal("restart")}
                        >
                          <RotateCcw size={16} /> Új kaland
                        </button>
                      </div>
                    ) : section.ending ? (
                      <div className="ending">
                        <Crown size={30} />
                        <h3>Legyőzted az Öt Királynőt!</h3>
                        <p>
                          Yuron népe fellélegezhet. A történeted örökre
                          megmarad.
                        </p>
                        <button
                          className="button muted"
                          onClick={() => setModal("restart")}
                        >
                          <RotateCcw size={16} /> Újra az ösvényre
                        </button>
                      </div>
                    ) : (
                      <div className="choices">
                        <span className="eyebrow">MERRE VEZET AZ UTAD?</span>
                        {section.choices.map((c, i) => (
                          <button
                            className="choice"
                            key={c.target}
                            disabled={Boolean(choiceReason(game, c)) || rolling}
                            onClick={() => {
                              setGame((g) => move(g!, c.target));
                              scrollToBook();
                            }}
                          >
                            <span className="choice-number">0{i + 1}</span>
                            <span>
                              {c.text}
                              {choiceReason(game, c) && (
                                <small>{choiceReason(game, c)}</small>
                              )}
                              {c.cost && <small>{c.cost} arany</small>}
                            </span>
                            <ArrowRight size={17} />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="story-bottom">
                  <span>✦</span> A kalandot te alakítod. A többit ránk bízhatod.{" "}
                  <span>✦</span>
                </div>
              </article>
            )}
          </section>
          <aside className="sidebar" aria-label="Kalandlap">
            <div className="character-card">
              <div className="card-heading">
                <div>
                  <ScrollText size={17} />
                  <h2>Kalandlapod</h2>
                </div>
                <span className="tiny-dot" />
              </div>
              <div className="character-profile">
                <div className="avatar">
                  <Shield size={32} />
                  <Sword className="avatar-sword" size={22} />
                </div>
                <h3>{game ? "A vándor" : "Ismeretlen kalandor"}</h3>
                <span>
                  {game
                    ? "UTAD MÁR ELKEZDŐDÖTT"
                    : "A TÖRTÉNETED MÉG ELŐTTED ÁLL"}
                </span>
              </div>
              {game && (
                <div className="gold-count">◇ {game.hero.gold} aranytallér</div>
              )}
              <div className="stats">
                <Stat
                  icon={<Sword size={17} />}
                  label="ÜGYESSÉG"
                  value={game?.hero.skill}
                  max={game?.hero.maxSkill}
                  color="amber"
                />
                <Stat
                  icon={<Heart size={17} />}
                  label="ÉLETERŐ"
                  value={game?.hero.stamina}
                  max={game?.hero.maxStamina}
                  color="red"
                />
                <Stat
                  icon={<Clover size={17} />}
                  label="SZERENCSE"
                  value={game?.hero.luck}
                  max={game?.hero.maxLuck}
                  color="green"
                />
              </div>
              <div className="inventory">
                <h4>
                  <Backpack size={15} /> FELSZERELÉS{" "}
                  <span>{game?.hero.inventory.length ?? 0}</span>
                </h4>
                {game ? (
                  <ul>
                    {game.hero.inventory.map((i) => (
                      <li key={i.id}>
                        <span>◇</span>
                        {i.name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>
                    A tarisznyád még üres.
                    <br />
                    Minden kaland valahol elkezdődik.
                  </p>
                )}
                <button
                  className="food"
                  disabled={!canEat || rolling}
                  onClick={() => setGame((g) => eat(g!))}
                >
                  <Wheat size={17} />
                  <span>
                    Élelem
                    <small>
                      {game
                        ? `${game.hero.provisions} adag · +4 életerő`
                        : "A kaland során feltöltődik"}
                    </small>
                  </span>
                  <span>+</span>
                </button>
                {game?.hero.potion && (
                  <button
                    className="food potion"
                    disabled={!canRest(game) || rolling}
                    onClick={() => setGame((g) => drink(g!))}
                  >
                    <Sparkles size={17} />
                    <span>
                      {
                        {
                          skill: "Ügyesség",
                          stamina: "Erő",
                          luck: "Szerencse",
                        }[game.hero.potion]
                      }{" "}
                      itala<small>Egy adag · megiszom</small>
                    </span>
                  </button>
                )}
              </div>
              <div
                className={saveFailed ? "save-status error" : "save-status"}
                aria-live="polite"
              >
                {saveFailed ? <CircleHelp size={14} /> : <Check size={14} />}{" "}
                {saveFailed
                  ? "A mentés nem elérhető ebben a böngészőben"
                  : game
                    ? "Automatikusan mentve ezen az eszközön"
                    : "A kalandlap automatikusan frissül"}
              </div>
            </div>
            <div className="tip-card">
              <span className="tip-icon">
                <Clover size={22} />
              </span>
              <div>
                <h4>A szerencse forgandó</h4>
                <p>
                  Ha megsebeznek, próbára teheted a szerencsédet. Néha egyetlen
                  dobás mindent megváltoztat.
                </p>
                <button
                  className="text-button"
                  onClick={() => setModal("rules")}
                >
                  Ismerd meg a szabályokat <ArrowRight size={13} />
                </button>
              </div>
            </div>
            <button
              className="motion-toggle"
              aria-pressed={reducedMotion}
              onClick={() => setReducedMotion(!reducedMotion)}
            >
              <Sparkles size={14} /> Háttérmozgás:{" "}
              {reducedMotion ? "kikapcsolva" : "bekapcsolva"}
            </button>
            {game && (
              <button
                className="restart-link"
                onClick={() => setModal("restart")}
              >
                <RotateCcw size={13} /> Új kaland kezdése
              </button>
            )}
          </aside>
        </div>
      </main>
      <footer>
        <a className="footer-brand" href="#">
          <Crown size={18} /> KJK ONLINE
        </a>
        <span>Régi kalandok. Új fejezet.</span>
        <span className="footer-note">KOCKÁKRA BÍZVA, NEKED ÍRVA.</span>
      </footer>
      <dialog
        ref={dialog}
        className="modal"
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            const box = e.currentTarget.getBoundingClientRect();
            if (
              e.clientX < box.left ||
              e.clientX > box.right ||
              e.clientY < box.top ||
              e.clientY > box.bottom
            )
              setModal(null);
          }
        }}
        aria-labelledby="modal-title"
      >
        <button
          className="icon-button close-modal"
          aria-label="Bezárás"
          onClick={() => setModal(null)}
        >
          <X size={20} />
        </button>
        {modal === "rules" ? (
          <>
            <span className="eyebrow">A KALANDOR KÉZIKÖNYVE</span>
            <h2 id="modal-title">Kockák és döntések</h2>
            <p>
              Az eredeti Királynők Útvesztője szabályai szerint játszol. Te
              választod az utat, a dobásokat gombbal indítod; a tárgyakat,
              aranyat és pontváltozásokat mi vezetjük.
            </p>
            <h3>Karakter és felszerelés</h3>
            <p>
              ÜGYESSÉG: 1 kocka + 6. ÉLETERŐ: 2 kocka + 12. SZERENCSE: 1 kocka +
              6. Karddal, bőrvérttel, 10 arannyal, 10 adag élelemmel és egy
              választott varázsitallal indulsz.
            </p>
            <h3>Harc és szerencse</h3>
            <p>
              Körönként mindkét fél 2 kockával dob, hozzáadjuk az ügyességet. A
              magasabb támadóerő talál. Döntetlennél nincs sebzés. A legtöbb
              találat 2 pontot sebez, a különleges ellenfelek saját szabályai
              érvényesek.
            </p>
            <p>
              Szerencsepróbán a két kocka összege legfeljebb az aktuális
              szerencséd lehet. A próba 1 szerencsepontba kerül. Sérülésnél
              sikerrel 1 ponttal kevesebb, balszerencsével 1 ponttal több a
              sebzés. Saját találatnál sikerrel +2, balszerencsével −1 pontot
              sebzel.
            </p>
            <p>
              A kérésed szerinti kiegészítés: a harcon kívüli életerővesztésnél
              is felajánljuk a szerencsepróbát. A történetben előírt azonnali
              halált ez nem változtatja meg.
            </p>
            <h3>Pihenés és mentés</h3>
            <p>
              Egy adag élelem 4 életerőt állít helyre, legfeljebb a kezdeti
              értékig. Harc közben nincs evés vagy ivás; a királynők közötti
              szünetben használhatod a varázsitalt. A mentés ezen a böngészőn és
              eszközön marad meg.
            </p>
            <h3>A feldolgozás megjegyzései</h3>
            <p>
              A hiányzó 160. oldalra nem lehet továbblépni. Ahol a könyv nem
              rendelkezik az ügyességpróba egyenlő eredményéről, az sikeres. A
              Kockázás szövegében 2 és 3 arany is szerepel; az
              eredményelszámolás szerinti 2 aranyat használjuk. Xurius döntetlen
              párbaján döntő kört dobunk.
            </p>
            <details>
              <summary>Az eredeti teljes szabályzat</summary>
              {originalRules.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </details>
          </>
        ) : (
          <>
            <span className="eyebrow">AZ ELSŐ DOBÁS</span>
            <h2 id="modal-title">
              {modal === "restart"
                ? "Új történet kezdődik"
                : "Szülessen meg a hősöd"}
            </h2>
            <p>
              {modal === "restart"
                ? "Az új kaland felülírja a jelenlegi mentésedet. Készen állsz egy másik ösvényre?"
                : "Dobj a kockákkal! Meghatározzák az ügyességedet, életerődet és szerencsédet. A felszerelésedről és a kalandlapodról mi gondoskodunk."}
            </p>
            <fieldset className="potion-picker">
              <legend>Melyik varázsitalt viszed magaddal?</legend>
              {(["stamina", "skill", "luck"] as Potion[]).map((p) => (
                <label key={p}>
                  <input
                    type="radio"
                    name="potion"
                    checked={potion === p}
                    onChange={() => setPotion(p)}
                  />
                  {
                    {
                      stamina: "Erő itala",
                      skill: "Ügyesség itala",
                      luck: "Szerencse itala",
                    }[p]
                  }
                </label>
              ))}
            </fieldset>
            <div className="creation-dice">
              <DiceFace value={6} />
              <DiceFace value={4} />
              <DiceFace value={3} />
            </div>
            <button
              className="button gold full"
              disabled={rolling}
              onClick={() => {
                roll(() => newGame(undefined, potion));
                setModal(null);
                setTab("book");
                scrollToBook();
              }}
            >
              <Dices size={19} />{" "}
              {modal === "restart"
                ? "Újrakezdem és dobok"
                : "Dobok a karakteremért"}{" "}
              <ArrowRight size={17} />
            </button>
          </>
        )}
      </dialog>
    </div>
  );
}
export default App;
