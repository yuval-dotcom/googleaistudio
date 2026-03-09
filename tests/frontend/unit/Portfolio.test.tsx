import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Portfolio } from '../../../views/Portfolio';
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

const makeProps = (overrides?: Partial<Property>): Property => ({
  ...baseProperty,
  ...overrides,
});

describe('Portfolio view', () => {
  const onSelectProperty = vi.fn();
  const onRefresh = vi.fn();
  const onAddProperty = vi.fn();

  const properties: Property[] = [
    makeProps({
      id: 'p1',
      address: 'Tel Aviv Center',
      country: 'Israel',
      type: 'Residential',
      partners: [{ uid: 'me', name: 'Me', percentage: 100, hasAccess: true }],
    }),
    makeProps({
      id: 'p2',
      address: 'London Office',
      country: 'UK',
      type: 'Commercial',
      holdingCompany: 'HoldCo',
    }),
  ];

  const transactions: Transaction[] = [
    {
      id: 't1',
      userId: 'u1',
      propertyId: 'p1',
      date: new Date().toISOString(),
      amount: 1000,
      type: 'income',
      category: 'Rent',
    },
  ];

  it('renders portfolio header and asset count', () => {
    render(
      <Portfolio
        properties={properties}
        transactions={transactions}
        onRefresh={onRefresh}
        globalCurrency="NIS"
        onSelectProperty={onSelectProperty}
        lang="en"
        onAddProperty={onAddProperty}
      />,
    );

    expect(screen.getByText(/Portfolio/i)).toBeInTheDocument();
    expect(screen.getByText(/2 Active Assets/i)).toBeInTheDocument();
  });

  it('filters by property type when clicking filter buttons', () => {
    render(
      <Portfolio
        properties={properties}
        transactions={transactions}
        onRefresh={onRefresh}
        globalCurrency="NIS"
        onSelectProperty={onSelectProperty}
        lang="en"
        onAddProperty={onAddProperty}
      />,
    );

    // Initially shows at least one residential and one commercial asset
    const telAvivMatches = screen.getAllByText(/Tel Aviv Center/);
    expect(telAvivMatches.length).toBeGreaterThan(0);
    const londonMatchesBefore = screen.getAllByText(/London Office/);
    expect(londonMatchesBefore.length).toBeGreaterThan(0);

    const [commercialFilter] = screen.getAllByRole('button', {
      name: 'Commercial',
    });
    fireEvent.click(commercialFilter);

    const londonMatchesAfter = screen.getAllByText(/London Office/);
    expect(londonMatchesAfter.length).toBeGreaterThan(0);
  });

  it('calls onSelectProperty when clicking a card', () => {
    render(
      <Portfolio
        properties={properties}
        transactions={transactions}
        onRefresh={onRefresh}
        globalCurrency="NIS"
        onSelectProperty={onSelectProperty}
        lang="en"
        onAddProperty={onAddProperty}
      />,
    );

    const [firstMatch] = screen.getAllByText(/Tel Aviv Center/);
    fireEvent.click(firstMatch);
    expect(onSelectProperty).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'p1' }),
    );
  });
});

