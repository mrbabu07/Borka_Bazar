export const DEFAULT_DELIVERY_SETTINGS = {
  standardDeliveryCharge: 100,
};

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
  const isFreeDelivery = false;
  const finalTotal = chargeableSubtotal + deliveryCharge;
  const dueAmount = Math.max(finalTotal - deliveryCharge, 0);

  return {
    deliveryChargeAmount,
    freeDeliveryEnabled: false,
    chargeableSubtotal,
    deliveryCharge,
    isFreeDelivery,
    requiresDeliveryFeePayment: deliveryCharge > 0,
    codAvailable: false,
    finalTotal,
    dueAmount,
    amountNeededForFreeDelivery: 0,
  };
}
