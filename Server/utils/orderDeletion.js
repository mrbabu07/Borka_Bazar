function getCompletedOrderDeleteEligibility(order, cutoffDate = new Date()) {
  const status = (order?.orderStatus || order?.status || order?.order?.status || "")
    .toString()
    .toLowerCase();
  const isDelivered = status === "delivered";
  const isCancelled = status === "cancelled" || status === "canceled";

  if (!isDelivered && !isCancelled) {
    return {
      allowed: false,
      reason: "Only cancelled or delivered orders can be deleted",
    };
  }

  const lifecycleDate = new Date(
    (isDelivered && order.deliveredAt) ||
      (isCancelled && order.cancelledAt) ||
      order.createdAt ||
      order.updatedAt ||
      Date.now(),
  );

  if (Number.isNaN(lifecycleDate.getTime())) {
    return {
      allowed: false,
      reason: "Order does not have a valid lifecycle date",
    };
  }

  if (lifecycleDate > cutoffDate) {
    return {
      allowed: false,
      reason: "Order must be at least 30 days old after cancellation or delivery",
    };
  }

  return { allowed: true, status, lifecycleDate };
}

module.exports = { getCompletedOrderDeleteEligibility };
