/**
 * VERDANT LAWNCARE PLATFORM - MAIN APP
 */

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="app">
          <nav className="sidebar">
            <div className="logo">
              <h1>🌱 Verdant</h1>
              <p>AI-Powered Lawncare</p>
            </div>
            <ul className="nav-links">
              <li><Link to="/">📊 Dashboard</Link></li>
              <li><Link to="/customers">👥 Customers</Link></li>
              <li><Link to="/leads">🎯 Leads</Link></li>
              <li><Link to="/pipeline">🔄 Pipeline</Link></li>
              <li><Link to="/jobs">📅 Jobs</Link></li>
              <li><Link to="/campaigns">📧 Campaigns</Link></li>
              <li><Link to="/analytics">📈 Analytics</Link></li>
            </ul>
          </nav>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/leads" element={<Leads />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/jobs" element={<div>Jobs - Coming Soon</div>} />
              <Route path="/campaigns" element={<div>Campaigns - Coming Soon</div>} />
              <Route path="/analytics" element={<div>Analytics - Coming Soon</div>} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
