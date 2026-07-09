import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/adminAPI';
import { Search, Eye, ChevronLeft, ChevronRight, Download, FileUp } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { useConfig } from '../../context/ConfigContext';

const PAGE_SIZE = 50;

const thStyle = { padding: '0.85rem 1.25rem', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' };
const tdStyle = { padding: '1rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' };

const PayBadge = ({ status }) => {
  const paid = status === 'paid';
  return (
    <span style={{
      padding: '0.25rem 0.7rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700,
      backgroundColor: paid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
      color: paid ? '#10b981' : '#ef4444',
      border: `1px solid ${paid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
    }}>
      {status || 'unpaid'}
    </span>
  );
};

const Players = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [payFilter, setPayFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { plans } = useConfig();

  // Viewer admin restriction
  const isViewerAdmin = (() => {
    try { return JSON.parse(localStorage.getItem('jws_user') || '{}')?.email === 'jwsadmin2026@gmail.com'; }
    catch { return false; }
  })();

  const getPlanName = (planId) => {
    if (!planId) return '—';
    const id = planId.trim();
    if (id === 'p1') return 'Basic';
    if (id === 'p2') return 'Elite';
    const plan = plans?.find(p => p.id === id);
    return plan ? plan.name : id;
  };

  // Hidden file input ref
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await adminAPI.getPlayers({ search: search || undefined, payment: payFilter || undefined, status: statusFilter || undefined, page, limit: PAGE_SIZE });
        setPlayers(res.data?.players || res.data || []);
      } catch (err) {
        Swal.fire({
          icon: 'error', title: 'Error', text: err.response?.data?.message || 'Failed to load players.',
          background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: 'var(--brand-primary)',
        });
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [search, payFilter, statusFilter, page]);

  const total = players.length;

  // ── Excel Export ──────────────────────────────────────────────────
  const handleExport = async () => {
    try {
      const res = await adminAPI.exportPlayers({
        search: search || undefined,
        payment: payFilter || undefined,
        status: statusFilter || undefined,
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'JWS_2026_Players.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: 'Failed to download the formatted Excel sheet.',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        confirmButtonColor: 'var(--brand-primary)',
      });
    }
  };

  // ── Excel Import ──────────────────────────────────────────────────
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws);
      const confirm = await Swal.fire({
        title: `Import ${rows.length} players?`,
        text: 'This will create player accounts for each row.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Import',
        confirmButtonColor: '#cbf905',
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
      });
      if (!confirm.isConfirmed) return;
      Swal.fire({
        icon: 'info',
        title: 'Import Preview',
        text: `Found ${rows.length} rows. Bulk import API integration coming soon.`,
        background: 'var(--bg-surface)',
        color: 'var(--text-primary)',
      });
    };
    reader.readAsBinaryString(file);
  };

  const btnBase = {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
    padding: '0.6rem 1rem', borderRadius: 'var(--radius-md)',
    fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
    transition: 'all 0.15s', border: '1px solid',
    whiteSpace: 'nowrap',
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="heading-1">Players</h1>
        <p className="text-secondary" style={{ marginTop: '0.35rem' }}>Manage all registered GICL players.</p>
      </div>

      <div style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search name, email, GICL ID…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem' }}
            />
          </div>
          <select
            value={payFilter}
            onChange={e => { setPayFilter(e.target.value); setPage(1); }}
            style={{ padding: '0.65rem 2.5rem 0.65rem 0.875rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em' }}
          >
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="pending">Pending</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ padding: '0.65rem 2.5rem 0.65rem 0.875rem', backgroundColor: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.875rem', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25em' }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
            <option value="Disabled">Disabled</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExport}
            style={{ ...btnBase, backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.2)'}
            onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)'}
          >
            <Download size={15} /> Export Excel
          </button>

          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{total} players</span>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading players…</div>
          ) : players.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No players found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={thStyle}>#</th>
                  <th style={thStyle}>GICL ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Plan</th>
                  <th style={thStyle}>Payment</th>
                  <th style={thStyle}>Joined</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, idx) => (
                  <tr key={p.id || idx}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'}
                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--brand-primary)', fontWeight: 700 }}>{p.gicl_id || p.id}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{p.first_name} {p.last_name}</td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{p.email}</td>
                    <td style={tdStyle}>{p.plan_name || getPlanName(p.plan) || '—'}</td>
                    <td style={tdStyle}><PayBadge status={p.payment_status} /></td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => navigate(`/admin2/players/${p.id}`)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem', borderRadius: 'var(--radius-md)', background: 'rgba(96,165,250,0.1)', color: 'var(--brand-accent)', border: '1px solid rgba(96,165,250,0.25)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(96,165,250,0.2)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(96,165,250,0.1)'}
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', background: page === 1 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)', border: '1px solid var(--border-subtle)', color: page === 1 ? 'var(--text-secondary)' : 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Page {page}</span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={total < PAGE_SIZE}
              style={{ padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', background: total < PAGE_SIZE ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)', border: '1px solid var(--border-subtle)', color: total < PAGE_SIZE ? 'var(--text-secondary)' : 'var(--text-primary)', cursor: total < PAGE_SIZE ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Players;

