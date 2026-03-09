import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../../../App';

const mockGetProperties = vi.fn();
const mockGetTransactions = vi.fn();
const mockGetCompanies = vi.fn();

vi.mock('../../../services/nodeApiDataService', () => ({
  nodeApiDataService: {
    getProperties: (...args: unknown[]) => mockGetProperties(...args),
    getTransactions: (...args: unknown[]) => mockGetTransactions(...args),
    getCompanies: (...args: unknown[]) => mockGetCompanies(...args),
  },
}));

vi.mock('../../../services/nodeAuthService', () => ({
  getMe: vi.fn().mockResolvedValue({ id: 'u1', email: 'test@example.com' }),
  clearToken: vi.fn(),
  setToken: vi.fn(),
}));

describe('App + React Query integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProperties.mockResolvedValue([
      {
        id: 'p1',
        userId: 'u1',
        address: 'Main St 1',
        country: 'Israel',
        type: 'Residential',
        currency: 'NIS',
        purchasePrice: 100,
        marketValue: 120,
        incomeTaxRate: 0,
        propertyTaxRate: 0,
      },
    ]);
    mockGetTransactions.mockResolvedValue([]);
    mockGetCompanies.mockResolvedValue([]);
  });

  function renderWithClient() {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );
  }

  it('fetches properties and transactions after user is resolved', async () => {
    renderWithClient();

    await waitFor(() => {
      expect(mockGetProperties).toHaveBeenCalled();
      expect(mockGetTransactions).toHaveBeenCalled();
    });

    // Once data is loaded, dashboard title should appear
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });
});

