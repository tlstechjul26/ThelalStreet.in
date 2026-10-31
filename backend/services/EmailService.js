import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.testListeners = []; // Used by automated test suites to verify email dispatch
    this._initTransporter();
  }

  _initTransporter() {
    const host = (process.env.SMTP_HOST || '').trim();
    const user = (process.env.SMTP_USER || '').trim();
    const pass = (process.env.SMTP_PASS || '').trim();

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
        auth: {
          user,
          pass
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100
      });
      this.isConfigured = true;
      logger.info('[EmailService] SMTP transporter initialized with host: ' + host);
    } else {
      this.isConfigured = false;
      if (process.env.NODE_ENV === 'production') {
        logger.warn('[EmailService] SMTP credentials not set in production. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env.');
      } else {
        logger.info('[EmailService] SMTP not configured. Running in Mock/Preview Mode (local/test).');
      }
    }
  }

  /**
   * Masks email address for secure logging (e.g. ra***@gmail.com).
   */
  maskEmail(email) {
    if (!email || typeof email !== 'string') return '***';
    const parts = email.split('@');
    if (parts.length !== 2) return '***';
    const name = parts[0];
    const domain = parts[1];
    const visibleName = name.length <= 2 ? name[0] + '*' : name.slice(0, 2) + '*'.repeat(Math.min(name.length - 2, 5));
    return `${visibleName}@${domain}`;
  }

  /**
   * Registers a callback listener for automated tests to observe dispatched OTPs.
   */
  onOtpDispatch(callback) {
    this.testListeners.push(callback);
    return () => {
      this.testListeners = this.testListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Sends 6-digit OTP email to user.
   * @param {string} email - Destination email
   * @param {string} otp - 6-digit numeric OTP code
   * @param {string} [name] - User name
   * @returns {Promise<{ success: boolean, messageId?: string, mock?: boolean }>}
   */
  async sendVerificationOtp(email, otp, name = '') {
    if (!email || !otp) {
      throw new Error('Email and OTP are required for dispatch.');
    }

    const cleanEmail = email.toLowerCase().trim();
    const displayName = name ? name.trim() : 'Trader';
    const fromAddress = process.env.SMTP_FROM || '"The Lal Street" <no-reply@thelalstreet.in>';
    const masked = this.maskEmail(cleanEmail);

    // Notify test listeners (used in test suites)
    for (const listener of this.testListeners) {
      try {
        listener({ email: cleanEmail, otp, name: displayName });
      } catch (e) {
        // Ignore test listener errors
      }
    }

    // 1. If SMTP is configured, dispatch via real SMTP server
    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: fromAddress,
          to: cleanEmail,
          subject: `${otp} is your The Lal Street verification code`,
          text: `Hi ${displayName},\n\nYour 6-digit verification code is: ${otp}\n\nThis code will expire in 5 minutes. Please do not share this code with anyone.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe Lal Street Security Team`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
                  .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
                  .header { background: #0f172a; padding: 28px 32px; text-align: center; }
                  .logo { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
                  .accent { color: #3b82f6; }
                  .content { padding: 32px; }
                  .title { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 8px; }
                  .desc { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
                  .otp-box { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
                  .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #2563eb; }
                  .expiry-badge { display: inline-block; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px; margin-top: 10px; }
                  .warning { font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 20px; }
                  .footer { background: #f8fafc; padding: 16px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <div class="logo">The Lal Street <span class="accent">Screener</span></div>
                  </div>
                  <div class="content">
                    <h2 class="title">Verify Your Email Address</h2>
                    <p class="desc">Hello ${displayName},<br>Welcome to The Lal Street. Please use the verification code below to complete your registration and activate your account.</p>
                    <div class="otp-box">
                      <div class="otp-code">${otp}</div>
                      <div class="expiry-badge">⏱ Expires in 5 minutes</div>
                    </div>
                    <p class="warning">
                      <strong>Security Notice:</strong> Never share this code with anyone. The Lal Street support team will never ask for your verification code or password. If you didn't create an account, you can safely ignore this email.
                    </p>
                  </div>
                  <div class="footer">
                    &copy; ${new Date().getFullYear()} The Lal Street. All rights reserved.
                  </div>
                </div>
              </body>
            </html>
          `
        });

        logger.info('[EmailService] Verification OTP successfully sent via SMTP', {
          email: masked,
          messageId: info.messageId
        });

        return { success: true, messageId: info.messageId };
      } catch (smtpErr) {
        logger.error('[EmailService] SMTP delivery failed', {
          email: masked,
          error: smtpErr.message
        });

        // In non-production or local environments, gracefully fall back so users are never blocked
        if (process.env.NODE_ENV !== 'production') {
          logger.warn(`[EmailService] SMTP delivery failed (${smtpErr.message}). Check Brevo account Authorized IPs / credentials.`);
          return {
            success: true,
            mock: true,
            smtpError: smtpErr.message,
            messageId: `fallback_${Date.now()}`
          };
        }

        throw new Error('Failed to deliver verification email. Please check your email address and try again.');
      }
    }

    // 2. Mock / Preview Mode when SMTP is not configured
    logger.info(`[EmailService] [MOCK MODE] Verification OTP generated for ${cleanEmail} (Configure SMTP_HOST, SMTP_USER, SMTP_PASS in .env to send real emails)`);

    return {
      success: true,
      mock: true,
      messageId: `mock_${Date.now()}`
    };
  }
}

export const emailService = new EmailService();
export default emailService;
