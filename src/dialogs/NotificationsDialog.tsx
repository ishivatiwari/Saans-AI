import { Bell, RefreshCw } from "lucide-react";
import type * as React from "react";
import { type AirData, type Location } from "../../shared/domain";
import { Modal } from "../components/Primitives";
import type { ModalName } from "../types";

interface NotificationsDialogProps {
  setModal: React.Dispatch<React.SetStateAction<ModalName>>;
  status: { label: string; color: string; level: number };
  location: Location;
  air: AirData;
  loadAir: (next?: Location) => Promise<void>;
}
export function NotificationsDialog({
  setModal,
  status,
  location,
  air,
  loadAir,
}: NotificationsDialogProps) {
  return (
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
  );
}
