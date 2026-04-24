const Payment = require("../models/Payment");
const { bookingClient, internalHeaders, notificationClient } = require("../config/http");

const buildPaymentId = () => `PAY-${Date.now()}${Math.floor(Math.random() * 1000)}`;
const buildTransactionRef = () => `TXN-${Date.now()}${Math.floor(Math.random() * 10000)}`;
const buildPaymentSummary = (booking) => ({
  bookingId: booking.bookingId,
  slotId: booking.slotId,
  vehicleType: booking.vehicleType,
  startTime: booking.startTime,
  endTime: booking.endTime,
  duration: booking.duration ?? booking.durationHours ?? null,
  durationHours: booking.durationHours ?? booking.duration ?? null,
  ratePerHour: booking.ratePerHour ?? null,
  totalAmount: booking.totalAmount ?? booking.amount,
});

const sendNotification = async ({ recipientUserId, bookingId, type, message, metadata = {} }) => {
  try {
    await notificationClient.post(
      "/internal/notify",
      { recipientUserId, bookingId, type, message, channel: "console", metadata },
      { headers: internalHeaders() }
    );
  } catch (error) {
    console.error("Payment notification failed", error.response?.data || error.message);
  }
};

const processPayment = async (req, res) => {
  try {
    const { bookingId, method = "card", simulateSuccess = true } = req.body;
    if (!bookingId) {
      return res.status(400).json({ message: "bookingId is required" });
    }

    const bookingResponse = await bookingClient.get(`/internal/bookings/${bookingId}`, {
      headers: internalHeaders(),
    });
    const booking = bookingResponse.data;

    if (req.user.role !== "admin" && booking.userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied for this booking" });
    }
    if (booking.status !== "pending") {
      return res.status(400).json({ message: `Cannot pay for a ${booking.status} booking` });
    }

    const summary = buildPaymentSummary(booking);

    const payment = await Payment.create({
      paymentId: buildPaymentId(),
      bookingId,
      userId: booking.userId,
      vehicleType: booking.vehicleType || null,
      durationHours: booking.durationHours ?? booking.duration ?? null,
      amount: summary.totalAmount,
      method,
      status: simulateSuccess ? "success" : "failed",
      transactionRef: buildTransactionRef(),
    });

    if (simulateSuccess) {
      const confirmResponse = await bookingClient.post(
        `/internal/bookings/${bookingId}/confirm`,
        {},
        { headers: internalHeaders() }
      );
      await sendNotification({
        recipientUserId: booking.userId,
        bookingId,
        type: "payment_success",
        message: `Payment successful for booking ${bookingId}.`,
        metadata: { ...summary, method, paymentId: payment.paymentId },
      });
      return res.json({
        message: "Payment successful",
        summary,
        payment,
        booking: confirmResponse.data.booking,
      });
    }

    const cancelResponse = await bookingClient.post(
      `/internal/bookings/${bookingId}/cancel`,
      {},
      { headers: internalHeaders() }
    );
    await sendNotification({
      recipientUserId: booking.userId,
      bookingId,
      type: "payment_failed",
      message: `Payment failed for booking ${bookingId}.`,
      metadata: { ...summary, method, paymentId: payment.paymentId },
    });

    return res.status(400).json({
      message: "Payment failed",
      summary,
      payment,
      booking: cancelResponse.data.booking,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Payment processing failed",
      error: error.response?.data?.message || error.message,
    });
  }
};

const getPayments = async (req, res) => {
  const query = req.user.role === "admin" ? {} : { userId: req.user.id };
  const payments = await Payment.find(query).sort({ createdAt: -1 });
  return res.json(payments);
};

module.exports = { getPayments, processPayment };

