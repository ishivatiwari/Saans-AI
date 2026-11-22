import { CHAT_LIMITS } from "../shared/contracts";
import { api } from "./lib/api";
import { useCitySearch } from "./hooks/useCitySearch";
import {
  ArrowUpRight,
  Bell,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Home,
  Info,
  LayoutDashboard,
  Leaf,
  MapPin,
  Menu,
  Settings2,
  Sparkles,
  Sprout,
  Sun,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Profile } from "../shared/domain";
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
} from "../shared/domain";
import { AssistantPanel } from "./components/AssistantPanel";
import { LocationDialog } from "./dialogs/LocationDialog";
import { NotificationsDialog } from "./dialogs/NotificationsDialog";
import { ProfileDialog } from "./dialogs/ProfileDialog";
import { SourcesDialog } from "./dialogs/SourcesDialog";
import { localDay, readSaved, save } from "./lib/storage";
import type { ChatMessage, Page } from "./types";

import { PageContent } from "./components/PageContent";

const nav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "My daily plan", icon: Sun },
  { label: "Healthy home", icon: Home },
  { label: "My impact", icon: Sprout },
  { label: "Community", icon: Users },
] as const;

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
  const { results, searchStatus } = useCitySearch(query);
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
    api
      .health()
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
  async function loadAir(next = location) {
    const id = ++requestId.current;
    setAirBusy(true);
    setNotice("");
    try {
      const data = await api.air(next);
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
      .slice(-CHAT_LIMITS.history)
      .map(({ role, content }) => ({
        role,
        content: content.slice(0, CHAT_LIMITS.historyMessage),
      }));
    setMessages((prev) => [...prev, { role: "user", content }]);
    try {
      const data = await api.chat({
        message: content,
        history,
        profile,
        location,
        aqi: air.aqi,
        mode: air.mode,
      });
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
  function resetLocalData() {
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
    setNotice("Your saved preferences and activity have been cleared.");
  }
  function saveProfile(nextProfile: Profile) {
    chatRequestId.current++;
    setChatBusy(false);
    setMessages([]);
    setProfile(nextProfile);
    setCompleted([]);
    setModal(null);
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
            <AssistantPanel
              chatOpen={chatOpen}
              aiMode={aiMode}
              setChatOpen={setChatOpen}
              profile={profile}
              location={location}
              messages={messages}
              sendMessage={sendMessage}
              setModal={setModal}
              chatBusy={chatBusy}
              chatBottom={chatBottom}
              inputRef={inputRef}
              input={input}
              setInput={setInput}
              setDraft={setDraft}
            />
          </div>
        </main>
      </div>
      <button className="chat-fab" onClick={() => setChatOpen(true)}>
        <Sparkles size={19} />
        Ask Saans
      </button>
      {modal === "profile" && (
        <ProfileDialog
          onClose={() => setModal(null)}
          draft={draft}
          setDraft={setDraft}
          onSave={saveProfile}
        />
      )}
      {modal === "location" && (
        <LocationDialog
          setModal={setModal}
          query={query}
          setQuery={setQuery}
          searchStatus={searchStatus}
          results={results}
          selectLocation={selectLocation}
        />
      )}
      {modal === "sources" && (
        <SourcesDialog
          onClose={() => setModal(null)}
          onReset={resetLocalData}
        />
      )}
      {modal === "notifications" && (
        <NotificationsDialog
          setModal={setModal}
          status={status}
          location={location}
          air={air}
          loadAir={loadAir}
        />
      )}
    </div>
  );
}
export default App;
