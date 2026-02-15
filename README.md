<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1jviDTpVMtGV-uakToRHlmlpvZerNQIrC

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Copy [.env.example](.env.example) to `.env` or `.env.local` and set:
   - **VITE_SUPABASE_URL** / **VITE_SUPABASE_ANON_KEY** – for real auth and data (optional; you can use Demo Mode without these)
   - **GEMINI_API_KEY** – used only on the server for the AI features (never sent to the browser)
3. Run the app: `npm run dev`

The app runs at http://localhost:3000. AI requests go through `/api/ai` on the same server so the Gemini key never reaches the client.

## Production

1. `npm run build`
2. Set **GEMINI_API_KEY** (and optionally **PORT**) in the environment
3. `npm run start` – serves the built app and `/api/ai` (with rate limiting)

## Tests

- **Run tests (watch):** `npm run test`
- **Run tests once:** `npm run test:run`
- **Run tests with coverage:** `npm run test:coverage`

Tests use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/react). Unit tests cover `services/translationService` and `services/currencyService`; component tests cover the Login view (with mocked Supabase).
