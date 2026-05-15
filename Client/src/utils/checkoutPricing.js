export const DEFAULT_DELIVERY_SETTINGS = {
  standardDeliveryCharge: 100,
  paymentOption: "delivery_fee_first",
};

export const PAYMENT_OPTIONS = {
  DELIVERY_FEE_FIRST: "delivery_fee_first",
  COD: "cod",
  FULL_PAYMENT: "full_payment",
};

const normalizePaymentOption = (value) =>
  Object.values(PAYMENT_OPTIONS).includes(value)
    ? value
    : PAYMENT_OPTIONS.DELIVERY_FEE_FIRST;

export function calculateCheckoutPricing({
  cartTotal = 0,
  couponDiscount = 0,
  deliverySettings = null,
} = {}) {
  const deliveryChargeAmount =
    deliverySettings?.standardDeliveryCharge ??
    DEFAULT_DELIVERY_SETTINGS.standardDeliveryCharge;
  const chargeableSubtotal = Math.max(
    Number(cartTotal || 0) - Number(couponDiscount || 0),
    0,
  );
  const deliveryCharge = Number(deliveryChargeAmount) || 0;
  const paymentOption = normalizePaymentOption(
    deliverySettings?.paymentOption || DEFAULT_DELIVERY_SETTINGS.paymentOption,
  );
  const isFreeDelivery = false;
  const finalTotal = chargeableSubtotal + deliveryCharge;
  const advancePaymentAmount =
    paymentOption === PAYMENT_OPTIONS.FULL_PAYMENT
      ? finalTotal
      : paymentOption === PAYMENT_OPTIONS.DELIVERY_FEE_FIRST
        ? deliveryCharge
        : 0;
  const dueAmount = Math.max(finalTotal - advancePaymentAmount, 0);

  return {
    paymentOption,
    deliveryChargeAmount,
    freeDeliveryEnabled: false,
    chargeableSubtotal,
    deliveryCharge,
    isFreeDelivery,
    requiresDeliveryFeePayment:
      paymentOption === PAYMENT_OPTIONS.DELIVERY_FEE_FIRST && deliveryCharge > 0,
    requiresFullPayment:
      paymentOption === PAYMENT_OPTIONS.FULL_PAYMENT && finalTotal > 0,
    requiresOnlinePayment:
      paymentOption !== PAYMENT_OPTIONS.COD && advancePaymentAmount > 0,
    codAvailable: paymentOption === PAYMENT_OPTIONS.COD,
    advancePaymentAmount,
    finalTotal,
    dueAmount,
    amountNeededForFreeDelivery: 0,
  };
}
