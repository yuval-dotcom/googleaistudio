
import { supabase } from './supabaseConfig';

export interface EmailPayload {
  tenantName: string;
  address: string;
  unitName?: string;
  expiryDate: string;
  userEmail: string;
}

export const mailjetService = {
  sendLeaseReminder: async (payload: EmailPayload): Promise<{success: boolean, error?: string}> => {
    try {
      // We must explicitly use supabase.functions.invoke
      const { data, error } = await supabase.functions.invoke('send-lease-reminder', {
        body: payload,
      });

      // Handle network errors (e.g. function doesn't exist, CORS block)
      if (error) {
        console.error("Supabase Invoke Error:", error);
        return { 
          success: false, 
          error: error.message || "Could not connect to Edge Function. Is it deployed?" 
        };
      }

      // Handle logic errors returned by the function itself
      if (data && data.success === false) {
        return { 
          success: false, 
          error: data.error || "Mailjet failed to process request." 
        };
      }

      return { success: data?.success === true };
    } catch (e: any) {
      console.error("Mailjet service exception:", e);
      return { success: false, error: e.message };
    }
  }
};
