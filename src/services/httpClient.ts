import axios, { AxiosRequestConfig } from 'axios';

export async function fetchWithRetry<T>(url: string, cfg?: AxiosRequestConfig, maxRetries = 3, baseDelay = 300) : Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      const res = await axios({ url, timeout: 8000, ...cfg });
      return res.data;
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 100);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
