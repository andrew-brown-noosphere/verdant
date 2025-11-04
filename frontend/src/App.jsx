import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

// Pages
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import Jobs from './pages/Jobs';
import Campaigns from './pages/Campaigns';
import CampaignDetails from './pages/CampaignDetails';
import Analytics from './pages/Analytics';
import GardenPlanner from './pages/GardenPlanner';
import PropertyAssessment from './pages/PropertyAssessment';
import LandingPage from './pages/LandingPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { path: '/', label: 'Dashboard' },
    { path: '/customers', label: 'Customers' },
    { path: '/leads', label: 'Leads' },
    { path: '/pipeline', label: 'Pipeline' },
    { path: '/jobs', label: 'Jobs' },
    { path: '/campaigns', label: 'Campaigns' },
    { path: '/analytics', label: 'Analytics' },
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Verdant</h1>
        <span>Garden Broadcast</span>
      </div>

      <nav>
        <ul className="nav-links">
          {links.map((link) => {
            const active = isActive(link.path);
            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`nav-link${active ? ' active' : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span className="nav-link__marker">◆</span>
                  <span>{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

const Layout = ({ children }) => (
  <div className="app-shell">
    <Sidebar />
    <main className="app-content">
      <div className="content-inner">
        {children}
      </div>
    </main>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/:campaignId" element={<CampaignDetails />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/start" element={<LandingPage />} />
            <Route path="/garden-planner" element={<GardenPlanner />} />
            <Route path="/property-assessment" element={<PropertyAssessment />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
