import { fetchApi, type FetchApiOptions } from "./fetchClient";

export async function apiGet<T>(path: string): Promise<T> {
  return fetchApi<T>("GET", path);
}
export async function apiPost<T>(
  path: string,
  body?: unknown,
  options?: Pick<FetchApiOptions, "credentials">,
): Promise<T> {
  return fetchApi<T>("POST", path, body, options);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return fetchApi<T>("PATCH", path, body);
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return fetchApi<T>("DELETE", path, body);
}
