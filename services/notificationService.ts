
import { Property, PropertyUnit } from '../types';

export interface ExpiringLease {
  address: string;
  unitName?: string;
  tenantName: string;
  expiryDate: string;
  daysRemaining: number;
  monthlyRent: number;
  currency: string;
}

export const notificationService = {
  getExpiringLeases: (properties: Property[]): ExpiringLease[] => {
    const expiring: ExpiringLease[] = [];
    const today = new Date();
    const threshold = 60; // 60 days (2 months)

    properties.forEach(p => {
      // Check main lease
      if (p.lease && p.lease.expirationDate) {
        const exp = new Date(p.lease.expirationDate);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= threshold && diffDays >= 0) {
          expiring.push({
            address: p.address,
            tenantName: p.lease.tenantName,
            expiryDate: p.lease.expirationDate,
            daysRemaining: diffDays,
            monthlyRent: p.lease.monthlyRent,
            currency: p.currency
          });
        }
      }

      // Check units
      if (p.units && p.units.length > 0) {
        p.units.forEach(u => {
          if (u.lease && u.lease.expirationDate) {
            const exp = new Date(u.lease.expirationDate);
            const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays <= threshold && diffDays >= 0) {
              expiring.push({
                address: p.address,
                unitName: u.name,
                tenantName: u.lease.tenantName,
                expiryDate: u.lease.expirationDate,
                daysRemaining: diffDays,
                monthlyRent: u.lease.monthlyRent,
                currency: p.currency
              });
            }
          }
        });
      }
    });

    return expiring.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }
};
