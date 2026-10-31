import dns from 'dns';
import { isDisposableEmail } from './disposableEmailDomains.js';
import logger from './logger.js';

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Well-known dummy or test domains
const BLOCKED_TEST_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'localhost',
  'invalid',
  'fake.com',
  'sample.com'
]);

/**
 * Validates syntax, disposable domains, and domain resolvability.
 * @param {string} email
 * @param {Object} options
 * @param {boolean} options.checkMx - Whether to perform DNS MX check (default false in tests, true in prod)
 * @returns {Promise<{ valid: boolean, error?: string, domain?: string }>}
 */
export async function validateEmail(email, options = {}) {
  const { checkMx = false } = options;

  if (!email || typeof email !== 'string') {
    const msg = 'Email address is required.';
    return { valid: false, error: msg, reason: msg };
  }

  const cleanEmail = email.toLowerCase().trim();

  // 1. Length checks
  if (cleanEmail.length > 254) {
    const msg = 'Email address cannot exceed 254 characters.';
    return { valid: false, error: msg, reason: msg };
  }

  const atIdx = cleanEmail.indexOf('@');
  if (atIdx <= 0 || atIdx !== cleanEmail.lastIndexOf('@')) {
    const msg = 'Please enter a valid email address.';
    return { valid: false, error: msg, reason: msg };
  }

  const localPart = cleanEmail.slice(0, atIdx);
  const domainPart = cleanEmail.slice(atIdx + 1);

  if (localPart.length > 64) {
    const msg = 'Email username cannot exceed 64 characters.';
    return { valid: false, error: msg, reason: msg };
  }

  if (domainPart.length > 253 || !domainPart.includes('.')) {
    const msg = 'Please enter a valid email domain.';
    return { valid: false, error: msg, reason: msg };
  }

  // 2. Syntax check
  if (!EMAIL_REGEX.test(cleanEmail)) {
    const msg = 'Please enter a valid email address format.';
    return { valid: false, error: msg, reason: msg };
  }

  // 3. Blocked test & reserved domains (bypassed in test environment or when allowTestDomains is true)
  const allowTestDomains = options.allowTestDomains || process.env.NODE_ENV === 'test';
  if (!allowTestDomains && BLOCKED_TEST_DOMAINS.has(domainPart)) {
    const msg = 'Please provide a valid personal or business email address.';
    return { valid: false, error: msg, reason: msg };
  }

  // 4. Disposable email blocklist check
  if (isDisposableEmail(domainPart)) {
    const msg = 'Disposable or temporary email addresses are not permitted. Please use a valid email.';
    return {
      valid: false,
      error: msg,
      reason: msg
    };
  }

  // 5. Optional DNS MX record verification (with timeout)
  if (checkMx && process.env.NODE_ENV !== 'test') {
    try {
      const mxRecords = await Promise.race([
        dns.promises.resolveMx(domainPart),
        new Promise((_, reject) => setTimeout(() => reject(new Error('DNS_TIMEOUT')), 2500))
      ]);

      if (!Array.isArray(mxRecords) || mxRecords.length === 0) {
        const msg = 'Email domain does not accept mail (no valid MX record found).';
        return { valid: false, error: msg, reason: msg };
      }
    } catch (dnsErr) {
      if (dnsErr.code === 'ENOTFOUND' || dnsErr.code === 'ENODATA') {
        const msg = 'The email domain does not exist or cannot receive mail.';
        return { valid: false, error: msg, reason: msg };
      }
      // DNS timeout or transient network issue: do not hard-block legitimate users
      logger.warn('[EmailValidator] DNS MX check bypassed due to lookup issue', {
        domain: domainPart,
        error: dnsErr.message
      });
    }
  }

  return { valid: true, email: cleanEmail, domain: domainPart };
}

export default validateEmail;
