import { calculateCheckoutPricing } from "./checkoutPricing";

describe("checkout pricing", () => {
  test("always charges configured delivery fee even when subtotal is high", () => {
    const pricing = calculateCheckoutPricing({
      cartTotal: 5000,
      couponDiscount: 0,
      deliverySettings: {
        standardDeliveryCharge: 120,
        paymentOption: "delivery_fee_first",
      },
    });

    expect(pricing.deliveryCharge).toBe(120);
    expect(pricing.requiresDeliveryFeePayment).toBe(true);
    expect(pricing.advancePaymentAmount).toBe(120);
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

  test("supports full COD without online payment", () => {
    const pricing = calculateCheckoutPricing({
      cartTotal: 2000,
      deliverySettings: {
        standardDeliveryCharge: 100,
        paymentOption: "cod",
      },
    });

    expect(pricing.codAvailable).toBe(true);
    expect(pricing.requiresOnlinePayment).toBe(false);
    expect(pricing.advancePaymentAmount).toBe(0);
    expect(pricing.dueAmount).toBe(2100);
  });

  test("supports full payment before order", () => {
    const pricing = calculateCheckoutPricing({
      cartTotal: 2000,
      deliverySettings: {
        standardDeliveryCharge: 100,
        paymentOption: "full_payment",
      },
    });

    expect(pricing.requiresFullPayment).toBe(true);
    expect(pricing.requiresOnlinePayment).toBe(true);
    expect(pricing.advancePaymentAmount).toBe(2100);
    expect(pricing.dueAmount).toBe(0);
  });
});
