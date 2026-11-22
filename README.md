# Saans · Your everyday air-care companion

A family-focused urban air-quality assistant that turns pollution context into practical routines, cleaner indoor habits and lower-emission alternatives. Supports city search worldwide, not only Delhi NCR.

## Run locally

Requires Node.js 22.13+ (Node 24 recommended).

```powershell
npm install
Copy-Item .env.example .env
# Set GEMINI_API_KEY in .env using your editor
npm run dev
```

Open **http://localhost:5173**. API runs at `http://localhost:3001`.

```dotenv
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.5-flash-lite
PORT=3001
```

Create a key in [Google AI Studio](https://aistudio.google.com/apikey). Model availability depends on your account; `GEMINI_MODEL` is configurable. The implementation uses the Gemini `generateContent` REST API. Keys stay in the server environment, never in frontend code or `VITE_*` variables. Restart the server after editing `.env`. No key is required to explore the complete local guidance experience. The interface distinguishes Gemini answers from local fallback answers.

## What works

- Worldwide city search via Open-Meteo geocoding; current CAMS model estimates and 12-hour forecasts. Click **Demo data · get current** or choose a city to load them.
- Consistent, explicitly labeled **US EPA AQI** for every city. No mixing with India's National AQI.
- Personalized daily routine based on children, sensitivity, commute distance, equipment and budget.
- Gemini chat with recent conversation context, grounded reference material, server-side key protection, timeout and honest local fallback.
- Emergency symptom interception before AI calls; indoor alternatives prioritized during severe pollution.
- Daily checklist, downloadable plan, transparent CO₂ assumptions and locally saved community commitments.
- Home-care guide, sources, privacy controls, local-data reset, mobile navigation and mobile chat.
- Semantic navigation, keyboard-accessible native dialogs, visible focus, reduced-motion support, text descriptions for the chart, and labeled controls.

## Validation

```powershell
npm test
npm run build
npm run test:e2e
npm start
```

Production build is served at **http://localhost:3001**. `npm test` exercises AQI boundaries, sensitive households, severe-smog decisions, equipment/budget logic, emission arithmetic, urgent symptoms, validation, Gemini's request contract, upstream failures and model data normalization. Provider calls in tests are mocked; a real Gemini response requires your own key.

## Architecture

Browser tests use installed Microsoft Edge in headless mode. They cover desktop and mobile flows, worldwide location changes, persistence and automated axe checks of the dashboard and profile dialog. For other platforms, change `channel` in `playwright.config.ts` or install Playwright Chromium. Use `npm run format:check` for formatting validation.

```text
src/App.tsx          Application state, event coordination and layout
src/pages/           One focused component per application page
src/dialogs/         Profile, city search, sources and notification dialogs
src/components/      Shared presentation components and assistant panel
src/lib/             Browser persistence helpers with safe fallbacks
src/types.ts         Shared UI types
src/styles.css       Responsive styles and accessibility rules
shared/domain.ts     Validated profile types, AQI categories, plan engine and local guide
server/app.ts        Express setup, security middleware and route registration
server/routes/       Air-data and chat validation, responses and provider integration
server/services/     Bounded upstream-response cache
server/index.ts      Environment loading and production/static server
tests/               Domain and API integration tests
```

The deterministic plan engine is shared by frontend and API. Network access is restricted to fixed upstream hosts. Runtime request validation uses Zod; body limits, per-IP rate limits, Helmet headers, bounded cache, provider timeouts and React's text escaping protect the API and UI. Search is debounced and abortable; air data is cached for ten minutes. City changes guard against stale request results. No database or paid air-data key is necessary for a local demo.

## Data, privacy and honest limits

- Initial air readings are an **illustrative winter-smog scenario**, never a current measurement. Network errors restore explicitly labeled demo readings and show a notice. Model outputs are not neighbourhood sensors, and outdoor AQI is not indoor AQI.
- Sources: [US EPA / AirNow AQI](https://www.airnow.gov/aqi/aqi-basics/), [EPA air-cleaner guide](https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home), [Open-Meteo](https://open-meteo.com/en/docs/air-quality-api), [CAMS](https://atmosphere.copernicus.eu/). Open-Meteo's free endpoint is intended for non-commercial usage; review provider licensing before commercial deployment.
- Carbon estimates use explicit **illustrative assumptions** of 0.17 kg CO₂/solo-car-km and 0.04 kg CO₂/rail-passenger-km, not verified local factors. Credit is shown only for a self-reported car-to-rail switch. No illness prevention or personal exposure reduction is fabricated.
- Household preferences, today's checklist and personal pledges stay in local storage. Chats remain in tab memory. When AI is enabled, chat and relevant context go to Google via the backend; the profile name is omitted. Google's API data handling terms apply. Do not submit sensitive medical information.
- Community commitments are personal, local features; there are no fabricated members, events, social counts or published posts.
- AI is not a clinician. Official local alerts and individual care plans take precedence. The symptom matcher is deliberately simple and cannot identify every emergency.

## Before public deployment

Use HTTPS, configure a trusted reverse proxy deliberately, add authentication and per-account usage quotas to protect Gemini spending, use a shared rate-limit store across replicas, and confirm provider licensing. The default server binds to loopback for local development. This submission does not claim production medical validation or real community coordination.
