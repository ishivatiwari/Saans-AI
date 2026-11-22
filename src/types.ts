export type Page =
  "Overview" | "My daily plan" | "Healthy home" | "My impact" | "Community";
export type ModalName =
  "profile" | "location" | "sources" | "notifications" | null;
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  mode?: string;
}
