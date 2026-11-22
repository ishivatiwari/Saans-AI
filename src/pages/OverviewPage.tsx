import {
  ArrowRight,
  ArrowUpRight,
  Clock3,
  Info,
  LoaderCircle,
  MapPin,
  RefreshCw,
  Sprout,
} from "lucide-react";
import {
  category,
  type Action,
  type AirData,
  type Location,
  type Profile,
} from "../../shared/domain";
import { ActionCard } from "../components/ActionCard";
import { Skyline } from "../components/Primitives";
import type { Page } from "../types";

interface OverviewPageProps {
  loadAir: () => Promise<void>;
  airBusy: boolean;
  air: AirData;
  location: Location;
  status: { label: string; color: string; level: number };
  setModal: (value: "sources") => void;
  chartMax: number;
  changePage: (page: Page) => void;
  plan: Action[];
  completed: string[];
  toggleAction: (id: string) => void;
  profile: Profile;
}
export function OverviewPage({
  loadAir,
  airBusy,
  air,
  location,
  status,
  setModal,
  chartMax,
  changePage,
  plan,
  completed,
  toggleAction,
  profile,
}: OverviewPageProps) {
  return (
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
            Your small steps for today <span className="count-badge">3</span>
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
        <button onClick={() => changePage("My impact")} className="text-button">
          See your impact <ArrowUpRight size={16} />
        </button>
      </section>
    </>
  );
}
