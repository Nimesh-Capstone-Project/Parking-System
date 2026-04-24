const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      required: true,
    },
    bookingId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    vehicleType: {
      type: String,
      default: null,
    },
    durationHours: {
      type: Number,
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ["card", "upi", "wallet"],
      default: "card",
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    transactionRef: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Payment", paymentSchema);

