import { z } from "zod";

const PLACEHOLDER_URL = "https://your-project-ref.supabase.co";
const PLACEHOLDER_ANON_KEY = "sb_publishable_replace_with_your_anon_or_publishable_key";
const PLACEHOLDER_SERVICE_KEY = "sb_secret_replace_with_your_service_role_key";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL")
    .default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL")
    .refine((val) => val !== PLACEHOLDER_URL, {
      message: "NEXT_PUBLIC_SUPABASE_URL is still set to the .env.example placeholder",
    }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(16, "NEXT_PUBLIC_SUPABASE_ANON_KEY must be at least 16 characters")
    .refine((val) => val !== PLACEHOLDER_ANON_KEY, {
      message: "NEXT_PUBLIC_SUPABASE_ANON_KEY is still set to the .env.example placeholder",
    }),
});

export const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(16, "SUPABASE_SERVICE_ROLE_KEY must be at least 16 characters")
    .refine((val) => val !== PLACEHOLDER_SERVICE_KEY, {
      message: "SUPABASE_SERVICE_ROLE_KEY is still set to the .env.example placeholder",
    }),
});

export const publicCodeSchema = z
  .string()
  .trim()
  .min(6, "Tag public code must be at least 6 characters")
  .max(64, "Tag public code must be at most 64 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Tag public code may only contain letters, numbers, hyphens, and underscores");

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export interface EnvReadinessStatus {
  appUrl: string;
  publicEnvConfigured: boolean;
  serverEnvConfigured: boolean;
  mode: "supabase-live" | "pilot-seed-preview";
  publicEnvIssues: string[];
  serverEnvIssues: string[];
}

function readPublicEnvValues(envSource?: Record<string, string | undefined>) {
  if (envSource) {
    return {
      NEXT_PUBLIC_APP_URL: envSource.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
      NEXT_PUBLIC_SUPABASE_URL: envSource.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: envSource.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };
  }
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function isSupabasePublicEnvConfigured(
  envSource?: Record<string, string | undefined>
): boolean {
  return publicEnvSchema.safeParse(readPublicEnvValues(envSource)).success;
}

export function getEnvStatus(
  envSource?: Record<string, string | undefined>
): EnvReadinessStatus {
  const rawPublic = readPublicEnvValues(envSource);
  const publicResult = publicEnvSchema.safeParse(rawPublic);

  const rawServiceKey = envSource
    ? envSource.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY;

  const serverResult = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: rawServiceKey,
  });

  const appUrl =
    rawPublic.NEXT_PUBLIC_APP_URL && rawPublic.NEXT_PUBLIC_APP_URL.startsWith("http")
      ? rawPublic.NEXT_PUBLIC_APP_URL
      : "http://localhost:3000";

  return {
    appUrl,
    publicEnvConfigured: publicResult.success,
    serverEnvConfigured: serverResult.success,
    mode: publicResult.success ? "supabase-live" : "pilot-seed-preview",
    publicEnvIssues: publicResult.success
      ? []
      : publicResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
    serverEnvIssues: serverResult.success
      ? []
      : serverResult.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
  };
}

export function getPublicEnv(
  envSource?: Record<string, string | undefined>
): PublicEnv {
  return publicEnvSchema.parse(readPublicEnvValues(envSource));
}

export function getServerEnv(
  envSource?: Record<string, string | undefined>
): ServerEnv {
  const rawServiceKey = envSource
    ? envSource.SUPABASE_SERVICE_ROLE_KEY
    : process.env.SUPABASE_SERVICE_ROLE_KEY;
  return serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: rawServiceKey,
  });
}

export function validatePublicCode(code: unknown) {
  return publicCodeSchema.safeParse(code);
}

/**
 * Validates that `next` is a safe internal relative path (starts with `/` and not `//` or `/\`).
 * Falls back to `/passport` when missing or unsafe.
 */
export function sanitizeNextPath(rawNext: string | null | undefined): string {
  if (!rawNext) return "/passport";
  const trimmed = rawNext.trim();
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes("\0")
  ) {
    return "/passport";
  }
  return trimmed;
}
