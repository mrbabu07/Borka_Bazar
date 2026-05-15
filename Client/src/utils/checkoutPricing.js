export const DEFAULT_DELIVERY_SETTINGS = {
  freeDeliveryThreshold: 2000,
  standardDeliveryCharge: 100,
  freeDeliveryEnabled: true,
};

export function calculateCheckoutPricing({
  cartTotal = 0,
  couponDiscount = 0,
  deliverySettings = null,
} = {}) {
  const freeDeliveryThreshold =
    deliverySettings?.freeDeliveryThreshold ??
    DEFAULT_DELIVERY_SETTINGS.freeDeliveryThreshold;
  const deliveryChargeAmount =
    deliverySettings?.standardDeliveryCharge ??
    DEFAULT_DELIVERY_SETTINGS.standardDeliveryCharge;
  const freeDeliveryEnabled =
    deliverySettings?.freeDeliveryEnabled !== false;
  const chargeableSubtotal = Math.max(
    Number(cartTotal || 0) - Number(couponDiscount || 0),
    0,
  );
  const deliveryCharge =
    freeDeliveryEnabled && chargeableSubtotal >= freeDeliveryThreshold
      ? 0
      : deliveryChargeAmount;
  const finalTotal = chargeableSubtotal + deliveryCharge;
  const dueAmount = Math.max(finalTotal - deliveryCharge, 0);
  const amountNeededForFreeDelivery =
    freeDeliveryEnabled && chargeableSubtotal < freeDeliveryThreshold
      ? freeDeliveryThreshold - chargeableSubtotal
      : 0;

  return {
    freeDeliveryThreshold,
    deliveryChargeAmount,
    freeDeliveryEnabled,
    chargeableSubtotal,
    deliveryCharge,
    finalTotal,
    dueAmount,
    amountNeededForFreeDelivery,
  };
}
