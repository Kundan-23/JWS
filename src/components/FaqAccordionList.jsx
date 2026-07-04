import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const FaqAccordionList = ({ faqs }) => {
  const [openIndex, setOpenIndex] = useState(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {faqs.map((faq, idx) => {
        const isOpen = openIndex === idx;
        return (
          <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <button
              onClick={() => setOpenIndex(isOpen ? null : idx)}
              style={{
                width: '100%', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                padding: '0.85rem 1rem', background: 'none', border: 'none', color: 'var(--brand-primary)',
                cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.9rem'
              }}
            >
              <span style={{ paddingRight: '1rem', lineHeight: 1.4 }}>{faq.q}</span>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexShrink: 0, color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                <ChevronDown size={18} />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div style={{ padding: '0 1rem 1rem 1rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordionList;
