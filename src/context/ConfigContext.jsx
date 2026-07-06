import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const ConfigContext = createContext(null);

// Default fallback values while loading
const DEFAULTS = {
  plans:          [],
  ball_types:     [],
  batting_styles: ['Right-hand Bat', 'Left-hand Bat'],
  bowling_styles: ['Right-arm Fast', 'Right-arm Off Spin', 'Left-arm Orthodox', 'Right-arm Leg Spin', 'None'],
  jersey_sizes:   ['S', 'M', 'L', 'XL', 'XXL'],
  clubs:          [],
  age_groups:     [],
  banners:        [],
  ad_banners:     [],
  landing_bg_image:   '',
  registration_terms: '',
  appLogoUrl:         '',
  referral:  { 
    level1: 50, level2: 20, level3plus: 10, minCashout: 500,
    level1Name: 'Level 1', level2Name: 'Level 2', level3Name: 'Level 3+',
    level1Active: true, level2Active: true, level3Active: true
  },
  maxSquadSize: 20,
  jersey_measure_url: '',
  kids_jersey_measure_urls: [],
  adults_jersey_measure_urls: [],
};

// Helper to load initially cached config
const getInitialConfig = () => {
  try {
    const cached = localStorage.getItem('jws_app_config');
    if (cached) {
      return { ...DEFAULTS, ...JSON.parse(cached) };
    }
  } catch (e) {
    console.warn('[ConfigContext] Failed to load cached config:', e);
  }
  return DEFAULTS;
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig]   = useState(getInitialConfig);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchConfig = useCallback(async (force = false) => {
    // Don't re-fetch if loaded within last 60 seconds, unless forced
    if (!force && lastFetched && Date.now() - lastFetched < 60_000) return;

    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await axios.get(`${base}/config`);
      if (res.data?.success && res.data?.config) {
        const configData = res.data.config;
        if (configData.app_logo_url) {
          configData.appLogoUrl = configData.app_logo_url;
        }
        const merged = { ...DEFAULTS, ...configData };
        setConfig(merged);
        try {
          localStorage.setItem('jws_app_config', JSON.stringify(configData));
        } catch (e) {
          console.warn('[ConfigContext] Failed to write cache:', e);
        }
        setLastFetched(Date.now());
      }
    } catch (err) {
      console.warn('[ConfigContext] Failed to fetch config, keeping cache/defaults:', err.message);
      try {
        const cached = localStorage.getItem('jws_app_config');
        if (cached) {
          setConfig({ ...DEFAULTS, ...JSON.parse(cached) });
        }
      } catch (e) {
        console.warn('[ConfigContext] Failed to load cached fallback config:', e);
      }
    } finally {
      setLoading(false);
    }
  }, [lastFetched]);

  // Initial fetch on mount
  useEffect(() => {
    fetchConfig(true);
  }, []);

  // Re-fetch when the browser tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchConfig();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchConfig]);

  const value = {
    // Spread all config fields
    ...config,
    loading,
    refetch: () => fetchConfig(true),
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

/**
 * useConfig() — drop-in replacement for useConfigStore()
 * Returns all config fields from the live backend, plus a refetch() method.
 */
export const useConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within <ConfigProvider>');
  return ctx;
};

export default ConfigContext;
