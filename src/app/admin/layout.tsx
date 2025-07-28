// This layout's only job is to render the admin pages.
// Security is now 100% handled by the middleware.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}