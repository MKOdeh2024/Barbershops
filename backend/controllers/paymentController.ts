// backend/controllers/paymentController.js
import { AppDataSource } from '../config/db.js';
import Payment from '../config/models/Payment.js';
import Booking from '../config/models/Booking.js'; // Needed to update booking status

const paymentRepository = AppDataSource.getRepository(Payment);
const bookingRepository = AppDataSource.getRepository(Booking);

// @desc    Process a payment for a booking (placeholder - integrates with gateway)
// @route   POST /api/payments/process/:bookingId
// @access  Private (Client)
export const processPayment = async (req, res) => {
    const booking_id = req.params.bookingId;
    const { paymentMethodDetails } = req.body; // e.g., card token from Stripe/PayPal
    const userId = req.user?.userId;

    try {
        const booking = await bookingRepository.findOne({ where: { booking_id, user_id: userId }, relations: ['payment'] });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found or does not belong to user' });
        }
        if (booking.payment_status === 'Paid') {
            return res.status(400).json({ message: 'Booking already paid' });
        }

        // --- Placeholder for Payment Gateway Integration ---
        // 1. Call payment gateway API with booking.total_price and paymentMethodDetails
        // const paymentResult = await paymentGateway.charges.create({
        //     amount: booking.total_price * 100, // Amount in cents/smallest unit
        //     currency: 'usd', // Or your currency
        //     source: paymentMethodDetails.token, // Example
        //     description: `Payment for Booking #${booking_id}`,
        //     metadata: { booking_id },
        // });

        const paymentResult = { success: true, transactionId: `txn_${Date.now()}`, amount: booking.total_price, method: 'Credit Card', message: 'Payment successful', error: 'Payment failed'}; // MOCK SUCCESS
        // const paymentResult = { success: false, message: 'Insufficient funds' }; // MOCK FAILURE // MOCK SUCCESS
        // const paymentResult = { success: false, message: 'Insufficient funds' }; // MOCK FAILURE
        // --- End Placeholder ---


        let payment = booking.payment; // Check if a payment record already exists
        if (!payment) {
            payment = new Payment();
            payment.booking_id = parseInt(booking_id, 10);
        }

        payment.amount = paymentResult.amount || booking.total_price; // Use amount from result if available
        payment.payment_date = new Date();
        payment.payment_method = paymentResult.method || 'Unknown'; // Get method from result

        if (paymentResult.success) {
            payment.payment_status = 'Completed';
            payment.transaction_id = paymentResult.transactionId;
            booking.payment_status = 'Paid'; // Update booking status
        } else {
            payment.payment_status = 'Failed';
            // Maybe log failure reason
        }

        await AppDataSource.transaction(async transactionalEntityManager => {
             await transactionalEntityManager.save(payment);
             await transactionalEntityManager.save(booking);
        });

        if(paymentResult.success) {
            // TODO: Trigger payment confirmation notification
            res.json({ success: true, message: 'Payment successful', payment });
        } else {
            res.status(400).json({ success: false, message: 'Payment failed', payment, error: paymentResult.error });
        }


    } catch (error) {
        console.error('Payment processing error:', error);
        res.status(500).json({ message: 'Server Error processing payment' });
    }
};

// @desc    Handle Payment Gateway Webhook (e.g., for async updates)
// @route   POST /api/payments/webhook
// @access  Public (Secured by webhook signature verification)
export const handlePaymentWebhook = async (req, res) => {
    const signature = req.headers['stripe-signature']; // Example for Stripe
    const rawBody = req.rawBody; // Need raw body for signature verification

    try {
        // TODO: Verify webhook signature from the payment gateway to ensure authenticity
        // event = paymentGateway.webhooks.constructEvent(rawBody, signature, process.env.PAYMENT_WEBHOOK_SECRET);

        const event = req.body; // Using parsed body directly for placeholder

        // Handle the event type (e.g., 'payment_intent.succeeded', 'charge.refunded')
        if (event.type === 'payment_intent.succeeded' || event.type === 'charge.succeeded') {
            const paymentIntent = event.data.object;
            const bookingId = paymentIntent.metadata?.booking_id; // Retrieve booking ID from metadata

            if (bookingId) {
                const booking = await bookingRepository.findOneBy({ booking_id: bookingId });
                const payment = await paymentRepository.findOneBy({ booking_id: bookingId });

                if (booking && payment && payment.payment_status !== 'Completed') {
                     payment.payment_status = 'Completed';
                     payment.transaction_id = paymentIntent.id; // Use actual transaction ID
                     booking.payment_status = 'Paid';

                     await AppDataSource.transaction(async transactionalEntityManager => {
                         await transactionalEntityManager.save(payment);
                         await transactionalEntityManager.save(booking);
                     });
                     console.log(`Webhook: Payment confirmed for booking ${bookingId}`);
                }
            }
        } else if (event.type === 'charge.refunded') {
             // Handle refunds
        } else {
            console.log(`Unhandled webhook event type: ${event.type}`);
        }

        res.status(200).json({ received: true }); // Acknowledge receipt

    } catch (err: any) {
        console.error('Webhook error:', err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
};

// @desc    Get payment details for a booking
// @route   GET /api/payments/booking/:bookingId
// @access  Private (Owner or Admin)
export const getPaymentByBookingId = async (req, res) => {
  try {
    // TODO: Authorization
    const payment = await paymentRepository.findOne({ where: { booking_id: req.params.bookingId } });
    if (payment) {
      res.json(payment);
    } else {
      // It's okay if no payment record exists yet for a pending booking
      res.status(404).json({ message: 'Payment details not found for this booking' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error fetching payment details' });
  }
};