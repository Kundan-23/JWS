const crypto   = require('crypto');
const razorpay = require('../config/razorpay');
const supabase = require('../config/supabase');
const asyncHandler = require('../utils/asyncHandler');

// ─── POST /api/payment/create-order ────────────────────────
exports.createOrder = asyncHandler(async (req, res) => {
  const { planId } = req.body;

  // Get plan details from config
  const { data: config } = await supabase
    .from('app_config')
    .select('plans')
    .eq('id', 1)
    .single();

  const plans = config?.plans || [];
  const plan  = plans.find((p) => p.id === planId);

  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found.' });
  }

  const amountInPaise = Math.round(plan.price * 100); // Razorpay uses paise

  // Receipt must be ≤40 chars
  const shortId = req.user.id.replace(/-/g, '').slice(0, 16);
  const receipt = `jws_${shortId}_${Date.now().toString().slice(-8)}`;

  let order;
  try {
    order = await razorpay.orders.create({
      amount:   amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        playerId: req.user.id,
        planId,
        planName: plan.name,
        company:  'JWS 2026',
      },
    });
  } catch (rzpErr) {
    const msg = rzpErr?.error?.description || rzpErr?.message || 'Razorpay order creation failed.';
    return res.status(502).json({ success: false, message: msg });
  }

  // Save order ID to player record
  await supabase.from('players').update({ payment_order_id: order.id }).eq('id', req.user.id);

  res.json({
    success:  true,
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    keyId:    process.env.RAZORPAY_KEY_ID,
    planName: plan.name,
  });
});

// ─── POST /api/payment/verify ───────────────────────────────
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  // HMAC-SHA256 signature verification
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
  }

  // Get plan from Razorpay order notes
  const order = await razorpay.orders.fetch(razorpay_order_id);
  const planId = order.notes?.planId;

  // Update player: mark paid
  const { error } = await supabase
    .from('players')
    .update({
      payment_status: 'paid',
      payment_id:     razorpay_payment_id,
      plan:           planId,
    })
    .eq('id', req.user.id);

  if (error) throw new Error('Failed to update payment status: ' + error.message);

  res.json({
    success:   true,
    message:   'Payment verified! Please complete your profile to continue.',
    paymentId: razorpay_payment_id,
  });
});
