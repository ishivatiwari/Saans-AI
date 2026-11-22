import {
  Check,
  Heart,
  Leaf,
  Plus,
  Sparkles,
  TrainFront,
  Users,
} from "lucide-react";

interface CommunityPageProps {
  pledges: string[];
  setPledges: (updater: (previous: string[]) => string[]) => void;
}
export function CommunityPage({ pledges, setPledges }: CommunityPageProps) {
  return (
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
          These are personal commitments, not live community events. Saans does
          not post or share your activity.
        </p>
      </div>
    </>
  );
}
