// src/lib/email/zepto.ts
import { SendMailClient } from "zeptomail";

const rawUrl = process.env.ZEPTO_API_URL || "https://api.zeptomail.in/";
const url = rawUrl.startsWith("http") ? rawUrl : `https://${rawUrl}`;

const zeptoToken =
  process.env.ZEPTO_API_TOKEN ||
  process.env.ZEPTO_MAIL_TOKEN || // backward-compat
  "";

if (!zeptoToken) {
  console.warn("⚠️ Zepto token not set (ZEPTO_API_TOKEN/ZEPTO_MAIL_TOKEN). Emails will fail.");
}

export const zepto = new SendMailClient({ url, token: zeptoToken });

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
