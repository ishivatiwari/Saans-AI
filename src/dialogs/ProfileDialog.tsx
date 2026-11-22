import { Check } from "lucide-react";
import type * as React from "react";
import { profileSchema, type Profile } from "../../shared/domain";
import { Modal } from "../components/Primitives";

interface ProfileDialogProps {
  onClose: () => void;
  draft: Profile;
  setDraft: React.Dispatch<React.SetStateAction<Profile>>;
  onSave: (profile: Profile) => void;
}
export function ProfileDialog({
  onClose,
  draft,
  setDraft,
  onSave,
}: ProfileDialogProps) {
  return (
    <Modal title="Make Saans your own" close={onClose}>
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
            onSave(parsed.data);
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
          Updating your profile resets today’s checklist so estimates match your
          new routine.
        </small>
        <button className="primary-button" type="submit">
          Save my preferences <Check size={16} />
        </button>
      </form>
    </Modal>
  );
}
