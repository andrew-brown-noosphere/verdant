import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

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
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/customers', label: 'Customers', icon: '👥' },
    { path: '/leads', label: 'Leads', icon: '🎯' },
    { path: '/pipeline', label: 'Pipeline', icon: '🔄' },
    { path: '/jobs', label: 'Jobs', icon: '🏡' },
    { path: '/campaigns', label: 'Campaigns', icon: '📢' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div style={{
      width: '240px',
      backgroundColor: '#1f2937',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      padding: '20px',
      color: 'white'
    }}>
      <h2 style={{
        margin: '0 0 30px 0',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#10b981'
      }}>
        🌱 Verdant
      </h2>

      <nav>
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              marginBottom: '8px',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'white',
              backgroundColor: location.pathname === link.path ? '#374151' : 'transparent',
              transition: 'background-color 0.2s'
            }}
          >
            <span style={{ fontSize: '20px' }}>{link.icon}</span>
            <span style={{ fontSize: '16px' }}>{link.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

const Layout = ({ children }) => {
  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{
        marginLeft: '240px',
        flex: 1,
        backgroundColor: '#f9fafb',
        minHeight: '100vh'
      }}>
        {children}
      </div>
    </div>
  );
};

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
