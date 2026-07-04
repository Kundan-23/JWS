import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, ChevronDown, ChevronUp, Star } from 'lucide-react';
import Swal from 'sweetalert2';
import FaqAccordionList from '../../components/FaqAccordionList';
import { useConfig } from '../../context/ConfigContext';
import { paymentAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useFormStore } from '../../store/useFormStore';


const Step3_Payment = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { plans } = useConfig();
  const { basicInfo } = useFormStore();

  const [selectedPack, setSelectedPack] = useState(null);
  const [expandedPack, setExpandedPack] = useState(null);
  const [tcScrolled, setTcScrolled] = useState(false);
  const [paying, setPaying] = useState(false);
  const tcRef = useRef(null);

  // Load Razorpay script once
  useEffect(() => {
    if (document.getElementById('razorpay-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  // Map plans to UI format
  const pricingTiers = plans.map(tier => ({
    ...tier,
    title: tier.name,
    tc: tier.terms,
    best: tier.id === 'elite'
  }));

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    // If scrolled to bottom (allow 5px margin of error)
    if (Math.abs(scrollHeight - clientHeight - scrollTop) < 5) {
      setTcScrolled(true);
    }
  };

  const handleSelectPack = (packId) => {
    setSelectedPack(packId);
    setTcScrolled(false); // Reset T&C scroll state when changing packs
    // Reset scroll position if ref exists
    if (tcRef.current) {
      tcRef.current.scrollTop = 0;
    }
  };

  const toggleExpand = (e, packId) => {
    e.stopPropagation();
    setExpandedPack(expandedPack === packId ? null : packId);
  };

  const handlePayment = async () => {
    if (!selectedPack || !tcScrolled) return;
    const plan = pricingTiers.find(p => p.id === selectedPack);
    setPaying(true);
    try {
      // 1. Create order on backend
      const orderRes = await paymentAPI.createOrder(selectedPack);
      const { orderId, amount, currency, keyId } = orderRes.data;

      // 2. Open Razorpay checkout
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'JWS Sports',
        description: plan.title,
        order_id: orderId,
        prefill: { email: user?.email || '' },
        theme: { color: '#cbf905' },
        handler: async (response) => {
          try {
            // 3. Verify payment on backend
            await paymentAPI.verifyPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              planId: selectedPack,
            });
            
            // Update Auth Context & Local Storage to unblock navigation
            const updatedUser = { ...user, payment_status: 'paid', plan: selectedPack };
            setUser(updatedUser);
            localStorage.setItem('jws_user', JSON.stringify(updatedUser));

            Swal.fire({ icon: 'success', title: 'Payment Successful! 🎉',
              text: `Welcome to JWS Sports!`,
              background: 'var(--bg-surface)', color: 'var(--text-primary)',
              confirmButtonColor: '#cbf905', timer: 2500, showConfirmButton: false });
            setTimeout(() => navigate('/onboarding/step4'), 2500);
          } catch {
            Swal.fire({ icon: 'error', title: 'Verification Failed',
              text: 'Payment was received but verification failed. Contact support.',
              background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
          } finally { setPaying(false); }
        },
        modal: { ondismiss: () => setPaying(false) },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error',
        text: err.response?.data?.message || 'Could not initiate payment. Try again.',
        background: 'var(--bg-surface)', color: 'var(--text-primary)', confirmButtonColor: '#cbf905' });
      setPaying(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <div style={{ marginBottom: '2rem' }}>
        <h2 className="heading-2">Registration Fee</h2>
        <p className="text-secondary" style={{ marginTop: '0.5rem' }}>Please pay to complete your registration.</p>
        
        {/* Progress Bar */}
        <div className="progress-container" style={{ marginTop: '1rem' }}>
          <div className="progress-bar" style={{ width: '50%' }}></div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {pricingTiers.map((pack) => {
          const isSelected = selectedPack === pack.id;
          const isExpanded = expandedPack === pack.id;

          return (
            <div 
              key={pack.id}
              onClick={() => handleSelectPack(pack.id)}
              style={{
                backgroundColor: isSelected ? 'rgba(255, 199, 44, 0.05)' : 'var(--bg-surface)',
                border: `2px solid ${isSelected ? 'var(--brand-primary)' : 'var(--bg-surface-elevated)'}`,
                borderRadius: 'var(--radius-xl)',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {pack.best && (
                <div style={{ position: 'absolute', top: 0, right: 0, backgroundColor: 'var(--brand-accent)', color: '#fff', fontSize: '0.7rem', fontWeight: 800, padding: '0.25rem 1rem', borderBottomLeftRadius: 'var(--radius-md)' }}>
                  BEST PACK
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--brand-primary)' : 'var(--text-secondary)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--brand-primary)' }} />}
                  </div>
                  <div>
                    <h3 className="heading-3" style={{ color: pack.best ? 'var(--brand-primary)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {pack.title} {pack.best && <Star size={16} fill="var(--brand-primary)" />}
                    </h3>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{pack.price}</span>
                  <button onClick={(e) => toggleExpand(e, pack.id)} style={{ background: 'none', color: 'var(--text-secondary)' }}>
                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--bg-surface-elevated)' }}>
                      <p className="text-small" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>What's included:</p>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {pack.features.map((feature, idx) => (
                          <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                            <CheckCircle2 size={16} color="var(--success)" /> {feature}
                          </li>
                        ))}
                      </ul>
                      
                      {pack.faqs && pack.faqs.length > 0 && (
                        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--bg-surface-elevated)' }}>
                          <p className="text-small" style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Frequently Asked Questions:</p>
                          <FaqAccordionList faqs={pack.faqs} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedPack && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ backgroundColor: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--bg-surface-elevated)' }}
          >
            <h4 className="heading-3" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="var(--brand-primary)" /> Terms & Conditions
            </h4>
            <p className="text-small" style={{ color: 'var(--brand-accent)', marginBottom: '0.5rem' }}>
              Please scroll to the bottom of the terms to enable payment.
            </p>
            
            <div 
              ref={tcRef}
              onScroll={handleScroll}
              style={{ 
                height: '150px', 
                overflowY: 'auto', 
                backgroundColor: 'var(--bg-color)', 
                padding: '1rem', 
                borderRadius: 'var(--radius-md)', 
                fontSize: '0.875rem', 
                color: 'var(--text-secondary)',
                border: '1px solid var(--bg-surface-elevated)',
                whiteSpace: 'pre-wrap',
                marginBottom: '1.5rem'
              }}
            >
              {pricingTiers.find(p => p.id === selectedPack).tc}
            </div>

            <button 
              className="btn-primary" 
              style={{ width: '100%', opacity: (tcScrolled && !paying) ? 1 : 0.5, cursor: (tcScrolled && !paying) ? 'pointer' : 'not-allowed' }}
              onClick={handlePayment}
              disabled={!tcScrolled || paying}
            >
              {paying ? 'Processing...' : `Pay ₹${pricingTiers.find(p => p.id === selectedPack)?.price} & Continue`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default Step3_Payment;

