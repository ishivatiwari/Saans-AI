import { ArrowUpRight, BookOpen } from "lucide-react";
import { sources } from "../../shared/domain";
import { Modal } from "../components/Primitives";

interface SourcesDialogProps {
  onClose: () => void;
  onReset: () => void;
}
export function SourcesDialog({ onClose, onReset }: SourcesDialogProps) {
  return (
    <Modal title="Good guidance starts with clarity" close={onClose}>
      <div className="resource-content">
        <h3>Know what you’re looking at</h3>
        <p>
          Saans uses the <strong>US EPA AQI scale</strong> for all cities. This
          is different from India’s National AQI. Demo readings are
          illustrative. Current estimates and forecasts come from the CAMS
          atmospheric model through Open-Meteo, not a sensor at your home. They
          may differ from official local readings.
        </p>
        {sources.map((s) => (
          <a
            className="source-link"
            key={s.url}
            href={s.url}
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen size={18} />
            <span>
              <strong>{s.title}</strong>
              <small>{s.provider}</small>
            </span>
            <ArrowUpRight size={16} />
          </a>
        ))}
        <a
          className="text-button"
          href="https://atmosphere.copernicus.eu/"
          target="_blank"
          rel="noreferrer"
        >
          Copernicus Atmosphere Monitoring Service (CAMS){" "}
          <ArrowUpRight size={13} />
        </a>
        <h3>Your privacy, simply</h3>
        <p>
          Preferences and checklists stay in your browser. Chats are held in
          memory and clear on refresh. When Gemini is enabled, messages, city
          and relevant household context are sent through our server to Google.
          Your name is excluded from profile context. Avoid sharing identifying
          or sensitive medical details. Google’s data terms apply to API
          processing.
        </p>
        <h3>Useful support, with limits</h3>
        <p>
          AI can make mistakes. Follow local public-health advice and your
          clinician’s care plan. Seek urgent help for severe breathing
          difficulty or chest pain. Carbon estimates are illustrative, not
          measured reductions.
        </p>
        <button className="secondary-button" onClick={onReset}>
          Reset my local data
        </button>
      </div>
    </Modal>
  );
}
