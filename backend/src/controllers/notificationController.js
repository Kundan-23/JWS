const supabase = require('../config/supabase');

/**
 * Helper to create a notification internally from other controllers
 */
exports.createNotification = async (userId, userType, title, message, type, link = null) => {
  try {
    const { error } = await supabase.from('notifications').insert([{
      user_id: userId,
      user_type: userType,
      title,
      message,
      type,
      link
    }]);
    if (error) {
      console.error('[Notification Error] Failed to insert notification:', error.message);
    }
  } catch (err) {
    console.error('[Notification Error] Exception:', err.message);
  }
};

/**
 * Helper to notify all admins
 */
exports.notifyAdmins = async (title, message, type, link = null) => {
  try {
    const [ { data: adminsTable }, { data: playerAdmins } ] = await Promise.all([
      supabase.from('admins').select('id'),
      supabase.from('players').select('id').eq('role', 'admin')
    ]);
    
    const allAdmins = [...(adminsTable || []), ...(playerAdmins || [])];
    if (allAdmins.length === 0) return;
    
    const uniqueIds = [...new Set(allAdmins.map(a => a.id))];

    const payloads = uniqueIds.map(id => ({
      user_id: id,
      user_type: 'admin',
      title,
      message,
      type,
      link
    }));
    
    const { error } = await supabase.from('notifications').insert(payloads);
    if (error) console.error('[Notification Error] notifyAdmins insert failed:', error.message);
  } catch (err) {
    console.error('[Notification Error] notifyAdmins exception:', err.message);
  }
};

/**
 * GET /api/notifications
 * Fetch user's notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const userType = req.user.role || 'player';

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('user_type', userType)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    console.error('[getNotifications]', err);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('[markAsRead]', err);
    res.status(500).json({ success: false, message: 'Failed to mark as read' });
  }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for the user
 */
exports.markAllAsRead = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const userType = req.user.role || 'player';

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('user_type', userType)
      .eq('is_read', false);

    if (error) throw error;

    res.json({ success: true });
  } catch (err) {
    console.error('[markAllAsRead]', err);
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a specific notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user.id;
    const userType = req.user.role || 'player';

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', userId)
      .eq('user_type', userType);

    if (error) throw error;
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    console.error('[deleteNotification]', err);
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
};
