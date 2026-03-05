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
   - `DATABASE_URL` (למשל Supabase pooler על פורט `6543`; ראו סעיף "Supabase + Prisma (stable flow)")
   - `DIRECT_URL` (למשל Supabase direct על פורט `5432`; נדרש ל-migrate/introspection)
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
   - `DIRECT_URL` – חיבור direct ל-PostgreSQL עבור Prisma migrate/introspection.
   - `GEMINI_API_KEY` – מפתח ל־Gemini.
   - `JWT_SECRET` – מחרוזת סודית חזקה (לא להשאיר את ברירת המחדל).
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` – חובה אם מעלים קבצים ב-Vercel (הקבצים מועלים ל-Supabase Storage ולא נשמרים מקומית).
   - `PORT` – (אופציונלי) פורט השרת, ברירת מחדל 3000.
3. **מסד נתונים:** באותו שרת/סביבה הרץ `npx prisma migrate deploy` מול ה־`DATABASE_URL` של production.
4. **הפעלת השרת:** `npm run start` (או `node server.js`).

האפליקציה תגיש את הקבצים מ־`dist/` ואת כל ה־API (כולל `/api/ai`, `/api/assets` וכו'). וודא שה־reverse proxy (אם יש) מפנה נכון ל־Node על ה־PORT שבחרת.

---

## Supabase + Prisma (stable flow)

> **חשוב:** ההנחיות בסעיף זה מחליפות את הדוגמאות הישנות של SQLite במסמך. בפרויקט הנוכחי עובדים עם PostgreSQL/Supabase, ולכן יש להגדיר `DATABASE_URL` (pooler, פורט `6543`, `pgbouncer=true`) ו-`DIRECT_URL` (direct, פורט `5432`).

### 1) משתני סביבה נדרשים
- `DATABASE_URL` = כתובת pooler של Supabase (פורט `6543`, עם `pgbouncer=true`) עבור runtime.
- `DIRECT_URL` = כתובת direct של Supabase (פורט `5432`) עבור migrate/introspection.

### 2) מעבר ראשוני מ-SQLite ל-PostgreSQL (חד-פעמי)
1. בצע גיבוי למסד לפני שינוי היסטוריית migrations.
2. ודא שב-`prisma/schema.prisma` יש:
   - `provider = "postgresql"`
   - `url = env("DATABASE_URL")`
   - `directUrl = env("DIRECT_URL")`
3. צור baseline migration ל-PostgreSQL (ב-repo).
4. בסביבת Supabase שכבר מכילה schema קיים, הרץ פעם אחת:
   - `npx prisma migrate resolve --applied <baseline_migration_name>`
5. אימות:
   - `npx prisma migrate status`
   - `npx prisma migrate deploy`

### 3) Deploy שוטף אחרי ה-baseline
1. `npx prisma generate`
2. `npx prisma migrate deploy`
3. `npm run build`
4. `npm run start`

אם `migrate status` מציג `Database schema is up to date` ו-`migrate deploy` מחזיר `No pending migrations to apply` — היישור תקין.
