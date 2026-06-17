import type { APIRequestContext } from "@playwright/test";
import { loginViaApi, type AuthSession } from "./auth";
import { getE2eEnv, getPersonaEmail, type E2ePersonaKey } from "./env";

export async function loginPersona(
  request: APIRequestContext,
  key: E2ePersonaKey
): Promise<AuthSession> {
  const env = getE2eEnv();
  return loginViaApi(request, env.personas[key], env.password);
}

export { getPersonaEmail };
