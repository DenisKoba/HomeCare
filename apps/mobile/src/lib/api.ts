import { supabase } from './supabase';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/v1';

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = (await supabase?.auth.getSession())?.data.session;
  const headers = new Headers(init.headers);
  if (typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (session?.access_token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const problem = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new ApiRequestError(
      problem?.message ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }
  return response.json() as Promise<T>;
}
