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

---

## איך לוודא שהכל תקין (לוקאלית)

1. **התקנת חבילות:** `npm install`
2. **משתני סביבה:** וודא שקיים `.env` עם לפחות:
   - `DATABASE_URL` (למשל `file:./dev.db` ל-SQLite מקומי)
   - `GEMINI_API_KEY` (לפיצ'רים של AI)
3. **מסד נתונים:** `npx prisma generate` ואז `npx prisma migrate deploy` (או `npx prisma db push` לפיתוח).
4. **משתמש ל-seed:** צור משתמש אחת (הרשמה מהאפליקציה) או הוסף ידנית. אחר כך אפשר להריץ:  
   `npm run seed "data/mangeassests.xlsx" <האימייל-שלך>`
5. **טסטים:** `npm run test:run` – אם הכל עובר, הקוד והשירותים בסדר.
6. **הרצה:** `npm run dev` – גלוש ל־http://localhost:3000, התחבר, ובדוק נכסים/תשואות/העלאות וכו'.

אם כל השלבים עוברים והאפליקציה מגיבה כרגיל – הסביבה הלוקאלית תקינה.

---

## הרצה לא לוקאלית (Production)

1. **Build:** `npm run build`
2. **משתני סביבה** (חובה בסביבת production):
   - `DATABASE_URL` – חיבור למסד נתונים (ב-production עדיף PostgreSQL, לא SQLite).
   - `GEMINI_API_KEY` – מפתח ל־Gemini.
   - `JWT_SECRET` – מחרוזת סודית חזקה (לא להשאיר את ברירת המחדל).
   - `PORT` – (אופציונלי) פורט השרת, ברירת מחדל 3000.
3. **מסד נתונים:** באותו שרת/סביבה הרץ `npx prisma migrate deploy` מול ה־`DATABASE_URL` של production.
4. **הפעלת השרת:** `npm run start` (או `node server.js`).

האפליקציה תגיש את הקבצים מ־`dist/` ואת כל ה־API (כולל `/api/ai`, `/api/assets` וכו'). וודא שה־reverse proxy (אם יש) מפנה נכון ל־Node על ה־PORT שבחרת.
