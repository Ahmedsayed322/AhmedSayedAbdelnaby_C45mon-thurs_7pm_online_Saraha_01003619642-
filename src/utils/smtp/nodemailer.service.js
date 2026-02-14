import nodemailer from 'nodemailer';
import { env } from '../../config/index.js';
const { CONSUMER_SECRET, CONSUMER_KEY, MY_EMAIL } = env;
const SMTP = async () => {
  const transporter = nodemailer.createTransport({
    host: 'pro.turbo-smtp.com',
    port: 465,
    secure: true,
    auth: {
      user: CONSUMER_KEY,
      pass: CONSUMER_SECRET,
    },
  });
  return transporter;
};
export const sendOTP = async (email, subject, text, html) => {
  const transporter = await SMTP();
  const info = await transporter.sendMail({
    from: `"Ahmed Sayed" <${MY_EMAIL}>`,
    to: email,
    subject: subject,
    text: text,
    html: html,
  });
  return info;
};
