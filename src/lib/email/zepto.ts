// src/lib/email/zepto.ts
import { SendMailClient } from "zeptomail";

function normalizeUrl(v?: string) {
  if (!v) return "https://api.zeptomail.in/v1.1/email";
  let u = v.trim();
  if (!u.startsWith("http")) u = `https://${u}`;
  if (!/\/v\d+\.\d+\/email\/?$/.test(u)) {
    u = u.replace(/\/+$/, "");
    if (!/\/v\d+\.\d+$/.test(u)) u = `${u}/v1.1`;
    u = `${u}/email`;
  }
  return u;
}

const url = normalizeUrl(process.env.ZEPTO_API_URL);
const zeptoToken =
  process.env.ZEPTO_API_TOKEN || process.env.ZEPTO_MAIL_TOKEN || "";

if (!zeptoToken || !zeptoToken.startsWith("Zoho-enczapikey ")) {
  console.warn("⚠️ ZEPTO_API_TOKEN missing/invalid.");
}

export const zepto = new SendMailClient({ url, token: zeptoToken });

type SendMailArgs = {
  to: string;
  subject: string;
  html: string;
  fromAddress?: string;
  fromName?: string;
  replyTo?: string;
};

export async function sendZepto({
  to,
  subject,
  html,
  fromAddress = process.env.SENDER_EMAIL || "order@jyoti.app",
  fromName = "JyotAI",
  replyTo = process.env.SUPPORT_EMAIL || process.env.SENDER_EMAIL || "order@jyoti.app",
}: SendMailArgs) {
  return zepto.sendMail({
    from: { address: fromAddress, name: fromName },
    to: [{ email_address: { address: to, name: to.split("@")[0] } }],
    reply_to: { address: replyTo },
    subject,
    htmlbody: html,
  });
}
