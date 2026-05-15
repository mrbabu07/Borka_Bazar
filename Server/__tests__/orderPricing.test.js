const { calculateOrderPricing } = require("../utils/orderPricing");

describe("calculateOrderPricing", () => {
  const deliverySettings = {
    standardDeliveryCharge: 100,
    deliveryAreas: [],
  };

  test("always charges delivery even when subtotal meets old free threshold", () => {
    const pricing = calculateOrderPricing({
      items: [{ price: 2500, quantity: 1 }],
      subtotal: 2500,
      totalDiscount: 400,
      deliverySettings,
    });

    expect(pricing.chargeableSubtotal).toBe(2100);
    expect(pricing.finalDeliveryCharge).toBe(100);
    expect(pricing.finalTotal).toBe(2200);
  });

  test("uses enabled area charge", () => {
    const pricing = calculateOrderPricing({
      items: [{ price: 500, quantity: 1 }],
      deliverySettings: {
        ...deliverySettings,
        deliveryAreas: [{ name: "Savar", charge: 150, enabled: true }],
      },
      area: "savar",
    });

    expect(pricing.finalDeliveryCharge).toBe(150);
    expect(pricing.finalTotal).toBe(650);
  });
});
