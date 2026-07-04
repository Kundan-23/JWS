import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, CheckCircle, Gift, Users, Trophy, IndianRupee, RefreshCw, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { referralAPI } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';

const ReferralSystem = () => {
  const { referral: configReferral } = useConfig();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const [showCashout, setShowCashout] = useState(false);
  const [cashoutForm, setCashoutForm] = useState({ method: 'upi', upiId: '', bankName: '', accountNo: '', ifscCode: '', amount: '' });
  const [submitting, setSubmitting] = useState(false);

  const bonusLevels = stats?.bonusLevels || { level1: configReferral?.level1 || 50, level2: configReferral?.level2 || 20, level3plus: configReferral?.level3plus || 10 };
  const minCashout  = stats?.minCashout  || configReferral?.minCashout || 500;

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await referralAPI.getStats();
      if (res.data?.success) setStats(res.data);
    } catch (err) {
      console.error('[ReferralSystem] Failed to load stats:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const handleCopy = () => {
    if (!stats?.referralCode) return;
    navigator.clipboard.writeText(stats.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const code = stats?.referralCode || '';
    const msg  = encodeURIComponent(`🏏 Join GICL Sports! Use my referral code *${code}* when registering at https://gicl-nine.vercel.app to get started. I'll earn a bonus when you pay!`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleCashout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const amount = parseFloat(cashoutForm.amount);
      await referralAPI.requestCashout({
        amount,
        method:    cashoutForm.method,
        upiId:     cashoutForm.method === 'upi'  ? cashoutForm.upiId    : undefined,
        bankName:  cashoutForm.method === 'bank' ? cashoutForm.bankName : undefined,
        accountNo: cashoutForm.method === 'bank' ? cashoutForm.accountNo: undefined,
        ifscCode:  cashoutForm.method === 'bank' ? cashoutForm.ifscCode : undefined,
      });
      Swal.fire({ icon: 'success', title: 'Cashout Requested!',
        text: `Your withdrawal of ₹${amount} has been submitted. Admin will process in 3-5 working days.`,
        background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
      setShowCashout(false);
      loadStats();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Failed',
        text: err.response?.data?.message || 'Could not submit cashout request.',
        background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
    } finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--brand-primary)' }} />
        <p className="text-secondary">Loading your referral dashboard...</p>
      </div>
    );
  }

  const balance       = stats?.balance        || 0;
  const referralCode  = stats?.referralCode   || '—';
  const directRefs    = stats?.directReferrals || [];
  const ledger        = stats?.ledger          || [];
  const progressPct   = Math.min((balance / minCashout) * 100, 100);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="heading-1">Refer GICL Sports</h1>
          <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Invite friends to join GICL and earn cash rewards when they register.</p>
        </div>
        <button onClick={loadStats} style={{ background: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Bonus Level Banners */}
      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        {configReferral?.level1Active !== false && (
          <div style={{ minWidth: '180px', backgroundColor: 'var(--brand-primary)', color: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', flexShrink: 0 }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              {configReferral?.level1Name || '1st Referral'}
            </h3>
            <span style={{ fontSize: '2rem', fontWeight: 800 }}>₹{bonusLevels.level1}</span>
          </div>
        )}
        {configReferral?.level2Active !== false && (
          <div style={{ minWidth: '180px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--brand-primary)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', flexShrink: 0 }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              {configReferral?.level2Name || '2nd Referral'}
            </h3>
            <span style={{ fontSize: '2rem', fontWeight: 800 }}>₹{bonusLevels.level2}</span>
          </div>
        )}
        {configReferral?.level3Active !== false && (
          <div style={{ minWidth: '180px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--bg-surface-elevated)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', textAlign: 'center', flexShrink: 0 }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
              {configReferral?.level3Name || '3rd Onwards'}
            </h3>
            <span style={{ fontSize: '2rem', fontWeight: 800 }}>₹{bonusLevels.level3plus} <span style={{ fontSize: '1rem', fontWeight: 500 }}>each</span></span>
          </div>
        )}
      </div>

      {/* Code + Wallet row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>

        {/* Referral Code Card */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--brand-primary)', textAlign: 'center' }}>
          <Gift size={48} color="var(--brand-primary)" style={{ margin: '0 auto 1rem' }} />
          <h2 className="heading-2" style={{ marginBottom: '0.5rem' }}>Your Referral Code</h2>
          <p className="text-secondary" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>This code is permanent. Share it infinitely.</p>

          <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px dashed var(--brand-primary)', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '3px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
              {referralCode}
            </span>
            <button onClick={handleCopy} style={{ background: 'none', color: 'var(--brand-accent)', padding: '0.25rem' }} title="Copy code">
              {copied ? <CheckCircle size={22} color="var(--success)" /> : <Copy size={22} />}
            </button>
          </div>

          <button className="btn-primary" onClick={handleWhatsApp}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}>
            <Share2 size={18} /> Share via WhatsApp
          </button>
        </div>

        {/* Wallet Balance Card */}
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '2rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="heading-3">Wallet Balance</h3>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: balance > 0 ? 'var(--success)' : 'var(--text-secondary)' }}>₹{balance}</span>
          </div>

          <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span className="text-small text-secondary">Minimum Withdrawal</span>
              <span className="text-small" style={{ fontWeight: 600 }}>₹{minCashout}</span>
            </div>
            <div className="progress-container">
              <div className="progress-bar" style={{ width: `${progressPct}%`, backgroundColor: balance >= minCashout ? 'var(--success)' : 'var(--brand-accent)', transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              {balance >= minCashout ? '✅ Ready to withdraw!' : `₹${minCashout - balance} more to reach minimum`}
            </p>
          </div>

          <button className={balance >= minCashout ? 'btn-primary' : 'btn-secondary'}
            style={{ marginTop: 'auto' }}
            onClick={() => setShowCashout(true)}
            disabled={balance < minCashout}>
            {balance >= minCashout ? '💰 Withdraw to Bank / UPI' : `Reach ₹${minCashout} to Withdraw`}
          </button>
        </div>
      </div>

      {/* My Network Table */}
      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)', marginBottom: '2rem' }}>
        <h3 className="heading-3" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Users size={20} color="var(--brand-primary)" /> My Indoor Cricket Community
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
            {directRefs.length} player{directRefs.length !== 1 ? 's' : ''} referred
          </span>
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--bg-surface-elevated)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Player</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>GICL ID</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Joined</th>
                <th style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>Earned</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length > 0 ? ledger.map((entry, idx) => {
                const ref = entry['referred_id'] || {};
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 500 }}>
                      {ref.first_name || '—'} {ref.last_name || ''}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {ref.gicl_id || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(16,185,129,0.1)', color: 'var(--success)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>
                        Level {entry.level}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {ref.created_at ? new Date(ref.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--success)', fontWeight: 700 }}>
                      +₹{entry.amount_earned}
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    🏏 You haven't referred anyone yet.<br />Share your code to start earning!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cashout Modal */}
      {showCashout && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)', padding: '2rem', width: '100%', maxWidth: '440px', border: '1px solid var(--brand-primary)' }}>
            <h2 className="heading-2" style={{ marginBottom: '1.5rem' }}>Withdraw ₹{balance}</h2>
            <form onSubmit={handleCashout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Withdrawal Method</label>
                <select className="form-input" value={cashoutForm.method} onChange={e => setCashoutForm(f => ({ ...f, method: e.target.value }))}>
                  <option value="upi">UPI</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" min={minCashout} max={balance} required
                  placeholder={`Min ₹${minCashout}`}
                  value={cashoutForm.amount} onChange={e => setCashoutForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              {cashoutForm.method === 'upi' ? (
                <div>
                  <label className="form-label">UPI ID</label>
                  <input className="form-input" placeholder="yourname@upi" required
                    value={cashoutForm.upiId} onChange={e => setCashoutForm(f => ({ ...f, upiId: e.target.value }))} />
                </div>
              ) : (
                <>
                  <div>
                    <label className="form-label">Bank Name</label>
                    <input className="form-input" placeholder="HDFC Bank" required
                      value={cashoutForm.bankName} onChange={e => setCashoutForm(f => ({ ...f, bankName: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">Account Number</label>
                    <input className="form-input" placeholder="1234567890" required
                      value={cashoutForm.accountNo} onChange={e => setCashoutForm(f => ({ ...f, accountNo: e.target.value }))} />
                  </div>
                  <div>
                    <label className="form-label">IFSC Code</label>
                    <input className="form-input" placeholder="HDFC0001234" required
                      value={cashoutForm.ifscCode} onChange={e => setCashoutForm(f => ({ ...f, ifscCode: e.target.value }))} />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowCashout(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

    </motion.div>
  );
};

export default ReferralSystem;

