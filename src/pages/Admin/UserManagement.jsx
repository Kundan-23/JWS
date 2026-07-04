import React from 'react';
import { motion } from 'framer-motion';

const UserManagement = () => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-1">User Management</h1>
        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>View and manage registered players and coaches.</p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--bg-surface-elevated)' }}>
          <h3 className="heading-3">Recent Registrations</h3>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Name</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Role</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Age Group / Cat</th>
                <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'Arjun Kumar', role: 'Player', cat: 'Boys U-15', status: 'Active' },
                { name: 'Ravi Singh', role: 'Coach', cat: 'Juniors Head', status: 'Active' },
                { name: 'Neha Sharma', role: 'Player', cat: 'Girls U-17', status: 'Pending Payment' }
              ].map((user, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--bg-surface-elevated)' }}>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{user.name}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      backgroundColor: user.role === 'Coach' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                      color: user.role === 'Coach' ? '#10b981' : '#3b82f6', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: 'var(--radius-full)', 
                      fontSize: '0.75rem', 
                      fontWeight: 600 
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)' }}>{user.cat}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default UserManagement;
