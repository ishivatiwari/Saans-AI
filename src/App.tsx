import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Earth,
  Heart,
  Home,
  Info,
  LayoutDashboard,
  Leaf,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  TrainFront,
  Users,
  X,
} from "lucide-react";
import {
  buildPlan,
  category,
  cities,
  commuteSavings,
  defaultProfile,
  demoAir,
  localReply,
  locationSchema,
  profileSchema,
  sources,
  type AirData,
  type Location,
  type Profile,
} from "../shared/domain";

import { PageContent, type Page } from "./components/PageContent";
import { Modal } from "./components/Primitives";
type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  mode?: string;
};
const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My daily plan", icon: Sun },
  { label: "Healthy home", icon: Home },
  { label: "My impact", icon: Sprout },
  { label: "Community", icon: Users },
] as const;
function readSaved<T>(
  key: string,
  fallback: T,
  validate: (value: unknown) => T,
): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? validate(JSON.parse(raw)) : fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Private browsing may disable storage. */
  }
}
const localDay = () => new Date().toLocaleDateString("en-CA");

function App() {
  const [profile, setProfile] = useState(() =>
    readSaved("saans-profile", defaultProfile, (v) => profileSchema.parse(v)),
  );
  const [location, setLocation] = useState(() =>
    readSaved("saans-location", cities[0], (v) => locationSchema.parse(v)),
  );
  const [page, setPage] = useState<Page>("Overview");
  const [air, setAir] = useState<AirData>(demoAir);
  const [airBusy, setAirBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState<
    "profile" | "location" | "sources" | "notifications" | null
  >(null);
  const [menu, setMenu] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [searchStatus, setSearchStatus] = useState("");
  const [completed, setCompleted] = useState<string[]>(() =>
    readSaved("saans-completed", [], (v) => {
      const d = v as { date: string; ids: string[] };
      return d.date === localDay() && Array.isArray(d.ids)
        ? [
            ...new Set(
              d.ids.filter((x) => ["move", "commute", "home"].includes(x)),
            ),
          ]
        : [];
    }),
  );
  const [pledges, setPledges] = useState<string[]>(() =>
    readSaved("saans-pledges", [], (v) =>
      Array.isArray(v)
        ? [...new Set(v.filter((x) => ["idle", "smoke", "share"].includes(x)))]
        : [],
    ),
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [chatBusy, setChatBusy] = useState(false);
  const [aiMode, setAiMode] = useState("local");
  const [chatOpen, setChatOpen] = useState(false);
  const chatBottom = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);
  const chatRequestId = useRef(0);
  const plan = buildPlan(profile, air.aqi);
  const status = category(air.aqi);
  const savings =
    completed.includes("commute") && profile.commute === "car"
      ? commuteSavings(profile.distance)
      : 0;
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setAiMode(d.assistant))
      .catch(() => {});
  }, []);
  useEffect(() => {
    save("saans-profile", profile);
  }, [profile]);
  useEffect(() => {
    save("saans-location", location);
  }, [location]);
  useEffect(() => {
    save("saans-completed", { date: localDay(), ids: completed });
  }, [completed]);
  useEffect(() => {
    save("saans-pledges", pledges);
  }, [pledges]);
  useEffect(() => {
    chatBottom.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [messages, chatBusy]);
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setSearchStatus("");
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchStatus("Searching cities…");
      try {
        const response = await fetch(
          `/api/locations?q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setResults(data);
        setSearchStatus(
          data.length
            ? ""
            : "No cities found. Try a nearby city or a different spelling.",
        );
      } catch (error) {
        if (!controller.signal.aborted)
          setSearchStatus(
            error instanceof Error ? error.message : "Search unavailable.",
          );
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);
  async function loadAir(next = location) {
    const id = ++requestId.current;
    setAirBusy(true);
    setNotice("");
    try {
      const response = await fetch(
        `/api/air?lat=${next.latitude}&lon=${next.longitude}`,
        { signal: AbortSignal.timeout(15000) },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (id === requestId.current) setAir(data);
    } catch (error) {
      if (id === requestId.current) {
        setAir(demoAir());
        setNotice(
          error instanceof Error
            ? error.message
            : "Unable to load air quality. Showing demo data.",
        );
      }
    } finally {
      if (id === requestId.current) setAirBusy(false);
    }
  }
  function selectLocation(next: Location) {
    chatRequestId.current++;
    setChatBusy(false);
    setLocation(next);
    setModal(null);
    setQuery("");
    setAir(demoAir());
    setMessages([]);
    void loadAir(next);
  }
  function toggleAction(id: string) {
    setCompleted((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }
  async function sendMessage(text = input) {
    if (!text.trim() || chatBusy) return;
    const id = ++chatRequestId.current;
    const content = text.trim();
    setInput("");
    setChatOpen(true);
    setChatBusy(true);
    const history = messages
      .slice(-8)
      .map(({ role, content }) => ({ role, content: content.slice(0, 4000) }));
    setMessages((prev) => [...prev, { role: "user", content }]);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          history,
          profile,
          location,
          aqi: air.aqi,
          mode: air.mode,
        }),
        signal: AbortSignal.timeout(30000),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (id !== chatRequestId.current) return;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: (data.notice ? data.notice + "\n\n" : "") + data.answer,
          mode: data.mode,
        },
      ]);
    } catch (error) {
      if (id !== chatRequestId.current) return;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `${error instanceof Error ? error.message : "Connection unavailable."}\n\n${localReply(content, profile, air.aqi, location)}`,
          mode: "local",
        },
      ]);
    } finally {
      if (id === chatRequestId.current) setChatBusy(false);
    }
  }
  function exportPlan() {
    const text =
      `SAANS · MY DAILY PLAN\n${location.name}, ${location.country}\n${new Date().toLocaleDateString()} · US AQI ${air.aqi} · ${air.mode === "demo" ? "Illustrative demo" : "Model estimate"}\n\n` +
      plan
        .map(
          (a) =>
            `${completed.includes(a.id) ? "[x]" : "[ ]"} ${a.time}: ${a.title}\n${a.description}\nWhy: ${a.impact}`,
        )
        .join("\n\n") +
      "\n\nCO₂ estimates use illustrative factors, not measured savings. Follow local advisories.\nSources:\n" +
      sources.map((s) => s.url).join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "saans-daily-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
  }
  const changePage = (next: Page) => {
    setPage(next);
    setMenu(false);
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <aside className={`sidebar ${menu ? "visible" : ""}`}>
        <a
          href="#"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            changePage("Overview");
          }}
          aria-label="Saans home"
        >
          <span className="brand-mark">
            <Leaf size={25} />
          </span>
          saans<span className="brand-dot">.</span>
        </a>
        <div className="brand-caption">A LITTLE CARE. CLEANER AIR.</div>
        <div className="nav-label">YOUR EVERYDAY COMPANION</div>
        <nav aria-label="Main navigation">
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => changePage(label)}
              className={`nav-item ${page === label ? "active" : ""}`}
              aria-current={page === label ? "page" : undefined}
            >
              <Icon size={19} />
              {label}
              {label === "My daily plan" && (
                <span className="nav-counter">
                  {3 -
                    completed.filter((id) => plan.some((p) => p.id === id))
                      .length}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="small-manifesto">
            <span>
              <Sprout size={23} />
            </span>
            <h3>
              Small steps.
              <br />A shared tomorrow.
            </h3>
            <p>
              Good for your family.
              <br />A little better for the planet.
            </p>
            <div className="leaf-art">
              <Leaf />
              <Leaf />
              <Leaf />
            </div>
          </div>
          <button className="nav-item" onClick={() => setModal("sources")}>
            <CircleHelp size={19} />
            About & resources
            <ArrowUpRight size={15} />
          </button>
          <button
            className="profile-button"
            onClick={() => {
              setDraft(profile);
              setModal("profile");
            }}
          >
            <span className="avatar">
              {profile.name.slice(0, 1).toUpperCase()}
            </span>
            <span>
              <strong>{profile.name}'s household</strong>
              <small>Make it personal</small>
            </span>
            <Settings2 size={16} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMenu(!menu)}
              aria-label="Toggle navigation"
            >
              <Menu size={22} />
            </button>
            <span>Your breathing space</span>
            <ChevronRight size={13} />
            <strong>{page}</strong>
          </div>
          <div className="top-actions">
            <button
              className="location-button"
              onClick={() => setModal("location")}
            >
              <MapPin size={16} />
              <span>
                {location.name}, {location.country.split(", ").at(-1)}
              </span>
              <ChevronDown size={14} />
            </button>
            <span className="top-divider" />
            <button
              className="icon-button notification-button"
              onClick={() => setModal("notifications")}
              aria-label="Air quality notices"
            >
              <Bell size={19} />
              <span />
            </button>
            <button
              className="avatar small"
              onClick={() => {
                setDraft(profile);
                setModal("profile");
              }}
              aria-label="Edit household profile"
            >
              {profile.name[0].toUpperCase()}
            </button>
          </div>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="date-label">
                <span />
                YOUR AIR. YOUR DAY. YOUR WAY.
              </div>
              <h1>
                {page === "Overview"
                  ? `A little care goes a long way, ${profile.name}.`
                  : page === "My daily plan"
                    ? "A better day starts with small choices."
                    : page === "Healthy home"
                      ? "Make home your breathing space."
                      : page === "My impact"
                        ? "Small choices. Meaningful change."
                        : "Cleaner air is a shared effort."}
              </h1>
              <p>
                {page === "Overview"
                  ? "Let’s make today a little healthier for you, your family, and your city."
                  : page === "My daily plan"
                    ? "A practical routine shaped around your household and the air outside."
                    : page === "Healthy home"
                      ? "Simple, thoughtful habits to reduce pollution where you spend the most time."
                      : page === "My impact"
                        ? "See the actions you’ve taken—and the assumptions behind their impact."
                        : "Start with one commitment. Bring your neighbours along."}
              </p>
            </div>
            <button
              className="secondary-button personalize"
              onClick={() => {
                setDraft(profile);
                setModal("profile");
              }}
            >
              <Settings2 size={15} />
              Personalize
            </button>
          </div>
          <div className="content-grid">
            <div className="main-column">
              {notice && (
                <div className="notice" role="status">
                  <Info size={18} />
                  <span>{notice}</span>
                  <button
                    className="icon-button"
                    onClick={() => setNotice("")}
                    aria-label="Dismiss notice"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <PageContent
                {...{
                  page,
                  air,
                  location,
                  profile,
                  airBusy,
                  loadAir,
                  setModal,
                  changePage,
                  plan,
                  completed,
                  toggleAction,
                  exportPlan,
                  sendMessage,
                  savings,
                  pledges,
                  setPledges,
                }}
              />
              <footer className="page-footer">
                <span>
                  <Leaf size={13} />A little care. A cleaner tomorrow.
                </span>
                <button onClick={() => setModal("sources")}>
                  Data & sources <ArrowUpRight size={12} />
                </button>
              </footer>
            </div>
            <aside
              className={`right-column ${chatOpen ? "chat-open" : ""}`}
              aria-label="Your air quality assistant"
            >
              <section className="assistant-card">
                <div className="assistant-header">
                  <span className="assistant-icon">
                    <Sparkles size={21} />
                  </span>
                  <div>
                    <h2>A little guidance, just for you.</h2>
                    <span>
                      <span className="status-dot" />
                      {aiMode === "ai"
                        ? "Gemini-powered companion"
                        : "Your local air-care guide"}
                    </span>
                  </div>
                  <button
                    className="icon-button mobile-chat-close"
                    onClick={() => setChatOpen(false)}
                    aria-label="Close assistant"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="assistant-body">
                  <div className="assistant-intro">
                    <span className="mini-spark">
                      <Sparkles size={16} />
                    </span>
                    <p>
                      Hi {profile.name} <span aria-hidden="true">✳</span>
                      <br />A busy day and a hazy sky? Let’s figure it out
                      together.
                    </p>
                    <p>
                      I can help you make small, practical choices for your
                      household in <strong>{location.name}</strong>.
                    </p>
                    <div className="context-pills">
                      <span>
                        <MapPin size={11} />
                        {location.name}
                      </span>
                      <span>
                        <Users size={11} />
                        {profile.children
                          ? "Family with children"
                          : "Your household"}
                      </span>
                    </div>
                  </div>
                  {messages.length === 0 && (
                    <div className="prompt-list">
                      <span className="eyebrow">A GOOD PLACE TO START</span>
                      {[
                        "Can the kids play outside today?",
                        "How can I keep indoor air cleaner?",
                        "Help me plan a cleaner commute",
                      ].map((text) => (
                        <button
                          key={text}
                          onClick={() => void sendMessage(text)}
                        >
                          {text}
                          <ArrowUpRight size={14} />
                        </button>
                      ))}
                    </div>
                  )}
                  <div
                    className="messages"
                    aria-live="polite"
                    aria-relevant="additions"
                  >
                    {messages.map((message, i) => (
                      <div key={i} className={`message ${message.role}`}>
                        <span>
                          {message.role === "user"
                            ? "YOU"
                            : message.mode === "ai"
                              ? "SAANS · GEMINI"
                              : message.mode === "safety"
                                ? "URGENT GUIDANCE"
                                : "SAANS · LOCAL GUIDE"}
                        </span>
                        <p>{message.content}</p>
                        {message.role === "assistant" &&
                          message.mode !== "safety" && (
                            <button
                              className="text-button"
                              onClick={() => setModal("sources")}
                            >
                              Guidance sources <ArrowUpRight size={11} />
                            </button>
                          )}
                      </div>
                    ))}
                    {chatBusy && (
                      <div className="thinking">
                        <span />
                        <span />
                        <span />
                        Finding a thoughtful next step…
                      </div>
                    )}
                    <div ref={chatBottom} />
                  </div>
                </div>
                <div className="chat-compose">
                  <form
                    onSubmit={(e: FormEvent) => {
                      e.preventDefault();
                      void sendMessage();
                    }}
                  >
                    <input
                      ref={inputRef}
                      aria-label="Ask Saans a question"
                      placeholder="What’s on your mind?"
                      maxLength={2000}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={chatBusy}
                    />
                    <button
                      aria-label="Send message"
                      disabled={chatBusy || !input.trim()}
                    >
                      <Send size={16} />
                    </button>
                  </form>
                  <p>
                    <ShieldCheck size={11} />
                    Everyday guidance, not medical advice.
                  </p>
                </div>
              </section>
              <section className="household-card card">
                <div className="section-row">
                  <h3>Made for your household</h3>
                  <button
                    className="icon-button"
                    onClick={() => {
                      setDraft(profile);
                      setModal("profile");
                    }}
                    aria-label="Edit household"
                  >
                    <Settings2 size={16} />
                  </button>
                </div>
                <div className="household-item">
                  <Users size={17} />
                  <span>
                    {profile.children
                      ? "Family with children"
                      : "Adults-only household"}
                  </span>
                </div>
                <div className="household-item">
                  <TrainFront size={17} />
                  <span>
                    {profile.commute === "car"
                      ? "Usually travels by car"
                      : profile.commute === "transit"
                        ? "Usually takes public transport"
                        : "Mostly works from home"}
                  </span>
                </div>
                <div className="household-item">
                  <Leaf size={17} />
                  <span>
                    {profile.budget === "free"
                      ? "Simple, budget-friendly choices"
                      : "Open to helpful upgrades"}
                  </span>
                </div>
                <p>Your routine makes the advice more useful.</p>
              </section>
              <div className="care-note">
                <Heart size={16} />
                <p>
                  Better air is a shared journey.
                  <br />
                  You don’t have to do everything today.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
      <button className="chat-fab" onClick={() => setChatOpen(true)}>
        <Sparkles size={19} />
        Ask Saans
      </button>
      {modal === "profile" && (
        <Modal title="Make Saans your own" close={() => setModal(null)}>
          <p className="modal-description">
            A few details help shape a more practical day. Saved only on this
            device; relevant context is sent to Gemini when you chat.
          </p>
          <form
            className="profile-form"
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = profileSchema.safeParse(draft);
              if (parsed.success) {
                chatRequestId.current++;
                setChatBusy(false);
                setMessages([]);
                setProfile(parsed.data);
                setCompleted([]);
                setModal(null);
              }
            }}
          >
            <label>
              What should we call you?
              <input
                value={draft.name}
                maxLength={40}
                required
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <fieldset>
              <legend>Your household</legend>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={draft.children}
                  onChange={(e) =>
                    setDraft({ ...draft, children: e.target.checked })
                  }
                />
                Children in the household
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={draft.sensitive}
                  onChange={(e) =>
                    setDraft({ ...draft, sensitive: e.target.checked })
                  }
                />
                Someone needs extra care around air pollution
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={draft.purifier}
                  onChange={(e) =>
                    setDraft({ ...draft, purifier: e.target.checked })
                  }
                />
                We have an air purifier
              </label>
            </fieldset>
            <div className="form-row">
              <label>
                Usual commute
                <select
                  value={draft.commute}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      commute: e.target.value as Profile["commute"],
                    })
                  }
                >
                  <option value="car">Personal car</option>
                  <option value="transit">Public transport</option>
                  <option value="home">Work from home</option>
                </select>
              </label>
              <label>
                Daily travel (km)
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="1"
                  required
                  value={draft.distance}
                  onChange={(e) =>
                    setDraft({ ...draft, distance: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <label>
              Your preference
              <select
                value={draft.budget}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    budget: e.target.value as Profile["budget"],
                  })
                }
              >
                <option value="free">Start with no-cost habits</option>
                <option value="flexible">Open to practical upgrades</option>
              </select>
            </label>
            <small>
              Updating your profile resets today’s checklist so estimates match
              your new routine.
            </small>
            <button className="primary-button" type="submit">
              Save my preferences <Check size={16} />
            </button>
          </form>
        </Modal>
      )}
      {modal === "location" && (
        <Modal title="Find your breathing space" close={() => setModal(null)}>
          <p className="modal-description">
            Search any city worldwide. Air-quality coverage and model resolution
            vary by location.
          </p>
          <div className="search-field">
            <Search size={18} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search city, anywhere in the world"
              maxLength={80}
              aria-label="Search cities"
            />
          </div>
          <p className="tiny muted" role="status">
            {searchStatus ||
              (query.length < 2 ? "FEATURED CITIES" : "SEARCH RESULTS")}
          </p>
          <div className="city-results">
            {(query.length >= 2 ? results : cities).map((city, i) => (
              <button
                key={`${city.latitude}-${city.longitude}-${i}`}
                onClick={() => selectLocation(city)}
              >
                <span className="city-pin">
                  <MapPin size={18} />
                </span>
                <span>
                  <strong>{city.name}</strong>
                  <small>{city.country}</small>
                </span>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
          <div className="location-foot">
            <Earth size={15} />
            City-level context. No precise location tracking.
          </div>
        </Modal>
      )}
      {modal === "sources" && (
        <Modal
          title="Good guidance starts with clarity"
          close={() => setModal(null)}
        >
          <div className="resource-content">
            <h3>Know what you’re looking at</h3>
            <p>
              Saans uses the <strong>US EPA AQI scale</strong> for all cities.
              This is different from India’s National AQI. Demo readings are
              illustrative. Current estimates and forecasts come from the CAMS
              atmospheric model through Open-Meteo, not a sensor at your home.
              They may differ from official local readings.
            </p>
            {sources.map((s) => (
              <a
                className="source-link"
                key={s.url}
                href={s.url}
                target="_blank"
                rel="noreferrer"
              >
                <BookOpen size={18} />
                <span>
                  <strong>{s.title}</strong>
                  <small>{s.provider}</small>
                </span>
                <ArrowUpRight size={16} />
              </a>
            ))}
            <a
              className="text-button"
              href="https://atmosphere.copernicus.eu/"
              target="_blank"
              rel="noreferrer"
            >
              Copernicus Atmosphere Monitoring Service (CAMS){" "}
              <ArrowUpRight size={13} />
            </a>
            <h3>Your privacy, simply</h3>
            <p>
              Preferences and checklists stay in your browser. Chats are held in
              memory and clear on refresh. When Gemini is enabled, messages,
              city and relevant household context are sent through our server to
              Google. Your name is excluded from profile context. Avoid sharing
              identifying or sensitive medical details. Google’s data terms
              apply to API processing.
            </p>
            <h3>Useful support, with limits</h3>
            <p>
              AI can make mistakes. Follow local public-health advice and your
              clinician’s care plan. Seek urgent help for severe breathing
              difficulty or chest pain. Carbon estimates are illustrative, not
              measured reductions.
            </p>
            <button
              className="secondary-button"
              onClick={() => {
                for (const key of [
                  "saans-profile",
                  "saans-location",
                  "saans-completed",
                  "saans-pledges",
                ])
                  try {
                    localStorage.removeItem(key);
                  } catch {
                    /* Storage can be disabled. */
                  }
                chatRequestId.current++;
                setChatBusy(false);
                setProfile(defaultProfile);
                setLocation(cities[0]);
                setCompleted([]);
                setPledges([]);
                setMessages([]);
                requestId.current++;
                setAirBusy(false);
                setAir(demoAir());
                setModal(null);
                setNotice(
                  "Your saved preferences and activity have been cleared.",
                );
              }}
            >
              Reset my local data
            </button>
          </div>
        </Modal>
      )}
      {modal === "notifications" && (
        <Modal title="A quick air-care check-in" close={() => setModal(null)}>
          <div className="notification-content">
            <span className="action-icon activity">
              <Bell size={24} />
            </span>
            <h3>
              {status.label} air in {location.name}
            </h3>
            <p>
              {air.mode === "demo"
                ? "This is a demo scenario, not a current alert. Load current model data or consult your local authority for actual conditions."
                : "This is model guidance, not an official public-health alert. Check your local authority for advisories."}
            </p>
            <button
              className="primary-button"
              onClick={() => {
                setModal(null);
                void loadAir();
              }}
            >
              Refresh air quality <RefreshCw size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default App;
