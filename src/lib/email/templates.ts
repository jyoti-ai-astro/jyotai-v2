// src/lib/email/templates.ts

export type PlanTier = 'STANDARD' | 'PREMIUM';

export interface PredictionEmailOpts {
  userName: string;
  predictionId: string;
  plan: PlanTier;
  appUrl?: string;        // e.g. https://jyoti.app
  supportEmail?: string;  // e.g. support@jyoti.app
}

const fallbackAppUrl = 'https://jyoti.app';
const fallbackSupport = 'support@jyoti.app';

/**
 * HTML body for the "prediction ready / payment success" email.
 * Keep markup simple for broad client support.
 */
export function predictionEmailHTML({
  userName,
  predictionId,
  plan,
  appUrl = fallbackAppUrl,
  supportEmail = fallbackSupport,
}: PredictionEmailOpts): string {
  const predictionLink = `${appUrl}/dashboard/predictions/${encodeURIComponent(predictionId)}`;
  const planLabel = plan === 'PREMIUM' ? 'Premium' : 'Standard';

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charSet="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>JyotAI — Prediction Ready</title>
  <style>
    body{margin:0;padding:0;background:#0B0F14;color:#F7F7F8;font-family:ui-sans-serif,system-ui,-apple-system,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji";}
    .wrap{max-width:560px;margin:0 auto;padding:28px 20px;}
    .card{background:#0F1520;border:1px solid #1E293B;border-radius:12px;padding:24px}
    .btn{display:inline-block;padding:12px 18px;border-radius:10px;text-decoration:none;background:#2A9DF4;color:#001018;font-weight:700}
    .muted{color:#A7B0BA;font-size:12px;line-height:1.6}
    h1{margin:0 0 10px;font-size:20px}
    h2{margin:0 0 16px;font-size:16px;color:#A7B0BA;font-weight:600}
    .hr{height:1px;background:#1E293B;border:0;margin:20px 0}
    .kvs{background:#0B0F14;border:1px solid #1E293B;border-radius:8px;padding:12px 14px}
    .kv{display:flex;justify-content:space-between;margin:6px 0}
    .key{color:#A7B0BA}
    .val{color:#F7F7F8;font-weight:600}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>Hi ${escapeHtml(userName)}, your prediction is ready ✨</h1>
      <h2>Plan: ${planLabel}</h2>

      <p>We’ve generated your prediction. You can view it securely at the link below:</p>

      <p style="margin:16px 0;">
        <a class="btn" href="${predictionLink}" target="_blank" rel="noopener">Open Prediction</a>
      </p>

      <div class="hr"></div>

      <div class="kvs">
        <div class="kv"><span class="key">Prediction ID</span><span class="val">${predictionId}</span></div>
        <div class="kv"><span class="key">Dashboard</span><span class="val"><a href="${appUrl}" style="color:#2A9DF4">jyoti.app</a></span></div>
      </div>

      <p class="muted" style="margin-top:16px;">
        Need help? Reply to this email or write to <a href="mailto:${supportEmail}" style="color:#2A9DF4">${supportEmail}</a>.
      </p>
    </div>

    <p class="muted" style="text-align:center;margin-top:16px;">
      © ${new Date().getFullYear()} JyotAI. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/** Super-light HTML escaper to avoid broken markup with user inputs. */
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
