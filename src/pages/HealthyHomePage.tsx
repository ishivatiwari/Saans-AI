import {
  ArrowRight,
  ArrowUpRight,
  Flower2,
  Home,
  Leaf,
  ShieldCheck,
  Wind,
} from "lucide-react";
import { type Profile } from "../../shared/domain";

interface HealthyHomePageProps {
  sendMessage: (text: string) => Promise<void>;
  profile: Profile;
  setModal: (value: "sources") => void;
}
export function HealthyHomePage({
  sendMessage,
  profile,
  setModal,
}: HealthyHomePageProps) {
  return (
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
              void sendMessage("Help me make an affordable cleaner-air room")
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
  );
}
