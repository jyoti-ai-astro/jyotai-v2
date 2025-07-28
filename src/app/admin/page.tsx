// This is a Server Component, as it just displays data.
export default function AdminDashboard() {
  return (
    <div>
      <h1 
        className="text-5xl text-celestial-gold mb-8"
        style={{ fontFamily: "'Marcellus', serif" }}
      >
        JyotAI Command Center
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-gray-400 text-lg">Total Revenue</h2>
          <p className="text-4xl font-bold">₹0</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-gray-400 text-lg">Total Users</h2>
          <p className="text-4xl font-bold">1</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-gray-400 text-lg">Predictions Delivered</h2>
          <p className="text-4xl font-bold">0</p>
        </div>
      </div>

      {/* User Table Placeholder */}
      <div>
        <h2 
          className="text-3xl text-supernova-magenta mb-4"
          style={{ fontFamily: "'Marcellus', serif" }}
        >
          Recent Pilgrims
        </h2>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <p>The grand table of users will be forged here in our next milestone.</p>
          <p className="mt-4 text-sm text-gray-400">
            It will include the user&apos;s name, email, plan, and credits.
            And next to each user, we will place the sacred button: 
            <span className="font-bold text-celestial-gold">&quot;View Sentry Logs for this User&quot;</span>.
          </p>
        </div>
      </div>
    </div>
  );
}