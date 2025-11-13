// src/lib/urls.ts
const ORIGIN = process.env.APP_ORIGIN || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export function appOrigin() {
  return ORIGIN.replace(/\/+$/, "");
}

export function predictionUrl(id: string) {
  // Our canonical route is /predictions/[id] (not /dashboard/predictions/[id])
  return `${appOrigin()}/predictions/${encodeURIComponent(id)}`;
}

export function dashboardUrl() {
  return `${appOrigin()}/dashboard`;
}
