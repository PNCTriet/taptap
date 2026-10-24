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

export function getEnvStatus(
  envSource: Record<string, string | undefined> = process.env
): EnvReadinessStatus {
  const publicResult = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: envSource.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: envSource.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: envSource.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  const serverResult = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: envSource.SUPABASE_SERVICE_ROLE_KEY,
  });

  const appUrl =
    envSource.NEXT_PUBLIC_APP_URL && envSource.NEXT_PUBLIC_APP_URL.startsWith("http")
      ? envSource.NEXT_PUBLIC_APP_URL
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
  envSource: Record<string, string | undefined> = process.env
): PublicEnv {
  return publicEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: envSource.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: envSource.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: envSource.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}

export function getServerEnv(
  envSource: Record<string, string | undefined> = process.env
): ServerEnv {
  return serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: envSource.SUPABASE_SERVICE_ROLE_KEY,
  });
}

export function validatePublicCode(code: unknown) {
  return publicCodeSchema.safeParse(code);
}
