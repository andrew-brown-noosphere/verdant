/**
 * DASHBOARD PAGE
 */

export default function Dashboard() {
  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your lawncare business</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">124</div>
          <div className="stat-change positive">↑ 12% from last month</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Leads</div>
          <div className="stat-value">48</div>
          <div className="stat-change positive">↑ 8 new this week</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Jobs This Week</div>
          <div className="stat-value">67</div>
          <div className="stat-change">15 scheduled today</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Monthly Revenue</div>
          <div className="stat-value">$12,450</div>
          <div className="stat-change positive">↑ 18% from last month</div>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Quick Actions</h2>
        <div className="quick-actions">
          <button className="btn btn-primary">Add Customer</button>
          <button className="btn btn-primary">Add Lead</button>
          <button className="btn btn-secondary">Schedule Job</button>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">Recent Activity</h2>
        <p className="section-note">
          Activity from your crews and customers will appear here once the live data connection is enabled.
        </p>
      </div>
    </div>
  );
}
