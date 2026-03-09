import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PropertyDetail } from '../../../views/PropertyDetail';
import type { Property, Transaction } from '../../../types';

const baseProperty: Property = {
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
};

describe('PropertyDetail view', () => {
  const onBack = vi.fn();
  const onEdit = vi.fn();
  const onUpdate = vi.fn();

  const mockTransactions: Transaction[] = [
    {
      id: 't1',
      userId: 'u1',
      propertyId: 'p1',
      date: new Date().toISOString(),
      amount: 500,
      type: 'income',
      category: 'Rent',
    },
  ];

  const service = {
    getTransactions: vi.fn().mockResolvedValue(mockTransactions),
    getAsset: vi.fn().mockResolvedValue(baseProperty),
    uploadFile: vi.fn(),
    getSignedUrl: vi.fn(),
    updateProperty: vi.fn(),
    deleteStorageFile: vi.fn(),
    addUnit: vi.fn(),
    addOwnership: vi.fn(),
    addLoan: vi.fn(),
  };

  it('renders basic property info', () => {
    render(
      <PropertyDetail
        property={baseProperty}
        onBack={onBack}
        lang="en"
        onEdit={onEdit}
        onUpdate={onUpdate}
        service={service}
      />,
    );

    expect(
      screen.getByRole('heading', { name: /Main St 1/ }),
    ).toBeInTheDocument();
    const israelMatches = screen.getAllByText(/Israel/);
    expect(israelMatches.length).toBeGreaterThan(0);
  });

  it('fetches and shows transactions when history tab is selected', async () => {
    render(
      <PropertyDetail
        property={baseProperty}
        onBack={onBack}
        lang="en"
        onEdit={onEdit}
        onUpdate={onUpdate}
        service={service}
      />,
    );

    const [historyTab] = screen.getAllByRole('button', { name: /History/i });
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(service.getTransactions).toHaveBeenCalled();
      expect(screen.getByText(/Rent/)).toBeInTheDocument();
    });
  });
});

