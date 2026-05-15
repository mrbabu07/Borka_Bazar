const {
  getCompletedOrderDeleteEligibility,
} = require("../utils/orderDeletion");

describe("completed order delete eligibility", () => {
  const cutoffDate = new Date("2026-05-01T00:00:00.000Z");

  test("allows delivered orders older than cutoff", () => {
    const result = getCompletedOrderDeleteEligibility(
      {
        orderStatus: "delivered",
        deliveredAt: "2026-04-01T00:00:00.000Z",
      },
      cutoffDate,
    );

    expect(result.allowed).toBe(true);
  });

  test("allows cancelled orders older than cutoff", () => {
    const result = getCompletedOrderDeleteEligibility(
      {
        orderStatus: "cancelled",
        cancelledAt: "2026-04-01T00:00:00.000Z",
      },
      cutoffDate,
    );

    expect(result.allowed).toBe(true);
  });

  test("allows migrated delivered orders by old created date", () => {
    const result = getCompletedOrderDeleteEligibility(
      {
        orderStatus: "delivered",
        createdAt: "2026-04-01T00:00:00.000Z",
        updatedAt: "2026-05-10T00:00:00.000Z",
      },
      cutoffDate,
    );

    expect(result.allowed).toBe(true);
  });

  test("blocks recent completed orders", () => {
    const result = getCompletedOrderDeleteEligibility(
      {
        orderStatus: "delivered",
        deliveredAt: "2026-05-10T00:00:00.000Z",
      },
      cutoffDate,
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("30 days");
  });

  test("blocks active orders", () => {
    const result = getCompletedOrderDeleteEligibility(
      {
        orderStatus: "processing",
        updatedAt: "2026-04-01T00:00:00.000Z",
      },
      cutoffDate,
    );

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("cancelled or delivered");
  });
});
