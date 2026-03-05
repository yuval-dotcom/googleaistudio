import fs from 'fs/promises';

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 200;
const REQUEST_TIMEOUT_MS = Number(process.env.DURABLE_UPLOAD_TIMEOUT_MS || 30000);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;
  return { url, serviceRoleKey, bucket };
}

export function isDurableUploadConfigured() {
  const { url, serviceRoleKey, bucket } = getSupabaseConfig();
  return Boolean(url && serviceRoleKey && bucket);
}

export async function uploadToDurableStorage({ localFilePath, objectPath, mimeType }) {
  const { url, serviceRoleKey, bucket } = getSupabaseConfig();
  if (!url || !serviceRoleKey || !bucket) {
    throw new Error('Durable upload is not configured');
  }

  const fileBuffer = await fs.readFile(localFilePath);
  const normalizedBase = url.replace(/\/+$/, '');
  const uploadUrl = `${normalizedBase}/storage/v1/object/${bucket}/${objectPath}`;
  const publicUrl = `${normalizedBase}/storage/v1/object/public/${bucket}/${objectPath}`;

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      let response;
      try {
        response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
            'Content-Type': mimeType || 'application/octet-stream',
            'x-upsert': 'true',
          },
          body: fileBuffer,
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      if (response.ok) {
        return { path: objectPath, url: publicUrl };
      }

      const bodyText = await response.text();
      const err = new Error(`Durable upload failed (${response.status}): ${bodyText}`);
      if (!RETRYABLE_STATUS.has(response.status)) {
        err.nonRetryable = true;
        throw err;
      }
      lastError = err;
    } catch (error) {
      if (error instanceof Error && error.nonRetryable) {
        throw error;
      }
      lastError = error instanceof Error ? error : new Error('Unknown durable upload error');
    }

    if (attempt < MAX_RETRIES) {
      await sleep(BASE_DELAY_MS * 2 ** (attempt - 1));
    }
  }

  throw lastError || new Error('Durable upload failed after retries');
}
