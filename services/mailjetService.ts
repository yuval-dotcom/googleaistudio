/**
 * Lease reminder email. Previously used Supabase Edge Function.
 * To implement: add a POST /api/email/lease-reminder endpoint on the Node server
 * and call it from here (e.g. via fetch to same origin).
 */

export interface EmailPayload {
  tenantName: string;
  address: string;
  unitName?: string;
  expiryDate: string;
  userEmail: string;
}

export const mailjetService = {
  sendLeaseReminder: async (_payload: EmailPayload): Promise<{ success: boolean; error?: string }> => {
    // Not implemented on Node backend yet. Call your API when available.
    return { success: false, error: 'Lease reminder email is not configured. Add /api/email/lease-reminder on the server to enable.' };
  },
};
