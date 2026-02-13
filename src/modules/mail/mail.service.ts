import nodemailer from "nodemailer";

import env from "@/env";

const poolConfig = `smtp://${env.MAIL_USERNAME}:${env.MAIL_PASSWORD}@${env.MAIL_HOST}:${env.MAIL_PORT}`;

const transporter = nodemailer.createTransport(poolConfig);

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
