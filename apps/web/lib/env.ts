import { z } from 'zod';

const urlSchema = z
  .string({
    required_error: 'NEXT_PUBLIC_SUPABASE_URL is missing.',
  })
  .min(1, 'NEXT_PUBLIC_SUPABASE_URL cannot be empty.')
  .refine(
    (val) => !val.includes('[') && !val.includes(']') && !val.includes('(') && !val.includes(')'),
    {
      message:
        'NEXT_PUBLIC_SUPABASE_URL must not contain Markdown brackets or parentheses. Found markdown-like formatting.',
    },
  )
  .refine((val) => !val.includes(' '), {
    message: 'NEXT_PUBLIC_SUPABASE_URL must not contain spaces.',
  })
  .refine((val) => !val.startsWith('"') && !val.startsWith("'"), {
    message: 'NEXT_PUBLIC_SUPABASE_URL must not include quotes in .env file.',
  })
  .refine((val) => !val.endsWith('/'), {
    message:
      'NEXT_PUBLIC_SUPABASE_URL must not contain a trailing slash (e.g. use https://your-ref.supabase.co).',
  })
  .refine(
    (val) => {
      try {
        const parsed = new URL(val);
        return parsed.protocol === 'https:' || parsed.protocol === 'http:';
      } catch {
        return false;
      }
    },
    {
      message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid HTTP or HTTPS URL.',
    },
  );

const publishableKeySchema = z
  .string({
    required_error: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.',
  })
  .min(1, 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY cannot be empty.')
  .refine((val) => !val.includes(' ') && !val.includes('\t') && !val.includes('\n'), {
    message: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must not contain whitespace.',
  })
  .refine((val) => !val.startsWith('"') && !val.startsWith("'"), {
    message: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must not include quotes in .env file.',
  })
  .refine((val) => val.startsWith('sb_publishable_'), {
    message:
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must start with "sb_publishable_". Check your Supabase API keys.',
  });

export const webEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: urlSchema,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKeySchema,
  NEXT_PUBLIC_API_URL: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          const parsed = new URL(val);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'NEXT_PUBLIC_API_URL must be a valid URL if specified.' },
    ),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function validateWebEnv(env: Record<string, string | undefined>): WebEnv {
  const result = webEnvSchema.safeParse(env);
  if (!result.success) {
    const errorDetails = result.error.errors.map((e) => `• ${e.message}`).join('\n');
    throw new Error(
      `[CampusEdge Web Environment Validation Failed]\n${errorDetails}\n\nPlease check your apps/web/.env.local configuration.`,
    );
  }
  return result.data;
}

let cachedEnv: WebEnv | null = null;

export function getWebEnv(): WebEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  };

  cachedEnv = validateWebEnv(env);
  return cachedEnv;
}
