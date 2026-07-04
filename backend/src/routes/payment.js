const express = require('express');
const { z }   = require('zod');
const { authenticate, authorize } = require('../middlewares/auth');
const validate          = require('../middlewares/validate');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

const createOrderSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
});

const verifySchema = z.object({
  razorpay_order_id:   z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature:  z.string(),
});

router.post('/create-order', authenticate, authorize('player'), validate(createOrderSchema), paymentController.createOrder);
router.post('/verify',       authenticate, authorize('player'), validate(verifySchema),      paymentController.verifyPayment);



module.exports = router;
