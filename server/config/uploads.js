import os from 'os';
import path from 'path';

export function getUploadsDir() {
  if (process.env.VERCEL) {
    // /tmp is writable in Vercel serverless runtime
    return path.join(os.tmpdir(), 'uploads');
  }
  return path.resolve(process.cwd(), 'uploads');
}
