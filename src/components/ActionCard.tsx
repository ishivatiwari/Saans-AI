import { Activity, TrainFront, Home, Leaf, Check, Plus } from "lucide-react";
import type { Action, Profile } from "../../shared/domain";
const iconMap = {
  train: TrainFront,
  home: Home,
  activity: Activity,
  leaf: Leaf,
};
export function ActionCard({
  action,
  completed,
  toggleAction,
  profile,
}: {
  action: Action;
  completed: string[];
  toggleAction: (id: string) => void;
  profile: Profile;
}) {
  const Icon = iconMap[action.icon];
  const done = completed.includes(action.id);
  return (
    <article className={`action-card ${done ? "is-done" : ""}`}>
      <div className="action-top">
        <span className={`action-icon ${action.icon}`}>
          <Icon size={21} />
        </span>
        <button
          onClick={() => toggleAction(action.id)}
          className={`check-button ${done ? "checked" : ""}`}
          aria-label={`${done ? "Undo" : "Complete"}: ${action.title}`}
          aria-pressed={done}
        >
          {done && <Check size={14} />}
        </button>
      </div>
      <span className="eyebrow">{action.time}</span>
      <h3>{action.title}</h3>
      <p>{action.description}</p>
      <div className="action-tag">
        <span />
        {action.tag}
      </div>
      <details>
        <summary>
          Why this helps <Plus size={13} />
        </summary>
        <p>{action.impact}</p>
        {action.co2 > 0 && (
          <small>
            Illustrative car-to-rail estimate: {profile.distance} km × (0.17 −
            0.04) kg CO₂/km. Mark complete only if you made this switch.
          </small>
        )}
      </details>
    </article>
  );
}
