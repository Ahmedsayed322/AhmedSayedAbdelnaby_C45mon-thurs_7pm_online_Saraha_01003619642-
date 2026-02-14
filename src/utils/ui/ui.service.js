export const otpPage = (otp) => {
  return `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px; text-align: center; background-color: #f9f9f9;">
      <h1 style="color: #333;">Confirm Your Email</h1>
      <p style="color: #555; font-size: 16px;">
        Hi there! Use the OTP below to verify your email address. This code will
        expire in <strong>10 minutes</strong>.
      </p>

      <div style="margin: 30px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; color: #ffffff; background-color: #4caf50; padding: 15px 30px; border-radius: 8px; letter-spacing: 4px;">
         ${otp}
        </span>
      </div>

      <p style="color: #888; font-size: 14px;">
        If you did not request this code, you can safely ignore this email.
      </p>

      <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />
      <p style="color: #aaa; font-size: 12px;">
        &copy; 2026 Ahmed Sayed. All rights reserved.
      </p>
    </div>`;
};
