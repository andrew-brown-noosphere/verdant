/**
 * LEADS PAGE
 */

import { useLeads } from '../hooks/useLeads';
import { useScoreLead } from '../hooks/useLeads';

export default function Leads() {
  const { data, isLoading, error } = useLeads({ sortBy: 'score', sortOrder: 'desc' });
  const scoreLead = useScoreLead();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading leads...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <strong>Error loading leads:</strong> {error.message}
        <p className="helper-text">
          Confirm the Node.js API is available on port 3001 and reload the page.
        </p>
      </div>
    );
  }

  const handleScoreLead = async (leadId) => {
    try {
      await scoreLead.mutateAsync(leadId);
      alert('Lead scored successfully!');
    } catch (err) {
      alert('Failed to score lead: ' + err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Leads</h1>
        <p>AI-powered lead management and scoring</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>All Leads ({data?.pagination?.total || 0})</h2>
          <button className="btn btn-primary">Add Lead</button>
        </div>

        {data?.data?.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Source</th>
                <th>AI Score</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.first_name} {lead.last_name}</strong>
                  </td>
                  <td>{lead.email || 'N/A'}</td>
                  <td>
                    <span className="badge badge-info">{lead.source}</span>
                  </td>
                  <td>
                    {lead.score ? (
                      <span
                        className={`lead-score ${
                          lead.score >= 70
                            ? 'lead-score--strong'
                            : lead.score >= 40
                            ? 'lead-score--moderate'
                            : 'lead-score--caution'
                        }`}
                      >
                        {lead.score}/100
                      </span>
                    ) : (
                      <button
                        className="btn btn-ghost btn-compact"
                        onClick={() => handleScoreLead(lead.id)}
                      >
                        Score with AI
                      </button>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${lead.status === 'new' ? 'info' : 'warning'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>{new Date(lead.created_at).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-secondary btn-compact">Convert</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No leads yet. Start capturing leads!</p>
            <button className="btn btn-primary" style={{ marginTop: '1rem' }}>
              + Add First Lead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
