const TOKEN_KEY = "apex_token";

export function getToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}
