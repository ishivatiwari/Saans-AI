import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  Download,
  Flower2,
  Heart,
  Home,
  Info,
  Leaf,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Sprout,
  Sun,
  TrainFront,
  Users,
  Wind,
} from "lucide-react";
import {
  category,
  commuteSavings,
  type Action,
  type Profile,
  type Location,
  type AirData,
} from "../../shared/domain";
import { ActionCard } from "./ActionCard";
import { Skyline } from "./Primitives";
export type Page =
  "Overview" | "My daily plan" | "Healthy home" | "My impact" | "Community";
interface PageContentProps {
  page: Page;
  air: AirData;
  location: Location;
  profile: Profile;
  airBusy: boolean;
  loadAir: () => Promise<void>;
  setModal: (value: "sources") => void;
  changePage: (page: Page) => void;
  plan: Action[];
  completed: string[];
  toggleAction: (id: string) => void;
  exportPlan: () => void;
  sendMessage: (text: string) => Promise<void>;
  savings: number;
  pledges: string[];
  setPledges: (updater: (previous: string[]) => string[]) => void;
}
export function PageContent({
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
}: PageContentProps) {
  const status = category(air.aqi);
  const chartMax = Math.max(400, ...air.hours.map((h) => h.aqi));
  return (
    <>
      {page === "Overview" && (
        <>
          <section className="air-card">
            <div className="air-card-top">
              <span>
                <span className="status-dot" />
                THE AIR AROUND YOU
              </span>
              <button
                className="data-badge"
                onClick={() => void loadAir()}
                disabled={airBusy}
              >
                {airBusy ? (
                  <LoaderCircle size={12} className="spin" />
                ) : (
                  <RefreshCw size={12} />
                )}{" "}
                {air.mode === "demo"
                  ? "Demo data · get current"
                  : "Model estimate · refresh"}
              </button>
            </div>
            <div className="air-main">
              <div className="air-info">
                <div className="air-location">
                  <MapPin size={14} />
                  {location.name}
                  <span>US AQI</span>
                </div>
                <div className="aqi-number">
                  {air.aqi}
                  <span className="aqi-status" style={{ color: status.color }}>
                    <span style={{ background: status.color }} />
                    {status.label}
                  </span>
                </div>
                <h2>
                  {air.aqi > 200
                    ? "A good day to take extra care."
                    : air.aqi > 100
                      ? "A little planning makes a difference."
                      : "A little more room to breathe."}
                </h2>
                <p>
                  {air.aqi > 200
                    ? "Keep outdoor time short. Make room for cleaner air indoors, especially for children and sensitive family members."
                    : air.aqi > 100
                      ? "Consider quieter routes and gentler activity. Sensitive family members may need extra care."
                      : "Make the most of your day. Keep an eye on changing conditions and your personal sensitivity."}
                </p>
              </div>
              <Skyline />
            </div>
            <div className="air-footer">
              <div>
                <span>PM2.5</span>
                <strong>
                  {air.pm25.toFixed(0)} <small>µg/m³</small>
                </strong>
              </div>
              <div>
                <span>PM10</span>
                <strong>
                  {air.pm10.toFixed(0)} <small>µg/m³</small>
                </strong>
              </div>
              <p>
                <Info size={13} />
                {air.mode === "demo"
                  ? "Illustrative winter-smog scenario"
                  : `CAMS model · ${new Date(air.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                <button onClick={() => setModal("sources")}>
                  About this data <ArrowUpRight size={11} />
                </button>
              </p>
            </div>
          </section>
          <section className="forecast card">
            <div className="section-row">
              <h2>How the air may change</h2>
              <span className="muted tiny">
                Your time · {air.hours.length} hours ·{" "}
                {air.mode === "demo" ? "illustrative" : "forecast"}
              </span>
            </div>
            <div
              className="chart"
              role="img"
              aria-label={`US AQI forecast: ${air.hours.map((h) => `${new Date(h.time).toLocaleTimeString([], { hour: "numeric" })}: ${h.aqi}`).join(", ")}`}
            >
              <div className="chart-labels">
                <span>{chartMax}</span>
                <span>{chartMax / 2}</span>
                <span>0</span>
              </div>
              <div className="chart-plot">
                <div className="gridline first" />
                <div className="gridline second" />
                <div className="bars">
                  {air.hours.map((h, i) => (
                    <div className="bar-column" key={h.time}>
                      <div
                        className={`bar ${i === 0 ? "current" : ""}`}
                        style={{
                          height: `${Math.min((h.aqi / Math.max(400, ...air.hours.map((x) => x.aqi))) * 100, 100)}%`,
                          backgroundColor: category(h.aqi).color,
                        }}
                      >
                        <span>{h.aqi}</span>
                      </div>
                      <small>
                        {i === 0
                          ? "Now"
                          : i % 2 === 0
                            ? new Date(h.time).toLocaleTimeString([], {
                                hour: "numeric",
                                hour12: true,
                              })
                            : ""}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="forecast-note">
              <Clock3 size={14} />
              <span>
                {Math.min(...air.hours.map((h) => h.aqi)) > 150
                  ? "Lower doesn’t mean low-risk. Keep outdoor exertion limited."
                  : "Check conditions again before you head out."}
              </span>
            </div>
          </section>
          <div className="section-row daily-heading">
            <div>
              <h2>
                Your small steps for today{" "}
                <span className="count-badge">3</span>
              </h2>
              <p>Made for your life. Mindful of the air.</p>
            </div>
            <button
              className="text-button"
              onClick={() => changePage("My daily plan")}
            >
              View my plan <ArrowRight size={15} />
            </button>
          </div>
          <div className="action-grid">
            {plan.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                completed={completed}
                toggleAction={toggleAction}
                profile={profile}
              />
            ))}
          </div>
          <section className="impact-strip">
            <span className="impact-icon">
              <Sprout size={26} />
            </span>
            <div>
              <h3>A healthier day. A lighter footprint.</h3>
              <p>
                {completed.length
                  ? `${completed.length} thoughtful ${completed.length === 1 ? "choice" : "choices"} logged today. Keep going at your own pace.`
                  : "Your everyday choices can make a difference. Start with one."}
              </p>
            </div>
            <button
              onClick={() => changePage("My impact")}
              className="text-button"
            >
              See your impact <ArrowUpRight size={16} />
            </button>
          </section>
        </>
      )}
      {page === "My daily plan" && (
        <>
          <section className="plan-banner">
            <Sun size={32} />
            <div>
              <span className="eyebrow">YOUR PERSONAL DAILY ROUTINE</span>
              <h2>Three small steps. One thoughtful day.</h2>
              <p>
                Based on {location.name}, US AQI {air.aqi} (
                {air.mode === "demo" ? "demo" : "model"}), and your household.
              </p>
            </div>
            <button className="secondary-button" onClick={exportPlan}>
              <Download size={16} />
              Save plan
            </button>
          </section>
          <div className="plan-progress">
            <span>
              {completed.filter((id) => plan.some((a) => a.id === id)).length}{" "}
              of 3 steps completed
            </span>
            <progress
              value={
                completed.filter((id) => plan.some((a) => a.id === id)).length
              }
              max={3}
            />
          </div>
          <div className="plan-list">
            {plan.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                completed={completed}
                toggleAction={toggleAction}
                profile={profile}
              />
            ))}
          </div>
          <div className="info-panel">
            <ShieldCheck size={22} />
            <div>
              <h3>Your wellbeing comes first</h3>
              <p>
                Lower-emission travel is useful when practical. During severe
                pollution, prioritize reducing exposure. Follow local school,
                health, and transport advisories.
              </p>
            </div>
          </div>
        </>
      )}
      {page === "Healthy home" && (
        <>
          <section className="home-hero">
            <div>
              <span className="eyebrow">YOUR CLEANER-AIR CORNER</span>
              <h2>
                Better air starts
                <br />
                with fewer sources.
              </h2>
              <p>You don’t need to buy something to take the first step.</p>
              <button
                className="primary-button"
                onClick={() =>
                  void sendMessage(
                    "Help me make an affordable cleaner-air room",
                  )
                }
              >
                Build my home routine <ArrowRight size={16} />
              </button>
            </div>
            <div className="home-illustration">
              <Home size={110} strokeWidth={0.8} />
              <Leaf size={45} />
              <Wind size={42} />
            </div>
          </section>
          <div className="home-tips">
            {[
              {
                icon: Flower2,
                title: "Keep the comfort. Skip the smoke.",
                body: "Choose smoke-free rituals over incense, candles and mosquito coils. Keep tobacco smoke outside and away from doors.",
                tag: "Start here · no cost",
              },
              {
                icon: Wind,
                title: "Ventilate thoughtfully",
                body: "Use externally vented kitchen extraction. Time window opening for improved outdoor conditions; keep required ventilation clear.",
                tag: "Everyday habit",
              },
              {
                icon: ShieldCheck,
                title: "Make one room a cleaner-air space",
                body: "If available, run a room-sized HEPA air cleaner with unobstructed airflow. Avoid ozone generators and check filters regularly.",
                tag: profile.purifier
                  ? "Use what you have"
                  : "When your budget allows",
              },
              {
                icon: Home,
                title: "Don’t guess your indoor AQI",
                body: "Outdoor readings cannot measure your living room. A particle monitor can help track trends, but does not detect every indoor hazard.",
                tag: "Know the limits",
              },
            ].map(({ icon: Icon, title, body, tag }) => (
              <article className="card home-tip" key={title}>
                <span className="action-icon home">
                  <Icon size={23} />
                </span>
                <span className="eyebrow">{tag}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
          <button className="text-button" onClick={() => setModal("sources")}>
            Read the evidence behind these habits <ArrowUpRight size={15} />
          </button>
        </>
      )}
      {page === "My impact" && (
        <>
          <section className="impact-hero">
            <span className="eyebrow">PROGRESS, AT YOUR OWN PACE</span>
            <h2>Every thoughtful choice counts.</h2>
            <div className="impact-stats">
              <div>
                <strong>
                  {completed.length}
                  <span>/ 3</span>
                </strong>
                <p>daily actions logged</p>
              </div>
              <div>
                <strong>
                  {savings.toFixed(2)}
                  <span>kg</span>
                </strong>
                <p>estimated CO₂ avoided today*</p>
              </div>
              <div>
                <strong>{pledges.length}</strong>
                <p>personal community commitments</p>
              </div>
            </div>
          </section>
          <section className="card impact-detail">
            <h2>A clear view of your impact</h2>
            <p>We separate what you did from what we can estimate.</p>
            {plan.map((a) => (
              <div className="impact-item" key={a.id}>
                <span
                  className={`check-button ${completed.includes(a.id) ? "checked" : ""}`}
                >
                  {completed.includes(a.id) && <Check size={14} />}
                </span>
                <div>
                  <h3>{a.title}</h3>
                  <p>
                    {completed.includes(a.id)
                      ? "Logged by you today"
                      : "Not completed yet"}
                  </p>
                </div>
                <span>
                  {a.co2 > 0 && completed.includes(a.id)
                    ? `~${a.co2} kg CO₂`
                    : "Habit benefit"}
                </span>
              </div>
            ))}
            <details open>
              <summary>How the CO₂ estimate works</summary>
              <p>
                *For a solo-car-to-rail switch: {profile.distance} km × (0.17 −
                0.04) kg CO₂/km = {commuteSavings(profile.distance)} kg CO₂.
                These are illustrative planning assumptions, not verified local
                emission factors. Actual results vary with vehicle, occupancy
                and electricity. Only mark the commute action complete for this
                estimate if you made the car-to-rail switch. We do not calculate
                avoided illness or personal pollution exposure.
              </p>
            </details>
          </section>
        </>
      )}
      {page === "Community" && (
        <>
          <section className="community-hero">
            <div>
              <span className="eyebrow">A LITTLE BETTER, TOGETHER</span>
              <h2>
                Your neighbourhood.
                <br />
                Your next small step.
              </h2>
              <p>
                Personal commitments you can bring to your building, school, or
                street. No public profile needed.
              </p>
            </div>
            <div className="community-art">
              <Users size={95} strokeWidth={1} />
              <Leaf size={35} />
            </div>
          </section>
          <div className="community-list">
            {[
              {
                id: "idle",
                title: "A calmer, no-idling school gate",
                description:
                  "Commit to switching off your engine while waiting where safe, and invite other caregivers to do the same.",
                icon: TrainFront,
              },
              {
                id: "smoke",
                title: "Celebrate without the smoke",
                description:
                  "Plan a shared celebration with lights and decorations instead of firecrackers and burning materials.",
                icon: Sparkles,
              },
              {
                id: "share",
                title: "Make one shared journey",
                description:
                  "Coordinate a practical carpool or transit trip. During poor air, keep waiting and outdoor transfers short.",
                icon: Users,
              },
            ].map(({ id, title, description, icon: Icon }) => (
              <article className="card community-item" key={id}>
                <span className="action-icon home">
                  <Icon size={24} />
                </span>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <small>Personal pledge · saved on this device</small>
                </div>
                <button
                  className={
                    pledges.includes(id) ? "secondary-button" : "primary-button"
                  }
                  onClick={() =>
                    setPledges((prev) =>
                      prev.includes(id)
                        ? prev.filter((x) => x !== id)
                        : [...prev, id],
                    )
                  }
                >
                  {pledges.includes(id) ? (
                    <>
                      <Check size={15} />
                      Committed
                    </>
                  ) : (
                    <>
                      I’m in <Plus size={15} />
                    </>
                  )}
                </button>
              </article>
            ))}
          </div>
          <div className="info-panel">
            <Heart size={21} />
            <p>
              These are personal commitments, not live community events. Saans
              does not post or share your activity.
            </p>
          </div>
        </>
      )}
    </>
  );
}
