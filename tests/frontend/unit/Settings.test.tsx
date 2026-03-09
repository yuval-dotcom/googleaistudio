import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Settings } from '../../../views/Settings';
import { currencyService } from '../../../services/currencyService';
import type { Company } from '../../../types';

vi.mock('../../../services/currencyService', () => {
  const actual = vi.importActual('../../../services/currencyService') as any;
  return {
    currencyService: {
      ...actual.currencyService,
      getRates: vi.fn(() => ({ NIS: 1, USD: 3.75, EUR: 4.05 })),
      setRate: vi.fn(),
      fetchLiveRates: vi.fn().mockResolvedValue(undefined),
    },
  };
});

describe('Settings view', () => {
  const onBack = vi.fn();
  const onSave = vi.fn();
  const onLogout = vi.fn();

  const companies: Company[] = [
    { id: 'c1', name: 'HoldCo', userOwnership: 60 },
  ];

  const service = {
    getCompanies: vi.fn().mockResolvedValue(companies),
    saveCompany: vi
      .fn()
      .mockImplementation(async ({ name, userOwnership }: any) => ({
        id: 'c2',
        name,
        userOwnership,
      })),
    deleteCompany: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders settings header and logout button', async () => {
    render(
      <Settings
        onBack={onBack}
        onSave={onSave}
        onLogout={onLogout}
        lang="en"
        service={service}
        showServerLinks
        assetsCount={2}
      />,
    );

    await screen.findByText(/Settings/i);
    const logoutButtons = await screen.findAllByRole('button', {
      name: /log out/i,
    });
    expect(logoutButtons.length).toBeGreaterThan(0);
  });

  it('calls onLogout when logout button clicked', () => {
    render(
      <Settings
        onBack={onBack}
        onSave={onSave}
        onLogout={onLogout}
        lang="en"
        service={service}
      />,
    );

    const logoutButtons = screen.getAllByRole('button', { name: /log out/i });
    expect(logoutButtons.length).toBeGreaterThan(0);
    fireEvent.click(logoutButtons[logoutButtons.length - 1]);
    expect(onLogout).toHaveBeenCalled();
  });

  it('allows adding a company via form', async () => {
    render(
      <Settings
        onBack={onBack}
        onSave={onSave}
        onLogout={onLogout}
        lang="en"
        service={service}
      />,
    );

    const [nameInput] = screen.getAllByPlaceholderText(/Company Name/i);
    fireEvent.change(nameInput, { target: { value: 'NewCo' } });

    const [addButton] = screen.getAllByRole('button', { name: /add company/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(service.saveCompany).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'NewCo', userOwnership: 100 }),
      );
    });
  });
});

