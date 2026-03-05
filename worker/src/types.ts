export interface Env {
  DB: D1Database;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  SESSION_SECRET: string;
  STORACHA_KEY: string;
  STORACHA_PROOF: string;
  MJ_APIKEY_PUBLIC: string;
  MJ_APIKEY_PRIVATE: string;
  SENDER_EMAIL: string;
  RECIPIENT_EMAIL: string;
  FRONTEND_URL: string;
  ENVIRONMENT: string;
}

export interface SessionPayload {
  github_id: string;
  email: string;
  login: string;
  exp: number;
}
