// Environment-aware API Base URL configuration for Sanjeevani AI
// - LOCAL DEVELOPMENT (localhost / 127.0.0.1): Uses relative '/api/...' routed to local Vite backend middleware.
// - PRODUCTION (GitHub Pages -> Netlify Functions): Uses VITE_API_BASE_URL pointing to the public Netlify backend.
// IMPORTANT: VITE_API_BASE_URL is a public backend URL only. Never place GEMINI_API_KEY in any VITE_ variable.

const STORAGE_KEY = 'sanjeevani_api_base_url';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Allow optional ?apiBase=https://your-site.netlify.app query override for instant judge/deployment testing
    try {
      const params = new URLSearchParams(window.location.search);
      const queryApiBase = params.get('apiBase');
      if (queryApiBase && /^https?:\/\//i.test(queryApiBase.trim())) {
        const cleaned = queryApiBase.trim().replace(/\/+$/, '');
        window.localStorage?.setItem(STORAGE_KEY, cleaned);
        return cleaned;
      }
    } catch {
      // Ignore URLSearchParams / localStorage errors
    }

    // In local development (npm run dev on localhost/127.0.0.1), default to local Vite middleware
    // unless VITE_API_BASE_URL is explicitly forced on a non-dev build.
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (isLocalhost && (import.meta as any).env?.DEV) {
      const devRemote = (import.meta as any).env?.VITE_USE_REMOTE_API_IN_DEV;
      if (devRemote !== 'true') {
        return '';
      }
    }
  }

  const envBase =
    typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL
      ? String((import.meta as any).env.VITE_API_BASE_URL).trim()
      : '';

  if (envBase) {
    return envBase.replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage?.getItem(STORAGE_KEY);
      if (stored && /^https?:\/\//i.test(stored.trim())) {
        return stored.trim().replace(/\/+$/, '');
      }
    } catch {
      // Ignore storage errors
    }
  }

  return '';
}

export function buildApiUrl(apiPath: string): string {
  const normalizedPath = apiPath.startsWith('/') ? apiPath : `/${apiPath}`;
  const baseUrl = getApiBaseUrl();
  return baseUrl ? `${baseUrl}${normalizedPath}` : normalizedPath;
}
