import { calculateCheckoutPricing } from "./checkoutPricing";

describe("checkout pricing", () => {
  test("uses discounted subtotal for free delivery eligibility", () => {
    const pricing = calculateCheckoutPricing({
      cartTotal: 2100,
      couponDiscount: 200,
      deliverySettings: {
        freeDeliveryThreshold: 2000,
        standardDeliveryCharge: 100,
        freeDeliveryEnabled: true,
      },
    });

    expect(pricing.chargeableSubtotal).toBe(1900);
    expect(pricing.deliveryCharge).toBe(100);
    expect(pricing.finalTotal).toBe(2000);
    expect(pricing.amountNeededForFreeDelivery).toBe(100);
  });

  test("keeps delivery free when discounted subtotal meets threshold", () => {
    const pricing = calculateCheckoutPricing({
      cartTotal: 2500,
      couponDiscount: 400,
      deliverySettings: {
        freeDeliveryThreshold: 2000,
        standardDeliveryCharge: 100,
        freeDeliveryEnabled: true,
      },
    });

    expect(pricing.chargeableSubtotal).toBe(2100);
    expect(pricing.deliveryCharge).toBe(0);
    expect(pricing.finalTotal).toBe(2100);
  });

  test("charges delivery when free delivery is disabled", () => {
    const pricing = calculateCheckoutPricing({
      cartTotal: 5000,
      couponDiscount: 0,
      deliverySettings: {
        freeDeliveryThreshold: 2000,
        standardDeliveryCharge: 120,
        freeDeliveryEnabled: false,
      },
    });

    expect(pricing.deliveryCharge).toBe(120);
    expect(pricing.finalTotal).toBe(5120);
    expect(pricing.amountNeededForFreeDelivery).toBe(0);
  });

  test("does not allow coupon discount to make subtotal negative", () => {
    const pricing = calculateCheckoutPricing({
      cartTotal: 300,
      couponDiscount: 500,
      deliverySettings: {
        freeDeliveryThreshold: 2000,
        standardDeliveryCharge: 100,
        freeDeliveryEnabled: true,
      },
    });

    expect(pricing.chargeableSubtotal).toBe(0);
    expect(pricing.finalTotal).toBe(100);
  });
});
