/**
 * CUSTOMERS PAGE
 */

import { useCustomers } from '../hooks/useCustomers';

export default function Customers() {
  const { data, isLoading, error } = useCustomers({ page: 1, limit: 20 });

  if (isLoading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading customers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <strong>Error loading customers:</strong> {error.message}
        <p className="helper-text">
          Ensure the operations API is running on port 3001 before refreshing.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <p>Manage your customer base</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2>All Customers ({data?.pagination?.total || 0})</h2>
          <button className="btn btn-primary">+ Add Customer</button>
        </div>

        {data?.data?.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Customer Since</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.first_name} {customer.last_name}</strong>
                  </td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || 'N/A'}</td>
                  <td>
                    <span className={`badge badge-${customer.status === 'active' ? 'success' : 'warning'}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td>{new Date(customer.customer_since).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">
            <p>No customers yet. Start by adding your first customer!</p>
            <button className="btn btn-primary">Add First Customer</button>
          </div>
        )}
      </div>
    </div>
  );
}
