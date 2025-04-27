// backend/src/utils/emailSender.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' }); // Adjust path if needed

// --- Nodemailer Transporter Configuration (reuse from previous step) ---
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'false', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
    if (error) console.error('Error configuring email transporter:', error);
    else console.log('Email transporter configured successfully.');
});
// -----------------------------------------

/**
 * Sends a confirmation email with a verification code.
 *
 * @param to The recipient's email address.
 * @param name The recipient's first name.
 * @param code The 6-digit verification code.
 */
export const sendConfirmationCodeEmail = async (to: string, name: string, code: string): Promise<void> => {
  console.log(`Attempting to send confirmation code email to: ${to}`);

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Trimly App" <noreply@example.com>',
    to: to,
    subject: 'Your Trimly App Verification Code',
    text: `Hi ${name},\n\nYour verification code is: ${code}\n\nPlease enter this code on the verification page to activate your account.\nThis code will expire in 10 minutes.\n\nIf you did not sign up for this account, you can safely ignore this email.\n\nThanks,\nThe Barbershop Team`,
    html: `
      <div style="font-family: sans-serif; line-height: 1.6; text-align: center; padding: 20px;">
        <div style="max-width: 400px; margin: auto; border: 1px solid #ddd; padding: 30px; border-radius: 8px;">
            <h2>Hi ${name},</h2>
            <p>Thanks for registering! Please use the following code to verify your email address and activate your account:</p>
            <p style="margin: 25px 0; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #333; background-color: #f0f0f0; padding: 10px 15px; border-radius: 5px; display: inline-block;">
            ${code}
            </p>
            <p style="font-size: 0.9em; color: #777;">This code will expire in 10 minutes.</p>
            <p style="font-size: 0.9em; color: #777;">If you did not sign up for this account, you can safely ignore this email.</p>
            <br/>
            <p>Thanks,</p>
            <p><strong>The Barbershop Team</strong></p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation code email sent: %s', info.messageId);
  } catch (error) {
    console.error(`Error sending confirmation code email to ${to}:`, error);
    throw new Error('Failed to send confirmation code email.');
  }
};

// Keep the old sendConfirmationEmail function if needed elsewhere, or remove it.
// export const sendConfirmationEmail = async (...) => { ... };
