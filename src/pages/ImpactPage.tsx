import { Check } from "lucide-react";
import { commuteSavings, type Action, type Profile } from "../../shared/domain";

interface ImpactPageProps {
  completed: string[];
  savings: number;
  pledges: string[];
  plan: Action[];
  profile: Profile;
}
export function ImpactPage({
  completed,
  savings,
  pledges,
  plan,
  profile,
}: ImpactPageProps) {
  return (
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
            0.04) kg CO₂/km = {commuteSavings(profile.distance)} kg CO₂. These
            are illustrative planning assumptions, not verified local emission
            factors. Actual results vary with vehicle, occupancy and
            electricity. Only mark the commute action complete for this estimate
            if you made the car-to-rail switch. We do not calculate avoided
            illness or personal pollution exposure.
          </p>
        </details>
      </section>
    </>
  );
}
