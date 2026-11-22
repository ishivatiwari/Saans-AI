import { Download, ShieldCheck, Sun } from "lucide-react";
import {
  type Action,
  type AirData,
  type Location,
  type Profile,
} from "../../shared/domain";
import { ActionCard } from "../components/ActionCard";

interface DailyPlanPageProps {
  location: Location;
  air: AirData;
  exportPlan: () => void;
  completed: string[];
  plan: Action[];
  toggleAction: (id: string) => void;
  profile: Profile;
}
export function DailyPlanPage({
  location,
  air,
  exportPlan,
  completed,
  plan,
  toggleAction,
  profile,
}: DailyPlanPageProps) {
  return (
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
          {completed.filter((id) => plan.some((a) => a.id === id)).length} of 3
          steps completed
        </span>
        <progress
          value={completed.filter((id) => plan.some((a) => a.id === id)).length}
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
  );
}
