export function formatAuthError(
  error: unknown,
  context: 'signup' | 'login' | 'magic-link',
): string {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Auth Error in ${context}]`, error);
  }

  const rawMsg =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : (error as { message?: string })?.message || '';

  const isNetworkError =
    rawMsg.includes('Failed to fetch') ||
    rawMsg.includes('NetworkError') ||
    rawMsg.includes('fetch failed') ||
    rawMsg.includes('Load failed') ||
    rawMsg.includes('ERR_CONNECTION') ||
    rawMsg.includes('ERR_NAME_NOT_RESOLVED') ||
    (error instanceof TypeError && rawMsg.includes('fetch'));

  if (isNetworkError) {
    return 'We could not reach the server. Check your internet connection and try again.';
  }

  const lower = rawMsg.toLowerCase();

  if (context === 'login') {
    if (
      lower.includes('invalid login credentials') ||
      lower.includes('invalid credentials') ||
      lower.includes('user not found') ||
      lower.includes('wrong password')
    ) {
      // Do not leak whether the account exists
      return 'Invalid email or password. Please try again.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Your email address has not been verified yet. Please check your inbox for the confirmation email.';
    }
  }

  if (context === 'signup') {
    if (lower.includes('user already registered') || lower.includes('already exists')) {
      return 'This email address is already registered. Please sign in instead.';
    }
    if (
      lower.includes('password') &&
      (lower.includes('weak') || lower.includes('short') || lower.includes('least'))
    ) {
      return 'Password does not meet the minimum security requirements.';
    }
  }

  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Too many requests. Please wait a moment before trying again.';
  }

  if (typeof rawMsg === 'string' && rawMsg.length > 0 && !rawMsg.startsWith('[object')) {
    return rawMsg;
  }

  return 'An unexpected authentication error occurred. Please try again.';
}
