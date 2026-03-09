import { describe, it, expect } from 'vitest';
import { notificationService } from '../../../services/notificationService';
import type { Property, PropertyUnit, Lease } from '../../../types';

const makeLease = (daysFromNow: number, monthlyRent: number): Lease => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return {
    tenantName: 'Tenant',
    monthlyRent,
    expirationDate: date.toISOString(),
  };
};

describe('notificationService.getExpiringLeases', () => {
  it('returns empty array when there are no leases', () => {
    const properties: Property[] = [
      {
        id: 'p1',
        userId: 'u1',
        address: 'No Lease St',
        country: 'Israel',
        type: 'Residential',
        currency: 'NIS',
        purchasePrice: 0,
        marketValue: 0,
        incomeTaxRate: 0,
        propertyTaxRate: 0,
      },
    ];
    const result = notificationService.getExpiringLeases(properties);
    expect(result).toEqual([]);
  });

  it('detects main lease expiring within 60 days', () => {
    const lease = makeLease(30, 5000);
    const properties: Property[] = [
      {
        id: 'p1',
        userId: 'u1',
        address: 'Main Lease St',
        country: 'Israel',
        type: 'Residential',
        currency: 'NIS',
        purchasePrice: 0,
        marketValue: 0,
        incomeTaxRate: 0,
        propertyTaxRate: 0,
        lease,
      },
    ];

    const result = notificationService.getExpiringLeases(properties);
    expect(result).toHaveLength(1);
    expect(result[0].address).toBe('Main Lease St');
    expect(result[0].tenantName).toBe('Tenant');
    expect(result[0].monthlyRent).toBe(5000);
  });

  it('detects unit-level lease expiring within 60 days', () => {
    const unitLease = makeLease(10, 3000);
    const properties: Property[] = [
      {
        id: 'p1',
        userId: 'u1',
        address: 'Units Mall',
        country: 'Israel',
        type: 'Commercial',
        currency: 'NIS',
        purchasePrice: 0,
        marketValue: 0,
        incomeTaxRate: 0,
        propertyTaxRate: 0,
        units: [
          {
            id: 'u1',
            name: 'Unit A',
            lease: unitLease,
          },
        ],
      },
    ];

    const result = notificationService.getExpiringLeases(properties);
    expect(result).toHaveLength(1);
    expect(result[0].address).toBe('Units Mall');
    expect(result[0].unitName).toBe('Unit A');
    expect(result[0].tenantName).toBe('Tenant');
  });
});

