const VEHICLE_RATES = {
  "2-wheeler": 20,
  "4-wheeler": 40,
};

const DEFAULT_VEHICLE_TYPE = "2-wheeler";

const getRatePerHour = (vehicleType) => VEHICLE_RATES[vehicleType] ?? null;

const calculateTotalAmount = ({ vehicleType, durationHours }) => {
  const ratePerHour = getRatePerHour(vehicleType);
  if (!ratePerHour || typeof durationHours !== "number" || Number.isNaN(durationHours) || durationHours <= 0) {
    return null;
  }

  return {
    ratePerHour,
    totalAmount: Number((ratePerHour * durationHours).toFixed(2)),
  };
};

const getPricingConfig = () => ({
  defaultVehicleType: DEFAULT_VEHICLE_TYPE,
  vehicleRates: VEHICLE_RATES,
  startingPricePerHour: VEHICLE_RATES[DEFAULT_VEHICLE_TYPE],
  currency: "INR",
});

module.exports = {
  calculateTotalAmount,
  getPricingConfig,
  getRatePerHour,
};
