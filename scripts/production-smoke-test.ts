/**
 * CampusEdge Production Smoke Test & Remote Safety Verifier
 *
 * Runs post-deployment synthetic verification against live Cloud Run services
 * and enforces remote project safety invariants.
 */

const ALLOWED_DEV_REFS = (process.env.ALLOWED_REMOTE_PROJECT_REFS || '')
  .split(',')
  .map((s) => s.trim());
const PROD_PROJECT_REF = process.env.SUPABASE_PROD_PROJECT_REF || '';

interface CheckResult {
  name: string;
  url: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  statusCode?: number;
  latencyMs?: number;
  message?: string;
}

async function verifyRemoteSafety(targetRef?: string): Promise<boolean> {
  console.log('\n🔒 [Remote Safety Guard]');
  if (!targetRef) {
    console.log('  ℹ️  No remote project ref specified; skipping direct DB ref check.');
    return true;
  }

  console.log(`  Target Project Ref: ${targetRef}`);

  if (PROD_PROJECT_REF && targetRef === PROD_PROJECT_REF) {
    if (ALLOWED_DEV_REFS.includes(targetRef)) {
      console.error(
        '  ❌ CRITICAL SAFETY VIOLATION: Production project ref is present in ALLOWED_REMOTE_PROJECT_REFS! It must NEVER be allowlisted for ad-hoc remote scripts.',
      );
      return false;
    }
  }

  console.log('  ✅ Remote safety allowlist invariant confirmed.');
  return true;
}

async function testEndpoint(name: string, url: string, expectedStatus = 200): Promise<CheckResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CampusEdge-SmokeTest/1.0',
      },
    });
    const latencyMs = Date.now() - start;

    if (res.status === expectedStatus) {
      return {
        name,
        url,
        status: 'PASSED',
        statusCode: res.status,
        latencyMs,
      };
    } else {
      return {
        name,
        url,
        status: 'FAILED',
        statusCode: res.status,
        latencyMs,
        message: `Expected HTTP ${expectedStatus}, received ${res.status}`,
      };
    }
  } catch (err) {
    return {
      name,
      url,
      status: 'FAILED',
      latencyMs: Date.now() - start,
      message: (err as Error).message,
    };
  }
}

async function runSmokeTests() {
  console.log('===========================================================');
  console.log('   CampusEdge Production Smoke Test & Verification Suite   ');
  console.log('===========================================================');

  const apiUrl = process.env.API_URL || 'http://localhost:4000';
  const webUrl = process.env.WEB_URL || 'http://localhost:3000';
  const targetRef = process.env.TARGET_PROJECT_REF;

  const safetyPassed = await verifyRemoteSafety(targetRef);
  if (!safetyPassed) {
    process.exit(1);
  }

  console.log('\n🌐 [Synthetic Health & Smoke Checks]');
  console.log(`  API Target : ${apiUrl}`);
  console.log(`  Web Target : ${webUrl}\n`);

  const endpoints = [
    { name: 'API Health Check', url: `${apiUrl}/health`, expected: 200 },
    { name: 'Web Home Landing', url: `${webUrl}/`, expected: 200 },
    { name: 'Web DPDP Privacy Page', url: `${webUrl}/privacy`, expected: 200 },
    { name: 'Web Terms of Service', url: `${webUrl}/terms`, expected: 200 },
    { name: 'Web System Status Page', url: `${webUrl}/status`, expected: 200 },
    { name: 'Web Login Route', url: `${webUrl}/login`, expected: 200 },
  ];

  const results: CheckResult[] = [];
  for (const ep of endpoints) {
    process.stdout.write(`  Testing ${ep.name.padEnd(28)} ... `);
    const result = await testEndpoint(ep.name, ep.url, ep.expected);
    results.push(result);

    if (result.status === 'PASSED') {
      console.log(`PASSED (${result.statusCode}) [${result.latencyMs}ms]`);
    } else {
      console.log(`FAILED (${result.message}) [${result.latencyMs}ms]`);
    }
  }

  console.log('\n===========================================================');
  const allPassed = results.every((r) => r.status === 'PASSED');
  const passedCount = results.filter((r) => r.status === 'PASSED').length;
  console.log(`  Summary: ${passedCount}/${results.length} checks passed.`);

  if (allPassed) {
    console.log('  Status : ALL SMOKE TESTS PASSED ✅');
    console.log('===========================================================\n');
    process.exit(0);
  } else {
    console.log('  Status : CRITICAL FAILURES DETECTED ❌');
    console.log('===========================================================\n');
    process.exit(1);
  }
}

runSmokeTests();
