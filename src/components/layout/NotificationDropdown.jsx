import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Calendar, IndianRupee, Video, Users, CheckCircle, Info, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNotificationStore } from '../../store/useNotificationStore';

const NotificationDropdown = ({ isOpen, onClose, roleId, roleType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  
  const { 
    notifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    subscribeToRealtime,
    unsubscribeRealtime
  } = useNotificationStore();

  useEffect(() => {
    if (roleId && roleType) {
      // Initial fetch and subscription
      fetchNotifications();
      subscribeToRealtime(roleId, roleType);
    }
    return () => unsubscribeRealtime();
  }, [roleId, roleType]);

  // Refetch every time the dropdown is opened, as a fallback for Realtime
  useEffect(() => {
    if (isOpen && roleId && roleType) {
      fetchNotifications();
    }
  }, [isOpen, roleId, roleType]);

  // Refetch on route change as a fallback for Realtime
  useEffect(() => {
    if (roleId && roleType) {
      fetchNotifications();
    }
  }, [location.pathname, roleId, roleType]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target) && !e.target.closest('.notif-trigger')) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleNotificationClick = (notif) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'match_update': return <Calendar size={18} className="text-blue-500" />;
      case 'match_booking': return <Calendar size={18} className="text-purple-500" />;
      case 'referral': return <IndianRupee size={18} className="text-green-500" />;
      case 'video_upload': return <Video size={18} className="text-red-500" />;
      case 'registration': return <Users size={18} className="text-yellow-500" />;
      case 'cashout': return <IndianRupee size={18} className="text-emerald-500" />;
      default: return <Info size={18} className="text-gray-400" />;
    }
  };

  const formatTime = (isoString) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'absolute',
            top: '60px',
            right: '20px',
            width: '320px',
            maxHeight: '400px',
            backgroundColor: '#1E1E1E',
            border: '1px solid #333',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#fff' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                style={{ background: 'none', border: 'none', color: 'var(--primary-color)', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <CheckCircle size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '300px' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#888' }}>
                <Bell size={32} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '12px 15px',
                    borderBottom: '1px solid #2a2a2a',
                    backgroundColor: n.is_read ? 'transparent' : 'rgba(255, 69, 0, 0.05)',
                    cursor: n.link ? 'pointer' : 'default',
                    display: 'flex',
                    gap: '12px',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => { if (n.link) e.currentTarget.style.backgroundColor = '#2a2a2a' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = n.is_read ? 'transparent' : 'rgba(255, 69, 0, 0.05)' }}
                >
                  <div style={{ marginTop: '2px' }}>{getIcon(n.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: n.is_read ? '500' : '600', color: n.is_read ? '#ccc' : '#fff' }}>
                        {n.title}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!n.is_read && (
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', marginTop: '4px' }} />
                        )}
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                          style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '2px' }}
                          title="Clear notification"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#888', lineHeight: '1.4' }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '10px', color: '#555' }}>{formatTime(n.created_at)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding: '10px', borderTop: '1px solid #333', textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#555' }}>Notifications automatically clear after 30 days</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationDropdown;
