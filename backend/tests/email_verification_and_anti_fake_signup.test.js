import assert from 'assert';
import http from 'http';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });

import User from '../models/User.js';
import emailService from '../services/EmailService.js';
import turnstileService from '../services/TurnstileService.js';
import { validateEmail } from '../utils/emailValidator.js';
import { isDisposableEmail } from '../utils/disposableEmailDomains.js';
import { getJwtSecret } from '../middleware/authMiddleware.js';

const PORT = 5001;

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      hostname: 'localhost',
      port: PORT,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-test-suite': 'true', // bypass IP rate limiter in tests
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function hashOtp(otp) {
  return crypto.createHmac('sha256', getJwtSecret()).update(String(otp).trim()).digest('hex');
}

console.log('================================================================');
console.log('  RUNNING MARKETPULSE EMAIL VERIFICATION & ANTI-FAKE SIGNUP TEST');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function itAsync(description, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
  }
}

async function runTests() {
  // Connect to MongoDB if not connected
  if (process.env.MONGO_URI && mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    } catch (e) {
      console.warn('MongoDB connection note:', e.message);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Disposable Email Domain Detection & Validation Tests
  // ─────────────────────────────────────────────────────────────
  console.log('--- 1. Disposable Email & Domain Detection ---');

  it('Identifies known burner/disposable email domains', () => {
    assert.strictEqual(isDisposableEmail('test@mailinator.com'), true);
    assert.strictEqual(isDisposableEmail('trader@tempmail.com'), true);
    assert.strictEqual(isDisposableEmail('bot@10minutemail.com'), true);
    assert.strictEqual(isDisposableEmail('fake@guerrillamail.com'), true);
    assert.strictEqual(isDisposableEmail('hacker@yopmail.com'), true);
    assert.strictEqual(isDisposableEmail('investor@gmail.com'), false);
    assert.strictEqual(isDisposableEmail('trader@marketpulse.in'), false);
    assert.strictEqual(isDisposableEmail('corp@yahoo.com'), false);
  });

  await itAsync('validateEmail rejects malformed and disposable addresses', async () => {
    const invalidSyntax = await validateEmail('not-an-email', { checkMx: false });
    assert.strictEqual(invalidSyntax.valid, false);

    const empty = await validateEmail('', { checkMx: false });
    assert.strictEqual(empty.valid, false);

    const disposable = await validateEmail('scammer@mailinator.com', { checkMx: false });
    assert.strictEqual(disposable.valid, false);
    const dispReason = (disposable.error || disposable.reason || '').toLowerCase();
    assert(dispReason.includes('disposable') || dispReason.includes('temporary'));

    const legitimate = await validateEmail('realuser@marketpulse.in', { checkMx: false });
    assert.strictEqual(legitimate.valid, true);
    assert.strictEqual(legitimate.email, 'realuser@marketpulse.in');
  });

  // ─────────────────────────────────────────────────────────────
  // 2. Anti-Bot / CAPTCHA Service Tests
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 2. Cloudflare Turnstile Anti-Bot Service ---');

  await itAsync('TurnstileService safely permits requests when secret is unset or in test mode', async () => {
    const res = await turnstileService.verifyToken('mock_test_token', '127.0.0.1');
    assert.strictEqual(res.success, true);
  });

  // ─────────────────────────────────────────────────────────────
  // 3. EmailService Dispatch & Masking Unit Tests
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 3. EmailService Delivery & Observability ---');

  it('EmailService masks email addresses correctly for logs', () => {
    assert.strictEqual(emailService.maskEmail('rahul@gmail.com'), 'ra***@gmail.com');
    assert.strictEqual(emailService.maskEmail('a@b.com'), 'a*@b.com');
    assert.strictEqual(emailService.maskEmail(''), '***');
  });

  await itAsync('EmailService dispatches 6-digit OTP and triggers test listener hook', async () => {
    let observed = null;
    const unsubscribe = emailService.onOtpDispatch((data) => {
      observed = data;
    });

    const res = await emailService.sendVerificationOtp('unit.test@marketpulse.in', '765432', 'Unit Tester');
    assert.strictEqual(res.success, true);
    assert.ok(observed);
    assert.strictEqual(observed.email, 'unit.test@marketpulse.in');
    assert.strictEqual(observed.otp, '765432');
    assert.strictEqual(observed.name, 'Unit Tester');

    unsubscribe();
  });

  // ─────────────────────────────────────────────────────────────
  // 4. User Registration Flow & Anti-Fake Signup HTTP API
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 4. Registration Flow & Anti-Fake Signup HTTP API ---');

  const testEmail = `verify.trader.${Date.now()}@marketpulse.in`;
  const testPassword = 'StrongPassword2026!';
  const testName = 'Verification Tester';

  // Cleanup test user if exists
  await User.deleteMany({ email: testEmail });

  await itAsync('Rejects signup with disposable email via HTTP API', async () => {
    const res = await request(
      { path: '/api/auth/signup', method: 'POST' },
      { email: 'fakeuser@mailinator.com', password: 'StrongPassword123!', name: 'Fake' }
    );
    assert.strictEqual(res.status, 400);
    const err = (res.body?.error || '').toLowerCase();
    assert(err.includes('disposable') || err.includes('temporary'));
  });

  await itAsync('Rejects signup with invalid email format', async () => {
    const res = await request(
      { path: '/api/auth/signup', method: 'POST' },
      { email: 'invalid-email-address', password: 'StrongPassword123!', name: 'Invalid' }
    );
    assert.strictEqual(res.status, 400);
    const err = (res.body?.error || '').toLowerCase();
    assert(err.includes('valid email'));
  });

  await itAsync('Rejects signup with weak password (< 8 chars)', async () => {
    const res = await request(
      { path: '/api/auth/signup', method: 'POST' },
      { email: 'shortpass@marketpulse.in', password: 'short', name: 'Short' }
    );
    assert.strictEqual(res.status, 400);
    const err = (res.body?.error || '').toLowerCase();
    assert(err.includes('at least 8'));
  });

  await itAsync('Signs up user with pending verification and securely hashes OTP in DB', async () => {
    const res = await request(
      { path: '/api/auth/signup', method: 'POST' },
      { email: testEmail, password: testPassword, name: testName }
    );

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.requiresVerification, true);
    assert.strictEqual(res.body.email, testEmail);
    // CRITICAL: Full JWT session token must NOT be returned before email verification
    assert.strictEqual(res.body.token, undefined);

    // Verify DB user state
    const dbUser = await User.findOne({ email: testEmail });
    assert.ok(dbUser, 'User must exist in DB');
    assert.strictEqual(dbUser.isEmailVerified, false, 'isEmailVerified must be false');
    assert.strictEqual(dbUser.status, 'pending_verification', 'Status must be pending_verification');
    assert.ok(dbUser.emailOtpHash, 'emailOtpHash must be stored in DB');
    assert.strictEqual(dbUser.emailOtpHash.length, 64, 'HMAC SHA-256 hash must be 64 hex characters');
    assert.ok(dbUser.emailOtpExpiresAt > new Date(), 'Expiry must be in the future');
  });

  // ─────────────────────────────────────────────────────────────
  // 5. Block Login for Unverified Users
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 5. Unverified Account Login Protection ---');

  await itAsync('Blocks unverified user login with HTTP 403 and verification challenge', async () => {
    const res = await request(
      { path: '/api/auth/login', method: 'POST' },
      { email: testEmail, password: testPassword }
    );

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.requiresVerification, true);
    assert.strictEqual(res.body.email, testEmail);
    assert.strictEqual(res.body.token, undefined, 'No token issued to unverified user');
    assert(res.body.error.includes('Email verification required'));
  });

  // ─────────────────────────────────────────────────────────────
  // 6. OTP Validation, Attempt Limits & Timing-Safe Verification
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 6. OTP Verification & Attempt Limits ---');

  await itAsync('Rejects non-6-digit OTP code', async () => {
    const res = await request(
      { path: '/api/auth/verify-email', method: 'POST' },
      { email: testEmail, code: '123' }
    );
    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('6 digits'));
  });

  await itAsync('Rejects incorrect 6-digit OTP code and increments attempts', async () => {
    const res = await request(
      { path: '/api/auth/verify-email', method: 'POST' },
      { email: testEmail, code: '000000' }
    );

    assert.strictEqual(res.status, 400);
    assert(res.body.error.includes('Invalid verification code'));

    const dbUser = await User.findOne({ email: testEmail });
    assert.strictEqual(dbUser.emailOtpAttempts, 1);
  });

  // ─────────────────────────────────────────────────────────────
  // 7. OTP Expiry Handling (5-Minute Window)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 7. OTP Expiry Enforcement ---');

  await itAsync('Rejects expired OTP with HTTP 410', async () => {
    // Set expiry to past
    await User.updateOne({ email: testEmail }, { emailOtpExpiresAt: new Date(Date.now() - 10000) });

    const res = await request(
      { path: '/api/auth/verify-email', method: 'POST' },
      { email: testEmail, code: '123456' }
    );

    assert.strictEqual(res.status, 410);
    assert(res.body.error.toLowerCase().includes('expired'));
  });

  // ─────────────────────────────────────────────────────────────
  // 8. OTP Resend Flow & Cooldown (60s)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 8. OTP Resend Cooldown & Delivery ---');

  await itAsync('Enforces 60-second cooldown on OTP resend', async () => {
    // Ensure last sent timestamp is within 60s
    await User.updateOne({ email: testEmail }, { emailOtpLastSentAt: new Date() });

    const res = await request(
      { path: '/api/auth/resend-otp', method: 'POST' },
      { email: testEmail }
    );

    assert.strictEqual(res.status, 429);
    assert(res.body.error.includes('Please wait'));
    assert.ok(res.body.cooldownSeconds > 0);
  });

  await itAsync('Permits OTP resend after cooldown expires and regenerates OTP hash in DB', async () => {
    const beforeUser = await User.findOne({ email: testEmail });
    const oldHash = beforeUser.emailOtpHash;

    // Simulate cooldown expiration (last sent 65 seconds ago)
    await User.updateOne({ email: testEmail }, { emailOtpLastSentAt: new Date(Date.now() - 65000) });

    const res = await request(
      { path: '/api/auth/resend-otp', method: 'POST' },
      { email: testEmail }
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const dbUser = await User.findOne({ email: testEmail });
    assert.strictEqual(dbUser.emailOtpAttempts, 0, 'Attempts reset on new OTP');
    assert.notStrictEqual(dbUser.emailOtpHash, oldHash, 'New OTP hash must be generated');
    assert.ok(dbUser.emailOtpExpiresAt > new Date());
  });

  // ─────────────────────────────────────────────────────────────
  // 9. Successful Email Verification & Account Activation
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 9. Successful Verification & Activation ---');

  const knownOtp = '543210';
  await User.updateOne(
    { email: testEmail },
    {
      emailOtpHash: hashOtp(knownOtp),
      emailOtpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      emailOtpAttempts: 0
    }
  );

  let activeSessionToken = null;

  await itAsync('Verifies correct OTP, activates account, and issues full JWT token', async () => {
    const res = await request(
      { path: '/api/auth/verify-email', method: 'POST' },
      { email: testEmail, code: knownOtp }
    );

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token, 'Must return JWT token');
    assert.strictEqual(res.body.user.email, testEmail);
    assert.strictEqual(res.body.user.isEmailVerified, true);
    assert.strictEqual(res.body.user.status, 'active');

    activeSessionToken = res.body.token;

    // Check DB state
    const dbUser = await User.findOne({ email: testEmail });
    assert.strictEqual(dbUser.isEmailVerified, true);
    assert.strictEqual(dbUser.status, 'active');
    assert.strictEqual(dbUser.emailOtpHash, null, 'OTP hash cleared on success');
    assert.strictEqual(dbUser.emailOtpExpiresAt, null);
  });

  // ─────────────────────────────────────────────────────────────
  // 10. Verified User Login without OTP Challenge
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 10. Verified User Login ---');

  await itAsync('Allows verified user to log in immediately without OTP challenge', async () => {
    const res = await request(
      { path: '/api/auth/login', method: 'POST' },
      { email: testEmail, password: testPassword }
    );

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token, 'Must return JWT token');
    assert.strictEqual(res.body.user.email, testEmail);
    assert.strictEqual(res.body.user.isEmailVerified, true);
    assert.strictEqual(res.body.requiresVerification, undefined);
  });

  await itAsync('Calling resend-otp for verified user returns HTTP 400', async () => {
    const res = await request(
      { path: '/api/auth/resend-otp', method: 'POST' },
      { email: testEmail }
    );

    assert.strictEqual(res.status, 400);
    assert(res.body.error.toLowerCase().includes('already verified'));
  });

  // ─────────────────────────────────────────────────────────────
  // 11. Profile & Session Verification
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- 11. Authenticated Session & Profile Inspection ---');

  await itAsync('/auth/me returns verified email status', async () => {
    const res = await request({
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${activeSessionToken}` }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.user.email, testEmail);
    assert.strictEqual(res.body.user.isEmailVerified, true);
    assert.strictEqual(res.body.user.status, 'active');
  });

  // Cleanup test user
  await User.deleteMany({ email: testEmail });

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log(`TEST SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
