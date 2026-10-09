export interface SeedTargetValidationOptions {
  supabaseUrl?: string;
  nodeEnv?: string;
  allowLocalDemoSeed?: string;
  allowedRemoteProjectRefs?: string;
}

export interface SeedTargetValidationResult {
  valid: boolean;
  isLocal: boolean;
  projectRef?: string;
  errorMessage?: string;
}

export function validateSeedTarget(
  options: SeedTargetValidationOptions,
): SeedTargetValidationResult {
  const {
    supabaseUrl = '',
    nodeEnv = '',
    allowLocalDemoSeed = '',
    allowedRemoteProjectRefs = '',
  } = options;

  if (!supabaseUrl || !supabaseUrl.trim()) {
    return {
      valid: false,
      isLocal: false,
      errorMessage: 'NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL must be defined.',
    };
  }

  const normalizedUrl = supabaseUrl.trim().replace(/\/+$/, '');

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return {
      valid: false,
      isLocal: false,
      errorMessage: `Invalid Supabase URL format: "${supabaseUrl}".`,
    };
  }

  // 1. Local environment verification (127.0.0.1 or localhost)
  const isLocalHost = parsedUrl.hostname === '127.0.0.1' || parsedUrl.hostname === 'localhost';

  if (isLocalHost) {
    if (parsedUrl.protocol !== 'http:') {
      return {
        valid: false,
        isLocal: true,
        errorMessage: `Refusal: Local Supabase instance must use HTTP protocol (received: "${parsedUrl.protocol}").`,
      };
    }
    if (parsedUrl.port !== '54321') {
      return {
        valid: false,
        isLocal: true,
        errorMessage: `Refusal: Local Supabase instance must run on port 54321 (received: "${parsedUrl.port || 'default'}").`,
      };
    }
    if (nodeEnv !== 'development') {
      return {
        valid: false,
        isLocal: true,
        errorMessage: `Refusal: Local demo user seeding is only permitted when NODE_ENV is "development" (received: "${nodeEnv}").`,
      };
    }
    if (allowLocalDemoSeed !== 'true') {
      return {
        valid: false,
        isLocal: true,
        errorMessage: 'Refusal: Local demo user seeding requires ALLOW_LOCAL_DEMO_SEED="true".',
      };
    }
    return {
      valid: true,
      isLocal: true,
    };
  }

  // 2. Remote environment verification
  if (parsedUrl.protocol !== 'https:') {
    return {
      valid: false,
      isLocal: false,
      errorMessage: `Refusal: Remote Supabase URLs must use HTTPS protocol (received: "${supabaseUrl}").`,
    };
  }

  const remoteRegex = /^https:\/\/([a-z0-9]+)\.supabase\.co$/;
  const match = normalizedUrl.match(remoteRegex);
  if (!match) {
    return {
      valid: false,
      isLocal: false,
      errorMessage: `Refusal: URL "${supabaseUrl}" is neither an authorized local instance (http://127.0.0.1:54321) nor a standard remote Supabase project URL (https://<project-ref>.supabase.co).`,
    };
  }

  const projectRef = match[1];
  const allowedRefs = allowedRemoteProjectRefs
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  if (!allowedRefs.includes(projectRef)) {
    return {
      valid: false,
      isLocal: false,
      projectRef,
      errorMessage: `[Safety Refusal] Project ref "${projectRef}" is NOT in ALLOWED_REMOTE_PROJECT_REFS allowlist. Aborting.`,
    };
  }

  return {
    valid: true,
    isLocal: false,
    projectRef,
  };
}
