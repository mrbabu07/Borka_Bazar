class StockAlertService {
  async attachProducts(Product, alerts) {
    return Promise.all(
      alerts.map(async (alert) => {
        const productId = alert.productId?.toString?.() || alert.productId;
        const product = productId ? await Product.findById(productId) : null;
        return {
          ...alert,
          productId: product || alert.productId,
        };
      }),
    );
  }

  async checkBackInStockAlerts(models) {
    try {
      const { Product, StockAlert } = models;
      const products = await Product.findAll({ stock: { $gt: 0 } });
      const productIds = products.map((product) => product._id);

      const alerts = await StockAlert.findAll({
        productId: { $in: productIds },
        alertType: "back_in_stock",
        active: true,
        notified: false,
      });

      const populatedAlerts = await this.attachProducts(Product, alerts);
      console.log(`Found ${populatedAlerts.length} back-in-stock alerts to send`);

      for (const alert of populatedAlerts) {
        await this.sendBackInStockEmail(alert);
        await StockAlert.updateById(alert._id, {
          notified: true,
          notifiedAt: new Date(),
        });
      }

      return populatedAlerts.length;
    } catch (error) {
      console.error("Error checking back-in-stock alerts:", error);
      return 0;
    }
  }

  async checkPriceDropAlerts(models) {
    try {
      const { Product, StockAlert } = models;
      const alerts = await StockAlert.findAll({
        alertType: "price_drop",
        active: true,
        notified: false,
      });

      const populatedAlerts = await this.attachProducts(Product, alerts);
      let sentCount = 0;

      for (const alert of populatedAlerts) {
        if (alert.productId && alert.productId.price <= alert.priceThreshold) {
          await this.sendPriceDropEmail(alert);
          await StockAlert.updateById(alert._id, {
            notified: true,
            notifiedAt: new Date(),
          });
          sentCount++;
        }
      }

      console.log(`Sent ${sentCount} price drop alerts`);
      return sentCount;
    } catch (error) {
      console.error("Error checking price drop alerts:", error);
      return 0;
    }
  }

  async checkLowStockAlerts(models) {
    try {
      const { Product, StockAlert } = models;
      const lowStockProducts = await Product.findAll({
        stock: { $gt: 0, $lt: 10 },
      });
      const productIds = lowStockProducts.map((product) => product._id);

      const alerts = await StockAlert.findAll({
        productId: { $in: productIds },
        alertType: "low_stock",
        active: true,
        notified: false,
      });

      const populatedAlerts = await this.attachProducts(Product, alerts);
      console.log(`Found ${populatedAlerts.length} low stock alerts to send`);

      for (const alert of populatedAlerts) {
        await this.sendLowStockEmail(alert);
        await StockAlert.updateById(alert._id, {
          notified: true,
          notifiedAt: new Date(),
        });
      }

      return populatedAlerts.length;
    } catch (error) {
      console.error("Error checking low stock alerts:", error);
      return 0;
    }
  }

  async sendBackInStockEmail(alert) {
    try {
      const product = alert.productId;
      console.log(
        `Sending back-in-stock alert for ${product.title || product.name} to ${alert.email}`,
      );
      return true;
    } catch (error) {
      console.error("Error sending back-in-stock email:", error);
      return false;
    }
  }

  async sendPriceDropEmail(alert) {
    try {
      const product = alert.productId;
      console.log(
        `Sending price drop alert for ${product.title || product.name} to ${alert.email}`,
      );
      return true;
    } catch (error) {
      console.error("Error sending price drop email:", error);
      return false;
    }
  }

  async sendLowStockEmail(alert) {
    try {
      const product = alert.productId;
      console.log(
        `Sending low stock alert for ${product.title || product.name} to ${alert.email}`,
      );
      return true;
    } catch (error) {
      console.error("Error sending low stock email:", error);
      return false;
    }
  }

  async checkAllAlerts(models) {
    console.log("Checking all stock alerts...");

    const backInStock = await this.checkBackInStockAlerts(models);
    const priceDrops = await this.checkPriceDropAlerts(models);
    const lowStock = await this.checkLowStockAlerts(models);

    console.log(
      `Alerts sent: ${backInStock} back-in-stock, ${priceDrops} price drops, ${lowStock} low stock`,
    );

    return {
      backInStock,
      priceDrops,
      lowStock,
      total: backInStock + priceDrops + lowStock,
    };
  }
}

module.exports = new StockAlertService();
