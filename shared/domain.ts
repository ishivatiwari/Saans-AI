import { z } from "zod";

export const locationSchema = z.object({
  name: z.string().min(1).max(100),
  country: z.string().max(100),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
export type Location = z.infer<typeof locationSchema>;
export const profileSchema = z.object({
  name: z.string().trim().min(1).max(40),
  children: z.boolean(),
  sensitive: z.boolean(),
  purifier: z.boolean(),
  commute: z.enum(["car", "transit", "home"]),
  distance: z.number().min(0).max(200),
  budget: z.enum(["free", "flexible"]),
});
export type Profile = z.infer<typeof profileSchema>;
export const defaultProfile: Profile = {
  name: "Alex",
  children: true,
  sensitive: false,
  purifier: false,
  commute: "car",
  distance: 12,
  budget: "free",
};
export const cities: Location[] = [
  { name: "New Delhi", country: "India", latitude: 28.6139, longitude: 77.209 },
  { name: "Mumbai", country: "India", latitude: 19.076, longitude: 72.8777 },
  {
    name: "Bengaluru",
    country: "India",
    latitude: 12.9716,
    longitude: 77.5946,
  },
  {
    name: "London",
    country: "United Kingdom",
    latitude: 51.5074,
    longitude: -0.1278,
  },
  {
    name: "Singapore",
    country: "Singapore",
    latitude: 1.3521,
    longitude: 103.8198,
  },
  {
    name: "New York",
    country: "United States",
    latitude: 40.7128,
    longitude: -74.006,
  },
];
export interface AirData {
  aqi: number;
  pm25: number;
  pm10: number;
  time: string;
  timezone: string;
  mode: "demo" | "model";
  hours: { time: string; aqi: number }[];
}
export function category(aqi: number) {
  if (!Number.isFinite(aqi) || aqi < 0)
    return { label: "Unavailable", color: "#69716c", level: -1 };
  if (aqi <= 50) return { label: "Good", color: "#3d693f", level: 0 };
  if (aqi <= 100) return { label: "Moderate", color: "#776011", level: 1 };
  if (aqi <= 150)
    return {
      label: "Unhealthy for sensitive groups",
      color: "#985322",
      level: 2,
    };
  if (aqi <= 200) return { label: "Unhealthy", color: "#a53b37", level: 3 };
  if (aqi <= 300)
    return { label: "Very unhealthy", color: "#875279", level: 4 };
  return { label: "Hazardous", color: "#8b3d4c", level: 5 };
}
export function demoAir(): AirData {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  return {
    aqi: 312,
    pm25: 237,
    pm10: 318,
    mode: "demo",
    time: start.toISOString(),
    timezone: "UTC",
    hours: [312, 306, 294, 281, 265, 249, 241, 255, 273, 291, 310, 322].map(
      (aqi, i) => ({
        aqi,
        time: new Date(start.getTime() + i * 3600000).toISOString(),
      }),
    ),
  };
}
export interface Action {
  id: string;
  time: string;
  title: string;
  description: string;
  impact: string;
  tag: string;
  icon: "train" | "home" | "activity" | "leaf";
  co2: number;
}
export function commuteSavings(distance: number) {
  return Math.max(0, Math.round(distance * (0.17 - 0.04) * 100) / 100);
}
export function buildPlan(profile: Profile, aqi: number): Action[] {
  const bad =
    aqi > 150 || ((profile.children || profile.sensitive) && aqi > 100);
  return [
    {
      id: "move",
      time: "Morning",
      title: bad
        ? "Bring your movement indoors"
        : "Make room for an outdoor break",
      description: bad
        ? `${profile.children ? "Swap outdoor play for a family stretch or dance session." : "Try a gentle stretch or indoor workout."} Choose a room with cleaner air.`
        : "Choose a quieter route away from traffic. Recheck local conditions before heading out.",
      impact: bad
        ? "Less time breathing polluted outdoor air."
        : "A chance to move without an extra car trip.",
      tag: "Your wellbeing",
      icon: "activity",
      co2: 0,
    },
    {
      id: "commute",
      time: "On your way",
      title:
        profile.commute === "car"
          ? aqi > 200
            ? "Take rail for essential trips"
            : "Make your commute a shared one"
          : profile.commute === "transit"
            ? "Keep your low-emission commute"
            : "Keep the commute off your calendar",
      description:
        profile.commute === "car"
          ? aqi > 200
            ? "Work from home if possible. For essential travel, swap a solo car trip for enclosed rail where available. Keep outdoor transfers short."
            : "Try rail or a shared ride where practical. Choose stops away from heavy traffic."
          : profile.commute === "transit"
            ? "Check your route and shorten time at busy roadside stops. Exposure varies along the journey."
            : "Combine any essential errands into one trip and avoid unnecessary engine idling.",
      impact:
        profile.commute === "car"
          ? `Switching ${profile.distance} km from solo car to rail could avoid about ${commuteSavings(profile.distance)} kg CO₂.`
          : "Fewer solo car trips mean fewer transport emissions.",
      tag: "Lighter footprint",
      icon: "train",
      co2: profile.commute === "car" ? commuteSavings(profile.distance) : 0,
    },
    {
      id: "home",
      time: "Back at home",
      title: profile.purifier
        ? "Give your clean-air room some care"
        : "Start with a smoke-free home",
      description: profile.purifier
        ? "Run a room-sized particle filter with clear airflow. Check its filter and avoid ozone-generating modes."
        : `Skip incense, candles and smoking indoors. Damp-dust surfaces.${profile.budget === "flexible" ? " Consider a room-sized HEPA air cleaner." : " These first steps need no new equipment."}`,
      impact:
        "Reduce indoor particle sources. Outdoor AQI cannot tell you your indoor air quality.",
      tag: profile.budget === "free" ? "No-cost habit" : "Cleaner indoors",
      icon: "home",
      co2: 0,
    },
  ];
}
export const sources = [
  {
    title: "Understanding the US AQI",
    url: "https://www.airnow.gov/aqi/aqi-basics/",
    provider: "AirNow · US EPA",
  },
  {
    title: "Choosing and using air cleaners",
    url: "https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home",
    provider: "US EPA",
  },
  {
    title: "Air-quality model and forecast",
    url: "https://open-meteo.com/en/docs/air-quality-api",
    provider: "Open-Meteo · CAMS",
  },
];
export function urgentMessage(message: string): string | null {
  if (
    /(can.?t breathe|cannot breathe|struggling to breathe|chest pain|blue lips|severe breath|gasping|difficulty breathing)/i.test(
      message,
    )
  )
    return "Severe breathing trouble, chest pain, or blue lips can be an emergency. Contact your local emergency service now. Move away from smoke if you can do so safely and follow your prescribed emergency care plan. Do not wait for an air-quality reading or an AI response.";
  return null;
}
export function localReply(
  message: string,
  profile: Profile,
  aqi: number,
  location: Location,
): string {
  const emergency = urgentMessage(message);
  if (emergency) return emergency;
  const prefix = `At a US AQI of ${aqi} (${category(aqi).label.toLowerCase()}) in ${location.name}, `;
  if (/window|ventilat|cooking|cook/i.test(message))
    return (
      prefix +
      "compare outdoor conditions with indoor sources before opening windows. During high outdoor pollution, limit outdoor air entry where practical, but do not block required ventilation or combustion-air vents. Use an externally vented kitchen hood while cooking. Air out when outdoor conditions improve; never stay in a dangerously hot or smoky room."
    );
  if (/purifier|plant|filter|indoor|home|incense/i.test(message))
    return (
      "Start by removing smoke sources: incense, candles and tobacco. Damp-dust instead of dry sweeping. A correctly sized HEPA air cleaner can reduce particles, but does not remove every pollutant or replace ventilation. Avoid ozone generators. Houseplants are not a substitute for filtration. " +
      (profile.purifier
        ? "Keep your existing purifier airflow clear and follow its filter schedule."
        : "If a purifier is outside your budget, focus on smoke-free habits first.")
    );
  if (/school|child|kid|play|run|walk|exercise|outside/i.test(message))
    return (
      prefix +
      (aqi > 100
        ? "reduce outdoor exertion, especially for children and anyone with heart or lung conditions. At very high levels, move activity to a cleaner indoor space. Ask the school about indoor play and its local air-quality policy. If essential travel cannot be avoided, shorten time by traffic; a well-fitting particulate respirator may help where appropriate, but fit and tolerability matter, especially for children."
        : "an outdoor break may be reasonable, depending on individual sensitivity. Choose quieter streets, recheck conditions, and reduce activity if symptoms develop.") +
      " Follow personal medical advice and local advisories."
    );
  if (/commut|transport|metro|bus|car|carbon|emission/i.test(message))
    return (
      buildPlan(profile, aqi)[1].description +
      " " +
      buildPlan(profile, aqi)[1].impact +
      " This planning estimate uses 0.17 kg CO₂/km for a solo car and 0.04 kg CO₂/passenger-km for rail. Actual impact depends on vehicle, occupancy and electricity supply; it is not an exposure estimate."
    );
  return (
    prefix +
    buildPlan(profile, aqi)
      .map((a, i) => `\n\n${i + 1}. ${a.title}. ${a.description}`)
      .join("") +
    "\n\nTell me about school, your commute, windows, or indoor air for a more focused answer. This local guide supports daily decisions, not diagnosis."
  );
}
