const { connectDb } = require("./db");

const getArgValue = (name, fallback = null) => {
  const prefix = `--${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : fallback;
};

const hasFlag = (name) => process.argv.includes(`--${name}`);

const parseDays = () => {
  const days = Number.parseInt(getArgValue("days", "30"), 10);
  if (!Number.isFinite(days) || days < 30) {
    throw new Error("Retention must be at least 30 days. Example: --days=30");
  }
  return Math.min(days, 3650);
};

const getCutoffDate = (days) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  return cutoffDate;
};

const deliveredStatusFilter = {
  $or: [
    { orderStatus: /^delivered$/i },
    { status: /^delivered$/i },
    { "order.status": /^delivered$/i },
  ],
};

const getCleanupFilter = (cutoffDate) => ({
  $and: [
    deliveredStatusFilter,
    {
      $or: [
        { deliveredAt: { $lte: cutoffDate } },
        { deliveredAt: { $exists: false }, updatedAt: { $lte: cutoffDate } },
        {
          deliveredAt: { $exists: false },
          updatedAt: { $exists: false },
          createdAt: { $lte: cutoffDate },
        },
      ],
    },
  ],
});

async function main() {
  const days = parseDays();
  const shouldDelete = hasFlag("delete");
  const confirmed = hasFlag("yes");
  const cutoffDate = getCutoffDate(days);
  const { client, db } = await connectDb();

  try {
    const orders = db.collection("orders");
    const matchedDeliveredOrders = await orders
      .find(deliveredStatusFilter, {
        projection: {
          _id: 1,
          orderCode: 1,
          deliveredAt: 1,
          updatedAt: 1,
          createdAt: 1,
        },
      })
      .toArray();

    const backfillOps = matchedDeliveredOrders
      .filter((order) => !order.deliveredAt)
      .map((order) => ({
        updateOne: {
          filter: { _id: order._id },
          update: {
            $set: {
              deliveredAt: order.updatedAt || order.createdAt || new Date(),
              updatedAt: new Date(),
            },
          },
        },
      }));

    let backfilled = 0;
    if (backfillOps.length > 0) {
      const result = await orders.bulkWrite(backfillOps);
      backfilled = result.modifiedCount || 0;
    }

    const cleanupFilter = getCleanupFilter(cutoffDate);
    const deletableOrders = await orders
      .find(cleanupFilter, {
        projection: { _id: 1, orderCode: 1, deliveredAt: 1, updatedAt: 1 },
      })
      .sort({ deliveredAt: 1, updatedAt: 1, createdAt: 1 })
      .toArray();

    console.log(
      JSON.stringify(
        {
          mode: shouldDelete ? "delete" : "preview",
          days,
          cutoffDate,
          deliveredMatched: matchedDeliveredOrders.length,
          deliveredAtBackfilled: backfilled,
          deletableOrders: deletableOrders.length,
          sample: deletableOrders.slice(0, 10).map((order) => ({
            id: order._id,
            orderCode: order.orderCode,
            deliveredAt: order.deliveredAt,
          })),
        },
        null,
        2,
      ),
    );

    if (!shouldDelete) {
      console.log("Preview only. Add --delete --yes to delete matching orders.");
      return;
    }

    if (!confirmed) {
      throw new Error("Deletion requires --yes. Example: node scripts/cleanupDeliveredOrders.js --days=30 --delete --yes");
    }

    const orderIds = deletableOrders.map((order) => order._id);
    const orderIdStrings = orderIds.map((id) => id.toString());
    const deleteResult = await orders.deleteMany(cleanupFilter);
    const notificationResult = await db.collection("appnotifications").deleteMany({
      $or: [
        { "metadata.orderId": { $in: orderIds } },
        { "metadata.orderId": { $in: orderIdStrings } },
      ],
    });

    console.log(
      JSON.stringify(
        {
          deletedOrders: deleteResult.deletedCount || 0,
          deletedNotifications: notificationResult.deletedCount || 0,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
