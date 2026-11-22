import {
  ArrowUpRight,
  Heart,
  Leaf,
  MapPin,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrainFront,
  Users,
  X,
} from "lucide-react";
import type * as React from "react";
import { type FormEvent } from "react";
import type { Profile } from "../../shared/domain";
import { type Location } from "../../shared/domain";
import type { ChatMessage, ModalName } from "../types";

interface AssistantPanelProps {
  chatOpen: boolean;
  aiMode: string;
  setChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  profile: Profile;
  location: Location;
  messages: ChatMessage[];
  sendMessage: (text?: string) => Promise<void>;
  setModal: React.Dispatch<React.SetStateAction<ModalName>>;
  chatBusy: boolean;
  chatBottom: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setDraft: React.Dispatch<React.SetStateAction<Profile>>;
}
export function AssistantPanel({
  chatOpen,
  aiMode,
  setChatOpen,
  profile,
  location,
  messages,
  sendMessage,
  setModal,
  chatBusy,
  chatBottom,
  inputRef,
  input,
  setInput,
  setDraft,
}: AssistantPanelProps) {
  return (
    <aside
      className={`right-column ${chatOpen ? "chat-open" : ""}`}
      aria-label="Your air quality assistant"
    >
      <section className="assistant-card">
        <div className="assistant-header">
          <span className="assistant-icon">
            <Sparkles size={21} />
          </span>
          <div>
            <h2>A little guidance, just for you.</h2>
            <span>
              <span className="status-dot" />
              {aiMode === "ai"
                ? "Gemini-powered companion"
                : "Your local air-care guide"}
            </span>
          </div>
          <button
            className="icon-button mobile-chat-close"
            onClick={() => setChatOpen(false)}
            aria-label="Close assistant"
          >
            <X size={18} />
          </button>
        </div>
        <div className="assistant-body">
          <div className="assistant-intro">
            <span className="mini-spark">
              <Sparkles size={16} />
            </span>
            <p>
              Hi {profile.name} <span aria-hidden="true">✳</span>
              <br />A busy day and a hazy sky? Let’s figure it out together.
            </p>
            <p>
              I can help you make small, practical choices for your household in{" "}
              <strong>{location.name}</strong>.
            </p>
            <div className="context-pills">
              <span>
                <MapPin size={11} />
                {location.name}
              </span>
              <span>
                <Users size={11} />
                {profile.children ? "Family with children" : "Your household"}
              </span>
            </div>
          </div>
          {messages.length === 0 && (
            <div className="prompt-list">
              <span className="eyebrow">A GOOD PLACE TO START</span>
              {[
                "Can the kids play outside today?",
                "How can I keep indoor air cleaner?",
                "Help me plan a cleaner commute",
              ].map((text) => (
                <button key={text} onClick={() => void sendMessage(text)}>
                  {text}
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          )}
          <div
            className="messages"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message, i) => (
              <div key={i} className={`message ${message.role}`}>
                <span>
                  {message.role === "user"
                    ? "YOU"
                    : message.mode === "ai"
                      ? "SAANS · GEMINI"
                      : message.mode === "safety"
                        ? "URGENT GUIDANCE"
                        : "SAANS · LOCAL GUIDE"}
                </span>
                <p>{message.content}</p>
                {message.role === "assistant" && message.mode !== "safety" && (
                  <button
                    className="text-button"
                    onClick={() => setModal("sources")}
                  >
                    Guidance sources <ArrowUpRight size={11} />
                  </button>
                )}
              </div>
            ))}
            {chatBusy && (
              <div className="thinking">
                <span />
                <span />
                <span />
                Finding a thoughtful next step…
              </div>
            )}
            <div ref={chatBottom} />
          </div>
        </div>
        <div className="chat-compose">
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void sendMessage();
            }}
          >
            <input
              ref={inputRef}
              aria-label="Ask Saans a question"
              placeholder="What’s on your mind?"
              maxLength={2000}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={chatBusy}
            />
            <button
              aria-label="Send message"
              disabled={chatBusy || !input.trim()}
            >
              <Send size={16} />
            </button>
          </form>
          <p>
            <ShieldCheck size={11} />
            Everyday guidance, not medical advice.
          </p>
        </div>
      </section>
      <section className="household-card card">
        <div className="section-row">
          <h3>Made for your household</h3>
          <button
            className="icon-button"
            onClick={() => {
              setDraft(profile);
              setModal("profile");
            }}
            aria-label="Edit household"
          >
            <Settings2 size={16} />
          </button>
        </div>
        <div className="household-item">
          <Users size={17} />
          <span>
            {profile.children
              ? "Family with children"
              : "Adults-only household"}
          </span>
        </div>
        <div className="household-item">
          <TrainFront size={17} />
          <span>
            {profile.commute === "car"
              ? "Usually travels by car"
              : profile.commute === "transit"
                ? "Usually takes public transport"
                : "Mostly works from home"}
          </span>
        </div>
        <div className="household-item">
          <Leaf size={17} />
          <span>
            {profile.budget === "free"
              ? "Simple, budget-friendly choices"
              : "Open to helpful upgrades"}
          </span>
        </div>
        <p>Your routine makes the advice more useful.</p>
      </section>
      <div className="care-note">
        <Heart size={16} />
        <p>
          Better air is a shared journey.
          <br />
          You don’t have to do everything today.
        </p>
      </div>
    </aside>
  );
}
