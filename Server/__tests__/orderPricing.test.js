const { calculateOrderPricing } = require("../utils/orderPricing");

describe("calculateOrderPricing", () => {
  const deliverySettings = {
    standardDeliveryCharge: 100,
    freeDeliveryEnabled: true,
    freeDeliveryThreshold: 2000,
    deliveryAreas: [],
  };

  test("charges delivery when coupon drops subtotal below free threshold", () => {
    const pricing = calculateOrderPricing({
      items: [{ price: 2100, quantity: 1 }],
      subtotal: 2100,
      totalDiscount: 200,
      deliverySettings,
    });

    expect(pricing.chargeableSubtotal).toBe(1900);
    expect(pricing.finalDeliveryCharge).toBe(100);
    expect(pricing.finalTotal).toBe(2000);
  });

  test("keeps free delivery when discounted subtotal meets threshold", () => {
    const pricing = calculateOrderPricing({
      items: [{ price: 2500, quantity: 1 }],
      subtotal: 2500,
      totalDiscount: 400,
      deliverySettings,
    });

    expect(pricing.chargeableSubtotal).toBe(2100);
    expect(pricing.finalDeliveryCharge).toBe(0);
    expect(pricing.finalTotal).toBe(2100);
  });

  test("uses enabled area charge before free delivery check", () => {
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
