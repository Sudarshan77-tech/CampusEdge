import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSeedTarget } from './seed-dev-users.validator';

describe('validateSeedTarget', () => {
  describe('Local environment verification', () => {
    it('accepts http://127.0.0.1:54321 with development env and safety flag', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'http://127.0.0.1:54321',
        nodeEnv: 'development',
        allowLocalDemoSeed: 'true',
      });
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.isLocal, true);
      assert.strictEqual(result.errorMessage, undefined);
    });

    it('accepts http://localhost:54321 with development env and safety flag', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'http://localhost:54321',
        nodeEnv: 'development',
        allowLocalDemoSeed: 'true',
      });
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.isLocal, true);
    });

    it('accepts local URL with trailing slash after normalization', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'http://127.0.0.1:54321/',
        nodeEnv: 'development',
        allowLocalDemoSeed: 'true',
      });
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.isLocal, true);
    });

    it('rejects local target when ALLOW_LOCAL_DEMO_SEED is missing', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'http://127.0.0.1:54321',
        nodeEnv: 'development',
        allowLocalDemoSeed: undefined,
      });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.isLocal, true);
      assert.match(result.errorMessage ?? '', /ALLOW_LOCAL_DEMO_SEED="true"/);
    });

    it('rejects local target when ALLOW_LOCAL_DEMO_SEED is false', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'http://127.0.0.1:54321',
        nodeEnv: 'development',
        allowLocalDemoSeed: 'false',
      });
      assert.strictEqual(result.valid, false);
      assert.match(result.errorMessage ?? '', /ALLOW_LOCAL_DEMO_SEED="true"/);
    });

    it('rejects local target when NODE_ENV is production', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'http://127.0.0.1:54321',
        nodeEnv: 'production',
        allowLocalDemoSeed: 'true',
      });
      assert.strictEqual(result.valid, false);
      assert.match(result.errorMessage ?? '', /NODE_ENV is "development"/);
    });

    it('rejects local target with unexpected port (e.g. db port 54322)', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'http://127.0.0.1:54322',
        nodeEnv: 'development',
        allowLocalDemoSeed: 'true',
      });
      assert.strictEqual(result.valid, false);
      assert.match(result.errorMessage ?? '', /must run on port 54321/);
    });

    it('rejects local target with HTTPS protocol (local kong is HTTP)', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'https://127.0.0.1:54321',
        nodeEnv: 'development',
        allowLocalDemoSeed: 'true',
      });
      assert.strictEqual(result.valid, false);
      assert.match(result.errorMessage ?? '', /must use HTTP protocol/);
    });
  });

  describe('Remote environment verification', () => {
    it('accepts allowlisted remote Supabase project ref with HTTPS', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'https://dtsqqzslthxsouwvywvh.supabase.co',
        nodeEnv: 'development',
        allowedRemoteProjectRefs: 'dtsqqzslthxsouwvywvh, otherproject',
      });
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.isLocal, false);
      assert.strictEqual(result.projectRef, 'dtsqqzslthxsouwvywvh');
    });

    it('rejects remote project ref not present in allowlist', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'https://unauthorizedref.supabase.co',
        nodeEnv: 'development',
        allowedRemoteProjectRefs: 'dtsqqzslthxsouwvywvh',
      });
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.projectRef, 'unauthorizedref');
      assert.match(result.errorMessage ?? '', /NOT in ALLOWED_REMOTE_PROJECT_REFS allowlist/);
    });

    it('rejects remote project ref when allowlist is empty', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'https://dtsqqzslthxsouwvywvh.supabase.co',
        nodeEnv: 'development',
        allowedRemoteProjectRefs: '',
      });
      assert.strictEqual(result.valid, false);
      assert.match(result.errorMessage ?? '', /NOT in ALLOWED_REMOTE_PROJECT_REFS allowlist/);
    });

    it('rejects unencrypted HTTP remote project URL', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'http://dtsqqzslthxsouwvywvh.supabase.co',
        nodeEnv: 'development',
        allowedRemoteProjectRefs: 'dtsqqzslthxsouwvywvh',
      });
      assert.strictEqual(result.valid, false);
      assert.match(result.errorMessage ?? '', /HTTPS protocol/);
    });

    it('rejects third-party non-Supabase domain even if HTTPS', () => {
      const result = validateSeedTarget({
        supabaseUrl: 'https://attacker.example.com',
        nodeEnv: 'development',
        allowedRemoteProjectRefs: 'attacker',
      });
      assert.strictEqual(result.valid, false);
      assert.match(result.errorMessage ?? '', /neither an authorized local instance/);
    });
  });

  describe('Invalid or empty inputs', () => {
    it('rejects empty supabase URL', () => {
      const result = validateSeedTarget({
        supabaseUrl: '',
      });
      assert.strictEqual(result.valid, false);
      assert.match(result.errorMessage ?? '', /must be defined/);
    });

    it('rejects malformed URL string', () => {
      const result = validateSeedTarget({
        supabaseUrl: '://invalid-url',
      });
      assert.strictEqual(result.valid, false);
      assert.match(result.errorMessage ?? '', /Invalid Supabase URL format/);
    });
  });
});
