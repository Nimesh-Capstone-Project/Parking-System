import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { bookingApi, getApiError, parkingApi, paymentApi } from "../api/client";
import { Loader } from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const formatCurrency = (value) => `Rs ${Number(value || 0).toFixed(2)}`;

const toLocalDateTimeValue = (date) => {
  const value = new Date(date);
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60000).toISOString().slice(0, 16);
};

export const PaymentPage = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { pushToast } = useToast();
  const { user } = useAuth();
  const slotId = searchParams.get("slotId") || location.state?.slot?.slotId || "";
  const [booking, setBooking] = useState(null);
  const [slot, setSlot] = useState(location.state?.slot || null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [vehicleType, setVehicleType] = useState("2-wheeler");
  const [startTime, setStartTime] = useState(() => toLocalDateTimeValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [durationHours, setDurationHours] = useState("1");

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const vehicleOptions = [
    { value: "2-wheeler", label: "2-Wheeler", rate: slot?.pricing?.twoWheeler ?? 0 },
    { value: "4-wheeler", label: "4-Wheeler", rate: slot?.pricing?.fourWheeler ?? 0 },
  ];
  const selectedVehicle =
    vehicleOptions.find((option) => option.value === vehicleType) ||
    vehicleOptions[0] || { value: vehicleType, label: vehicleType, rate: 0 };
  const parsedDuration = Number(durationHours);
  const calculatedAmount =
    Number.isNaN(parsedDuration) || parsedDuration <= 0 ? 0 : Number((selectedVehicle.rate * parsedDuration).toFixed(2));

  let derivedEndTime = "";
  const parsedStartTime = new Date(startTime);
  if (!Number.isNaN(parsedStartTime.getTime()) && !Number.isNaN(parsedDuration) && parsedDuration > 0) {
    derivedEndTime = new Date(parsedStartTime.getTime() + parsedDuration * 60 * 60 * 1000).toLocaleString();
  }

  useEffect(() => {
    const loadState = async () => {
      try {
        if (bookingId) {
          const response = await bookingApi.get(`/bookings/${bookingId}`);
          setBooking(response.data);
          return;
        }

        if (!slotId) {
          return;
        }

        if (location.state?.slot?.slotId === slotId) {
          setSlot(location.state.slot);
          return;
        }

        const response = await parkingApi.get("/slots");
        setSlot(response.data.find((item) => item.slotId === slotId) || null);
      } catch (error) {
        pushToast({ title: "Failed to load payment details", description: getApiError(error), tone: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadState();
  }, [bookingId, location.state, pushToast, slotId]);

  const handlePayment = async () => {
    let redirectToBookings = Boolean(bookingId);
    let activeBookingId = bookingId;
    let activeBooking = booking;

    try {
      setProcessing(true);

      if (!activeBookingId) {
        const parsedStart = new Date(startTime);
        const duration = Number(durationHours);

        if (!slotId) {
          pushToast({ title: "Slot missing", description: "Select a slot before paying.", tone: "error" });
          return;
        }

        if (Number.isNaN(parsedStart.getTime())) {
          pushToast({ title: "Start time required", description: "Choose a valid booking start time.", tone: "error" });
          return;
        }

        if (Number.isNaN(duration) || duration <= 0) {
          pushToast({ title: "Invalid duration", description: "Duration must be greater than zero.", tone: "error" });
          return;
        }

        const bookingResponse = await bookingApi.post("/book-slot", {
          slotId,
          vehicleType,
          startTime: parsedStart.toISOString(),
          duration,
        });

        activeBookingId = bookingResponse.data.bookingId;
        activeBooking = bookingResponse.data.booking;
        setBooking(activeBooking);
        redirectToBookings = true;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay checkout");
      }

      const orderResponse = await paymentApi.post("/create-order", {
        bookingId: activeBookingId,
        amount: activeBooking?.totalAmount ?? activeBooking?.amount ?? calculatedAmount,
      });

      const options = {
        key: orderResponse.data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderResponse.data.amount,
        currency: orderResponse.data.currency,
        name: "Smart Parking System",
        description: "Slot Booking Payment",
        order_id: orderResponse.data.orderId,
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: "",
        },
        theme: {
          color: "#0f766e",
        },
        modal: {
          ondismiss: async () => {
            try {
              await paymentApi.post("/payments/fail", {
                bookingId: activeBookingId,
                razorpay_order_id: orderResponse.data.orderId,
                reason: "Payment cancelled",
              });
            } catch (_error) {
              // Let the scheduler clean up if cancellation request fails.
            } finally {
              setProcessing(false);
            }
          },
        },
        handler: async (response) => {
          try {
            const verifyResponse = await paymentApi.post("/verify-payment", {
              bookingId: activeBookingId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            pushToast({
              title: "Payment successful",
              description: `Booking ${verifyResponse.data.booking.bookingId} is now confirmed.`,
              tone: "success",
            });
            navigate("/bookings");
          } catch (error) {
            pushToast({ title: "Verification failed", description: getApiError(error), tone: "error" });
            navigate("/bookings");
          } finally {
            setProcessing(false);
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", async (response) => {
        try {
          await paymentApi.post("/payments/fail", {
            bookingId: activeBookingId,
            razorpay_order_id: orderResponse.data.orderId,
            reason: response.error?.description || "Payment failed",
          });
        } catch (_error) {
          // Let the scheduler clean up if cancellation request fails.
        }

        pushToast({
          title: "Payment failed",
          description: response.error?.description || "Razorpay payment could not be completed.",
          tone: "error",
        });
        setProcessing(false);
        navigate("/bookings");
      });
      razorpay.open();
    } catch (error) {
      pushToast({ title: "Payment result", description: getApiError(error), tone: "error" });
      if (redirectToBookings) {
        navigate("/bookings");
      }
    }
  };

  if (loading) {
    return <Loader label="Loading payment details..." />;
  }

  if (bookingId && !booking) {
    return <div className="glass-panel p-6 text-sm text-slate">Booking could not be found.</div>;
  }

  if (!bookingId && !slotId) {
    return <div className="glass-panel p-6 text-sm text-slate">Select a slot to begin the booking flow.</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <section className="glass-panel p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-slate">Checkout</p>
        <h2 className="mt-3 font-serif text-5xl italic">{booking ? "Booking payment" : "Complete your booking"}</h2>
        <p className="mt-4 max-w-xl text-slate">
          {booking
            ? "Complete the mock payment to confirm your slot. If the payment fails or times out, the scheduler will release the reservation automatically."
            : "Select your vehicle type and booking duration, review the price breakdown, and then complete payment."}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-white/70 p-5">
            <p className="text-sm text-slate">{booking ? "Booking ID" : "Slot"}</p>
            <p className="mt-2 text-xl font-semibold">{booking ? booking.bookingId : slotId}</p>
          </div>
          <div className="rounded-3xl bg-white/70 p-5">
            <p className="text-sm text-slate">{booking ? "Vehicle Type" : "Location"}</p>
            <p className="mt-2 text-xl font-semibold">{booking ? booking.vehicleType || "Legacy booking" : slot?.location || "Loading..."}</p>
          </div>
          <div className="rounded-3xl bg-white/70 p-5">
            <p className="text-sm text-slate">Amount</p>
            <p className="mt-2 text-xl font-semibold">
              {formatCurrency(booking?.totalAmount ?? booking?.amount ?? calculatedAmount)}
            </p>
          </div>
        </div>

        {!booking && (
          <div className="mt-8 space-y-4 rounded-3xl border border-ink/10 bg-white/65 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Vehicle type</label>
                <select className="input-shell" value={vehicleType} onChange={(event) => setVehicleType(event.target.value)}>
                  {vehicleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Duration (hours)</label>
                <input
                  className="input-shell"
                  max="24"
                  min="1"
                  step="1"
                  type="number"
                  value={durationHours}
                  onChange={(event) => setDurationHours(event.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Start time</label>
              <input
                className="input-shell"
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </div>

            <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
              <h3 className="text-lg font-semibold">Price summary</h3>
              <div className="mt-3 space-y-2 text-sm text-slate">
                <p>Vehicle: {selectedVehicle.label}</p>
                <p>Rate: {formatCurrency(selectedVehicle.rate)} / hour</p>
                <p>Start: {new Date(startTime).toLocaleString()}</p>
                <p>End: {derivedEndTime || "Choose a valid duration"}</p>
                <p>Duration: {durationHours} hour(s)</p>
                <p className="font-semibold text-ink">Total: {formatCurrency(calculatedAmount)}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="glass-panel p-6">
        <h3 className="text-2xl font-semibold">{booking ? "Razorpay checkout" : "Payment confirmation"}</h3>
        <div className="mt-6 space-y-4">
          <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
            <p className="text-sm font-medium">Summary</p>
            <div className="mt-3 space-y-2 text-sm text-slate">
              <p>Slot: {booking?.slotId || slotId}</p>
              <p>Vehicle: {booking?.vehicleType || selectedVehicle.label}</p>
              <p>Rate: {formatCurrency(booking?.ratePerHour ?? selectedVehicle.rate)} / hour</p>
              <p>Duration: {booking?.durationHours || booking?.duration || durationHours} hour(s)</p>
              <p>Total amount: {formatCurrency(booking?.totalAmount ?? booking?.amount ?? calculatedAmount)}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-ink/10 bg-white/70 p-4">
            <p className="text-sm font-medium">Checkout</p>
            <p className="mt-2 text-sm text-slate">
              Secure test payment is handled by Razorpay. Your booking will be confirmed only after backend signature
              verification succeeds.
            </p>
          </div>

          <button type="button" className="button-primary w-full" onClick={handlePayment} disabled={processing}>
            {processing ? "Opening Razorpay..." : `Pay ${formatCurrency(booking?.totalAmount ?? booking?.amount ?? calculatedAmount)}`}
          </button>
        </div>
      </section>
    </div>
  );
};
