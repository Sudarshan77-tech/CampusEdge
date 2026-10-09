import { createClient } from '@supabase/supabase-js';

async function setupStorage() {
  console.info('=== Setting Up Private Storage Buckets ===');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const secretKey = process.env.SUPABASE_SECRET_KEY || '';
  const allowedRefs = (process.env.ALLOWED_REMOTE_PROJECT_REFS || '')
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);

  if (!supabaseUrl || !secretKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
    process.exit(1);
  }

  const projectRefMatch = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
  const currentRef = projectRefMatch ? projectRefMatch[1] : '';

  if (currentRef && !allowedRefs.includes(currentRef)) {
    console.error(`Refusal: Project ref "${currentRef}" is not in ALLOWED_REMOTE_PROJECT_REFS.`);
    process.exit(1);
  }

  console.info(`Target Project Ref: ${currentRef}`);

  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const bucketName = 'college-files';
  const { data: existingBucket, error: getError } = await supabase.storage.getBucket(bucketName);

  if (existingBucket) {
    console.info(`Bucket "${bucketName}" already exists and is configured.`);
    return;
  }

  if (
    getError &&
    !getError.message.includes('not found') &&
    !getError.message.includes('The resource was not found')
  ) {
    console.warn(`Bucket check notice: ${getError.message}. Attempting create...`);
  }

  const { data, error: createError } = await supabase.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: 5 * 1024 * 1024, // 5 MB
    allowedMimeTypes: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
    ],
  });

  if (createError) {
    if (createError.message.includes('already exists')) {
      console.info(`Bucket "${bucketName}" already exists.`);
      return;
    }
    console.error(`Failed to create bucket "${bucketName}":`, createError.message);
    process.exit(1);
  }

  console.info(`✓ Private bucket "${bucketName}" created successfully:`, data);
}

setupStorage().catch((err) => {
  console.error('Fatal in setupStorage:', err);
  process.exit(1);
});
