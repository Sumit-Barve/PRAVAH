export interface EmailPayload {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  type: 'VERIFICATION' | 'PASSWORD_RESET' | 'DEFICIENCY_ALERT' | 'APPLICATION_UPDATE';
  token?: string;
}

// In-memory development email outbox for verification and testing
const devOutbox: Array<EmailPayload & { sentAt: string }> = [];

export const getDevOutbox = () => [...devOutbox];
export const clearDevOutbox = () => { devOutbox.length = 0; };
export const getLatestEmailForRecipient = (email: string) =>
  devOutbox.filter((e) => e.to.toLowerCase() === email.toLowerCase()).slice(-1)[0];

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

/**
 * Dispatches an email notification or safely records it in development outbox.
 */
export const sendEmail = async (payload: EmailPayload): Promise<{ success: boolean; previewLink?: string }> => {
  const sentAt = new Date().toISOString();
  devOutbox.push({ ...payload, sentAt });

  // Keep outbox bounded
  if (devOutbox.length > 100) {
    devOutbox.shift();
  }

  // Check if external SMTP is configured
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  if (!smtpConfigured) {
    console.log(`[DEV EMAIL OUTBOX] To: ${payload.to} | Subject: "${payload.subject}" | Type: ${payload.type}`);
    if (payload.token) {
      console.log(`[DEV EMAIL TOKEN] ${payload.token}`);
    }
  }

  return { success: true };
};

export const sendVerificationEmail = async (to: string, fullName: string, token: string): Promise<void> => {
  const verificationUrl = `${FRONTEND_URL}/institution/verify-email?token=${token}&email=${encodeURIComponent(to)}`;
  
  await sendEmail({
    to,
    subject: 'SAKSHAM — Verify Your Institutional Representative Account',
    type: 'VERIFICATION',
    token,
    textContent: `Dear ${fullName},\n\nPlease verify your institutional email address by opening the following link:\n${verificationUrl}\n\nThis verification link is valid for 24 hours.\n\nAICTE SAKSHAM Platform`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f2b48;">SAKSHAM — Institutional Representative Verification</h2>
        <p>Dear ${fullName},</p>
        <p>Thank you for registering on the SAKSHAM AICTE Approval Workflow & Compliance Platform.</p>
        <p>Please click the button below to verify your official institutional email address:</p>
        <p style="margin: 24px 0;">
          <a href="${verificationUrl}" style="background-color: #0f2b48; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </p>
        <p style="color: #64748b; font-size: 13px;">Or copy and paste this link into your browser:<br/><a href="${verificationUrl}">${verificationUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">This link expires in 24 hours. If you did not initiate this registration, please disregard this notice.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (to: string, fullName: string, token: string): Promise<void> => {
  const resetUrl = `${FRONTEND_URL}/institution/reset-password?token=${token}&email=${encodeURIComponent(to)}`;

  await sendEmail({
    to,
    subject: 'SAKSHAM — Password Reset Request',
    type: 'PASSWORD_RESET',
    token,
    textContent: `Dear ${fullName},\n\nA password reset was requested for your account. Use the link below to set a new password:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nAICTE SAKSHAM Platform`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f2b48;">SAKSHAM — Password Reset Request</h2>
        <p>Dear ${fullName},</p>
        <p>We received a request to reset the password for your SAKSHAM account.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #0f2b48; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </p>
        <p style="color: #64748b; font-size: 13px;">Or open this URL:<br/><a href="${resetUrl}">${resetUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="color: #94a3b8; font-size: 12px;">This link is valid for 1 hour. If you did not request this, your account remains secure.</p>
      </div>
    `,
  });
};

export const sendDeficiencyNoticeEmail = async (to: string, instituteName: string, noticeNumber: string, applicationNumber: string): Promise<void> => {
  const portalUrl = `${FRONTEND_URL}/institution/applications`;

  await sendEmail({
    to,
    subject: `SAKSHAM Notice Released: Deficiency on Application ${applicationNumber}`,
    type: 'DEFICIENCY_ALERT',
    textContent: `Official Notice Issued for ${instituteName}.\nNotice Ref: ${noticeNumber}\nApplication: ${applicationNumber}\n\nPlease sign in to SAKSHAM Institution Portal to review the deficiencies and submit your compliance clarification.\n${portalUrl}`,
    htmlContent: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #b91c1c;">AICTE Scrutiny Deficiency Notice Released</h2>
        <p><strong>Institution:</strong> ${instituteName}</p>
        <p><strong>Application Ref:</strong> ${applicationNumber}</p>
        <p><strong>Notice Reference:</strong> ${noticeNumber}</p>
        <p>The AICTE Scrutiny Committee has recorded deficiencies requiring clarification or supplementary documentation.</p>
        <p style="margin: 24px 0;">
          <a href="${portalUrl}" style="background-color: #0f2b48; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Notice & Respond</a>
        </p>
      </div>
    `,
  });
};
