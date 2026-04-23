import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { bookingApi, getApiError, paymentApi } from "../api/client";
import { Loader } from "../components/Loader";
import { useToast } from "../context/ToastContext";

export const PaymentPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState("card");
  const [simulateSuccess, setSimulateSuccess] = useState(true);
  const { pushToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadBooking = async () => {
      try {
        const response = await bookingApi.get(`/bookings/${bookingId}`);
        setBooking(response.data);
      } catch (error) {
        pushToast({ title: "Failed to load booking", description: getApiError(error), tone: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadBooking();
  }, [bookingId, pushToast]);

  const handlePayment = async () => {
    try {
      setProcessing(true);
      const response = await paymentApi.post("/payments/process", { bookingId, method, simulateSuccess });
      pushToast({
        title: "Payment successful",
        description: `Booking ${response.data.booking.bookingId} is now confirmed.`,
        tone: "success",
      });
      navigate("/bookings");
    } catch (error) {
      pushToast({ title: "Payment result", description: getApiError(error), tone: "error" });
      navigate("/bookings");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <Loader label="Loading payment details..." />;
  }

  if (!booking) {
    return <div className="glass-panel p-6 text-sm text-slate">Booking could not be found.</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="glass-panel p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate">Checkout</p>
        <h2 className="mt-3 font-serif text-5xl italic">Booking payment</h2>
        <p className="mt-4 max-w-xl text-slate">
          Complete the mock payment to confirm your slot. If the payment fails or times out, the scheduler will release
          the reservation automatically.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white/70 p-5">
            <p className="text-sm text-slate">Booking ID</p>
            <p className="mt-2 text-xl font-semibold">{booking.bookingId}</p>
          </div>
          <div className="rounded-3xl bg-white/70 p-5">
            <p className="text-sm text-slate">Slot</p>
            <p className="mt-2 text-xl font-semibold">{booking.slotId}</p>
          </div>
          <div className="rounded-3xl bg-white/70 p-5">
            <p className="text-sm text-slate">Amount</p>
            <p className="mt-2 text-xl font-semibold">Rs {booking.amount}</p>
          </div>
        </div>
      </section>

      <section className="glass-panel p-6">
        <h3 className="text-2xl font-semibold">Mock payment panel</h3>
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Payment method</label>
            <select className="input-shell" value={method} onChange={(event) => setMethod(event.target.value)}>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
            <p className="text-sm font-medium">Simulation mode</p>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                className={simulateSuccess ? "button-primary flex-1" : "button-secondary flex-1"}
                onClick={() => setSimulateSuccess(true)}
              >
                Success
              </button>
              <button
                type="button"
                className={!simulateSuccess ? "button-danger flex-1" : "button-secondary flex-1"}
                onClick={() => setSimulateSuccess(false)}
              >
                Fail
              </button>
            </div>
          </div>
          <button type="button" className="button-primary w-full" onClick={handlePayment} disabled={processing}>
            {processing ? "Processing payment..." : `Pay Rs ${booking.amount}`}
          </button>
        </div>
      </section>
    </div>
  );
};

