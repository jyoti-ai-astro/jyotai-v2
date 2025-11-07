// src/lib/email/zepto.ts
import { SendMailClient } from "zeptomail";

const url = process.env.ZEPTO_API_URL || "api.zeptomail.in/";
const token = process.env.ZEPTO_API_TOKEN;

if (!token) {
  // Don't crash in prod, but log loudly
  console.warn("⚠️ ZEPTO_API_TOKEN is not set. Emails will fail.");
}

export const zepto = new SendMailClient({ url, token: token || "" });

type SendMailArgs = {
  to: string;
  subject: string;
  html: string;
  fromAddress?: string;
  fromName?: string;
};

export async function sendZepto({
  to,
  subject,
  html,
  fromAddress = process.env.SENDER_EMAIL || "order@jyoti.app",
  fromName = "JyotAI",
}: SendMailArgs) {
  return zepto.sendMail({
    from: { address: fromAddress, name: fromName },
    to: [{ email_address: { address: to, name: to.split("@")[0] } }],
    subject,
    htmlbody: html,
  });
}
