import { calculateCheckoutPricing } from "./checkoutPricing";

describe("checkout pricing", () => {
  test("always charges configured delivery fee even when subtotal is high", () => {
    const pricing = calculateCheckoutPricing({
      cartTotal: 5000,
      couponDiscount: 0,
      deliverySettings: {
        standardDeliveryCharge: 120,
      },
    });

    expect(pricing.deliveryCharge).toBe(120);
    expect(pricing.requiresDeliveryFeePayment).toBe(true);
    expect(pricing.finalTotal).toBe(5120);
  });

  test("uses discounted subtotal but keeps delivery charge", () => {
    const pricing = calculateCheckoutPricing({
      cartTotal: 2100,
      couponDiscount: 200,
      deliverySettings: {
        standardDeliveryCharge: 100,
      },
    });

    expect(pricing.chargeableSubtotal).toBe(1900);
    expect(pricing.deliveryCharge).toBe(100);
    expect(pricing.finalTotal).toBe(2000);
  });

  test("does not allow coupon discount to make subtotal negative", () => {
    const pricing = calculateCheckoutPricing({
      cartTotal: 300,
      couponDiscount: 500,
      deliverySettings: {
        standardDeliveryCharge: 100,
      },
    });

    expect(pricing.chargeableSubtotal).toBe(0);
    expect(pricing.finalTotal).toBe(100);
  });
});
