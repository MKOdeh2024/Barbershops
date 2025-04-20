// backend/src/utils/emailSender.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables - Ensure dotenv.config() is called early in your app startup (e.g., server.ts)
// If it's already called in server.ts, you might not need it here, but it doesn't hurt.
dotenv.config({ path: '../.env' }); // Adjust path relative to this file if needed

// --- Nodemailer Transporter Configuration ---
// Create a reusable transporter object using SMTP transport
// Read credentials securely from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587', 10), // Default to 587 if not set
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports (STARTTLS)
  auth: {
    user: process.env.EMAIL_USER, // Your SMTP username from .env
    pass: process.env.EMAIL_PASS, // Your SMTP password from .env
  },
  // Optional: Add tls options if needed (e.g., for self-signed certs - not recommended for production)
  // tls: {
  //   rejectUnauthorized: false
  // }
});

// Verify transporter connection (optional, good for debugging setup)
transporter.verify((error, success) => {
    if (error) {
        console.error('Error configuring email transporter:', error);
    } else {
        console.log('Email transporter configured successfully. Ready to send emails.');
    }
});
// -----------------------------------------


/**
 * Sends a confirmation email using Nodemailer.
 *
 * @param to The recipient's email address.
 * @param name The recipient's first name.
 * @param confirmationUrl The unique URL the user clicks to confirm their account.
 */
export const sendConfirmationEmail = async (to: string, name: string, confirmationUrl: string): Promise<void> => {
  console.log(`Attempting to send confirmation email to: ${to}`);

  // Email content
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Barbershop App" <noreply@example.com>', // Sender address
    to: to, // List of receivers
    subject: 'Please Confirm Your Email Address ✔', // Subject line
    text: `Hi ${name},\n\nPlease click the following link to confirm your email address and activate your account:\n${confirmationUrl}\n\nIf you did not sign up for this account, you can safely ignore this email.\n\nThanks,\nThe Barbershop Team`, // Plain text body
    html: `
      <div style="font-family: sans-serif; line-height: 1.6;">
        <h2>Hi ${name},</h2>
        <p>Thanks for registering! Please click the button below to confirm your email address and activate your account:</p>
        <p style="margin: 25px 0;">
          <a href="${confirmationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Confirm Email Address</a>
        </p>
        <p>If the button doesn't work, you can also copy and paste this link into your browser:</p>
        <p><a href="${confirmationUrl}">${confirmationUrl}</a></p>
        <p>If you did not sign up for this account, you can safely ignore this email.</p>
        <br/>
        <p>Thanks,</p>
        <p><strong>The Barbershop Team</strong></p>
      </div>
    `, // HTML body
  };

  // Send mail with defined transport object
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent: %s', info.messageId);
    // You can log more details from 'info' if needed (like info.response)
  } catch (error) {
    console.error(`Error sending confirmation email to ${to}:`, error);
    // Re-throw the error so the calling function (registerUser) knows sending failed
    throw new Error('Failed to send confirmation email.');
  }
};

// You might add other email sending functions here (e.g., sendPasswordResetEmail)
// export const sendPasswordResetEmail = async (to: string, resetToken: string) => { ... };

