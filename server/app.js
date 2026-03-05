import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { requireAuth } from './middleware/authMiddleware.js';
import aiRouter from './routes/aiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import assetRoutes from './routes/assetRoutes.js';
import unitRoutes from './routes/unitRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import ownershipRoutes from './routes/ownershipRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import bankAccountRoutes from './routes/bankAccountRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Absolute path to Vite build output (works from any cwd)
const distPath = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');
const hasDist = fs.existsSync(distPath) && fs.existsSync(indexPath);

// Create and configure the Express application
export const app = express();

// Global middleware
app.use(express.json());

// API overview – open http://localhost:3000/api in the browser to see all endpoints
app.get('/api', (req, res) => {
  res.json({
    message: 'RE Investor Pro – Server API',
    baseUrl: `${req.protocol}://${req.get('host')}`,
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register (body: email, password, name?) → { user, token }',
        'POST /api/auth/login': 'Login (body: email, password) → { user, token }',
        'GET /api/auth/me': 'Current user (Header: Authorization Bearer <token>)',
        'GET /api/auth/users': 'List all users (dev only; 404 in production)',
      },
      ai: {
        'POST /api/ai': 'Generate AI text or stream (body: prompt, systemInstruction?, stream?)',
      },
      assets: {
        'GET /api/assets': 'List all assets',
        'GET /api/assets/:id': 'Get one asset (with units, ownerships, loans, transactions)',
        'GET /api/assets/:id/projection': '5-year cash flow projection (query: years?)',
        'GET /api/assets/:id/ownership-income': 'Income per ownership entity',
        'POST /api/assets': 'Create asset (body: name, type, purchaseYear?, purchasePrice?, currentValue?)',
        'PUT /api/assets/:id': 'Update asset',
        'DELETE /api/assets/:id': 'Delete asset',
      },
      units: {
        'GET /api/assets/:assetId/units': 'List units of an asset',
        'GET /api/assets/:assetId/units/:unitId': 'Get one unit',
        'POST /api/assets/:assetId/units': 'Create unit (body: description, sizeSqm?, status?)',
        'PUT /api/assets/:assetId/units/:unitId': 'Update unit',
        'DELETE /api/assets/:assetId/units/:unitId': 'Delete unit',
      },
      contracts: {
        'GET /api/units/:unitId/contracts': 'List contracts of a unit',
        'GET /api/units/:unitId/contracts/:contractId': 'Get one contract',
        'POST /api/units/:unitId/contracts': 'Create contract (body: monthlyRent, tenantName?, startDate?, endDate?, fileUrl?)',
        'PUT /api/units/:unitId/contracts/:contractId': 'Update contract',
        'DELETE /api/units/:unitId/contracts/:contractId': 'Delete contract',
      },
      loans: {
        'GET /api/assets/:assetId/loans': 'List loans of an asset',
        'GET /api/assets/:assetId/loans/:loanId': 'Get one loan',
        'POST /api/assets/:assetId/loans': 'Create loan (body: originalAmount, currentBalance, monthlyPayment, principalPayment, interestPayment)',
        'PUT /api/assets/:assetId/loans/:loanId': 'Update loan',
        'DELETE /api/assets/:assetId/loans/:loanId': 'Delete loan',
      },
      ownerships: {
        'GET /api/assets/:assetId/ownerships': 'List ownerships of an asset',
        'GET /api/assets/:assetId/ownerships/:ownershipId': 'Get one ownership',
        'POST /api/assets/:assetId/ownerships': 'Create ownership (body: entityName, percentage)',
        'PUT /api/assets/:assetId/ownerships/:ownershipId': 'Update ownership',
        'DELETE /api/assets/:assetId/ownerships/:ownershipId': 'Delete ownership',
      },
      deals: {
        'GET /api/deals': 'List analyzed potential deals (each with metrics)',
        'GET /api/deals/:id': 'Get a single potential deal + metrics',
        'POST /api/deals': 'Create and analyze potential deal (body: name, assetType, purchasePrice, equityAmount, loanAmount?, interestRate?, holdYears?, expectedRent?, expectedOccupancy?, operatingExpenses?, location?)',
      },
      transactions: {
        'GET /api/transactions': 'List all transactions (query: ?assetId= to filter)',
        'GET /api/transactions/:id': 'Get one transaction',
        'POST /api/transactions': 'Create transaction (body: assetId, type, amount, date?, description?)',
        'PUT /api/transactions/:id': 'Update transaction',
        'DELETE /api/transactions/:id': 'Delete transaction',
      },
      upload: {
        'POST /api/upload': 'Upload file (multipart file; returns { url, id, name, path, uploadedAt })',
      },
      alerts: {
        'GET /api/alerts': 'List alerts for current user (lease expiries and possible payment delays)',
      },
      bankAccounts: {
        'GET /api/bank-accounts': 'List bank accounts (query: ?assetId= to filter, scoped by current user)',
        'POST /api/bank-accounts': 'Create bank account (body: assetId?, bankName?, accountName?, accountRef?, currency?)',
        'DELETE /api/bank-accounts/:id': 'Delete bank account',
      },
    },
    note: 'Protected routes (assets, transactions, units, etc.) require header: Authorization Bearer <token>',
  });
});

// API routes (before static so /api/* is handled here)
app.use('/api/ai', aiRouter);
app.use('/api/auth', authRoutes);
app.use('/api/assets', requireAuth, assetRoutes);
app.use('/api/assets/:assetId/units', requireAuth, unitRoutes);
app.use('/api/units/:unitId/contracts', requireAuth, contractRoutes);
app.use('/api/assets/:assetId/loans', requireAuth, loanRoutes);
app.use('/api/assets/:assetId/ownerships', requireAuth, ownershipRoutes);
app.use('/api/transactions', requireAuth, transactionRoutes);
app.use('/api/upload', requireAuth, uploadRoutes);
app.use('/api/deals', requireAuth, dealRoutes);
app.use('/api/alerts', requireAuth, alertRoutes);
app.use('/api/bank-accounts', requireAuth, bankAccountRoutes);

// Uploaded files (serve from project root uploads/)
const uploadsPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));

// Static assets (Vite build output)
if (hasDist) {
  app.use(express.static(distPath));
}

// SPA fallback – serve index.html for all remaining routes (or helpful message if no build)
app.get('*', (req, res) => {
  if (hasDist) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send(`
      <!DOCTYPE html>
      <html><head><meta charset="utf-8"><title>Build required</title></head>
      <body style="font-family:sans-serif;padding:2rem;max-width:480px;">
        <h1>Build required</h1>
        <p>The <code>dist</code> folder is missing. Run in the project root:</p>
        <pre style="background:#eee;padding:1rem;border-radius:8px;">npm run build</pre>
        <p>Then restart the server: <code>npm run start</code></p>
      </body></html>
    `);
  }
});

