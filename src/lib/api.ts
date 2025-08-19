// API base URL - always use the Render backend
// Central API base URL. Ensure NEXT_PUBLIC_API_URL is set in Vercel env.
// The fallback placeholder should never be used in production.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://your-backend-url.onrender.com';

export async function fetcher<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    const data = await response.json();
    (error as any).status = response.status;
    (error as any).info = data;
    throw error;
  }

  return response.json();
}
