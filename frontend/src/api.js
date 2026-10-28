import axios from 'axios';

// VITE_API_URL is set by Playwright to point at the E2E backend (port 4010).
export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api',
});
