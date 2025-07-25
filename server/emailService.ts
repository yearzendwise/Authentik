import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  private fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  private appName = process.env.APP_NAME || 'SaaS Auth App';
  private baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  async sendVerificationEmail(email: string, verificationToken: string, firstName?: string) {
    const verificationUrl = `${this.baseUrl}/verify-email?token=${verificationToken}`;
    const displayName = firstName ? ` ${firstName}` : '';

    try {
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `Welcome to ${this.appName} - Please verify your email`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify Your Email</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${this.appName}</h1>
                <p>Welcome to our platform!</p>
              </div>
              <div class="content">
                <h2>Hi${displayName}!</h2>
                <p>Thank you for signing up for ${this.appName}. To complete your registration and start using your account, please verify your email address by clicking the button below:</p>
                
                <div style="text-align: center;">
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>
                
                <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
                <p style="background: #e9ecef; padding: 10px; border-radius: 4px; word-break: break-all;">
                  ${verificationUrl}
                </p>
                
                <p><strong>This verification link will expire in 24 hours.</strong></p>
                
                <p>If you didn't create an account with us, you can safely ignore this email.</p>
                
                <p>Welcome aboard!</p>
                <p>The ${this.appName} Team</p>
              </div>
              <div class="footer">
                <p>This email was sent to ${email}. If you have any questions, please contact our support team.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Failed to send verification email:', error);
        throw new Error('Failed to send verification email');
      }

      console.log('Verification email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, firstName?: string) {
    const displayName = firstName ? ` ${firstName}` : '';

    try {
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: `Welcome to ${this.appName}! Your account is now verified`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to ${this.appName}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Account Verified!</h1>
                <p>Welcome to ${this.appName}</p>
              </div>
              <div class="content">
                <h2>Hi${displayName}!</h2>
                <p>Congratulations! Your email address has been successfully verified and your account is now fully activated.</p>
                
                <p>You can now:</p>
                <ul>
                  <li>Access all features of ${this.appName}</li>
                  <li>Manage your profile and account settings</li>
                  <li>Enable two-factor authentication for extra security</li>
                  <li>Manage your active sessions across devices</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${this.baseUrl}" class="button">Go to Dashboard</a>
                </div>
                
                <p>If you have any questions or need help getting started, feel free to reach out to our support team.</p>
                
                <p>Thank you for joining us!</p>
                <p>The ${this.appName} Team</p>
              </div>
              <div class="footer">
                <p>This email was sent to ${email}. If you have any questions, please contact our support team.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (error) {
        console.error('Failed to send welcome email:', error);
        throw new Error('Failed to send welcome email');
      }

      console.log('Welcome email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Email service error:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();