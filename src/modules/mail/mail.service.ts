import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // e.g., "smtp.ethereal.email"
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async ({
  to,
  text,
  subject,
}: {
  to: string;
  text: string;
  subject: string;
}) => {
  return await transporter.sendMail({
    from: '"Rental System" <no-reply@yourdomain.com>',
    to,
    subject,
    text,
  });
};
