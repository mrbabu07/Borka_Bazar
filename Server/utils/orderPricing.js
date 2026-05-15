function calculateOrderPricing({
  items = [],
  subtotal,
  totalPrice,
  total,
  deliveryCharge,
  deliveryFee,
  couponDiscount,
  totalDiscount,
  deliverySettings = {},
  area,
} = {}) {
  const calculatedItemSubtotal = Array.isArray(items)
    ? items.reduce(
        (sum, item) =>
          sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0,
      )
    : 0;
  const submittedDeliveryCharge = deliveryCharge ?? deliveryFee ?? 0;
  const rawSubtotal =
    subtotal ??
    (totalPrice !== undefined
      ? Number(totalPrice) - Number(submittedDeliveryCharge)
      : undefined) ??
    (total !== undefined ? Number(total) - Number(submittedDeliveryCharge) : undefined) ??
    calculatedItemSubtotal;
  const discountAmount = Number(totalDiscount ?? couponDiscount ?? 0) || 0;
  const finalSubtotal = Math.max(Number(rawSubtotal) || 0, 0);
  const chargeableSubtotal = Math.max(finalSubtotal - discountAmount, 0);

  let finalDeliveryCharge = Number(deliverySettings.standardDeliveryCharge) || 0;
  if (area && Array.isArray(deliverySettings.deliveryAreas)) {
    const areaSettings = deliverySettings.deliveryAreas.find(
      (item) => item.enabled && item.name?.toLowerCase() === area.toLowerCase(),
    );
    if (areaSettings) {
      finalDeliveryCharge = Number(areaSettings.charge) || finalDeliveryCharge;
    }
  }

  if (
    deliverySettings.freeDeliveryEnabled &&
    chargeableSubtotal >= (Number(deliverySettings.freeDeliveryThreshold) || 0)
  ) {
    finalDeliveryCharge = 0;
  }

  return {
    calculatedItemSubtotal,
    discountAmount,
    finalSubtotal,
    chargeableSubtotal,
    finalDeliveryCharge,
    finalTotal: chargeableSubtotal + finalDeliveryCharge,
  };
}

module.exports = { calculateOrderPricing };
