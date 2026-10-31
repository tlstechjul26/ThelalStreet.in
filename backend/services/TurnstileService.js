import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

class TurnstileService {
  constructor() {
    this.secretKey = (process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '').trim();
  }

  /**
   * Verifies Cloudflare Turnstile token from client.
   * @param {string} token - The client Turnstile token
   * @param {string} [ip] - The client remote IP address
   * @returns {Promise<{ success: boolean, bypassed?: boolean, error?: string }>}
   */
  async verifyToken(token, ip = '') {
    const isTest = process.env.NODE_ENV === 'test';
    
    // Test mode or unconfigured in dev: bypass gracefully
    if (isTest || !this.secretKey) {
      return { success: true, bypassed: true };
    }

    // Dummy test tokens provided by Cloudflare documentation
    if (token === 'XXXX.DUMMY.TOKEN.XXXX' || token === '1x0000000000000000000000000000000AA') {
      return { success: true, bypassed: true };
    }

    if (!token || typeof token !== 'string') {
      return {
        success: false,
        error: 'Security verification failed. Please complete the CAPTCHA check.'
      };
    }

    try {
      const params = new URLSearchParams();
      params.append('secret', this.secretKey);
      params.append('response', token);
      if (ip) {
        params.append('remoteip', ip);
      }

      const res = await axios.post(TURNSTILE_VERIFY_URL, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 4000
      });

      if (res.data && res.data.success) {
        return { success: true };
      }

      logger.warn('[TurnstileService] Verification rejected', {
        errorCodes: res.data?.['error-codes']
      });

      return {
        success: false,
        error: 'Security challenge failed. Please verify you are human and try again.'
      };
    } catch (err) {
      logger.error('[TurnstileService] Verification network error', { error: err.message });
      // In production, fail-closed if Turnstile is unreachable
      if (process.env.NODE_ENV === 'production') {
        return {
          success: false,
          error: 'Security verification service temporarily unreachable. Please try again.'
        };
      }
      return { success: true, bypassed: true };
    }
  }
}

export const turnstileService = new TurnstileService();
export default turnstileService;
