class LoyaltyService {
  calculatePointsFromOrder(orderAmount) {
    return Math.floor(Number(orderAmount) || 0);
  }

  async getOrCreateAccount(models, userId, email) {
    let loyalty = await models.Loyalty.findOne({ userId });

    if (!loyalty) {
      loyalty = await models.Loyalty.create({
        userId,
        email,
        referralCode: models.Loyalty.generateReferralCode(userId),
      });
    }

    return loyalty;
  }

  async awardPointsForOrder(models, userId, email, orderAmount, orderId) {
    try {
      await this.getOrCreateAccount(models, userId, email);
      const basePoints = this.calculatePointsFromOrder(orderAmount);
      const { loyalty, earnedPoints } = await models.Loyalty.addPoints(
        userId,
        basePoints,
        `Order #${orderId}`,
        orderId,
      );

      return {
        earnedPoints,
        totalPoints: loyalty.points,
        tier: loyalty.tier,
      };
    } catch (error) {
      console.error("Error awarding points:", error);
      throw error;
    }
  }

  async awardReferralBonus(models, referrerId, newUserId, newUserEmail) {
    try {
      const referrerLoyalty = await models.Loyalty.findOne({
        userId: referrerId,
      });
      if (!referrerLoyalty) throw new Error("Referrer not found");

      const referrerResult = await models.Loyalty.addPoints(
        referrerId,
        500,
        `Referral bonus for ${newUserEmail}`,
      );

      const newUserLoyalty = await models.Loyalty.create({
        userId: newUserId,
        email: newUserEmail,
        referralCode: models.Loyalty.generateReferralCode(newUserId),
        referredBy: referrerId,
      });

      const welcomeResult = await models.Loyalty.addPoints(
        newUserId,
        100,
        "Welcome bonus",
      );

      return {
        referrerPoints: referrerResult.loyalty.points,
        newUserPoints: welcomeResult.loyalty?.points || newUserLoyalty.points,
      };
    } catch (error) {
      console.error("Error awarding referral bonus:", error);
      throw error;
    }
  }

  async awardBirthdayBonus(models, userId) {
    try {
      const loyalty = await models.Loyalty.findOne({ userId });
      if (!loyalty) throw new Error("Loyalty account not found");

      const benefits = models.Loyalty.getTierBenefits(loyalty.tier);
      const result = await models.Loyalty.addPoints(
        userId,
        benefits.birthdayBonus,
        "Birthday bonus",
      );

      return {
        bonusPoints: result.earnedPoints,
        totalPoints: result.loyalty.points,
      };
    } catch (error) {
      console.error("Error awarding birthday bonus:", error);
      throw error;
    }
  }

  async redeemPoints(models, userId, points, orderId) {
    try {
      const loyalty = await models.Loyalty.redeemPoints(
        userId,
        Number(points),
        `Redeemed for order #${orderId}`,
        orderId,
      );

      const discountInBDT = Number(points) / 100;
      const discountAmount = discountInBDT / 110;

      return {
        discountAmount,
        remainingPoints: loyalty.points,
      };
    } catch (error) {
      console.error("Error redeeming points:", error);
      throw error;
    }
  }

  async getStatistics(models) {
    try {
      const stats = await models.Loyalty.aggregate([
        {
          $group: {
            _id: "$tier",
            count: { $sum: 1 },
            totalPoints: { $sum: "$points" },
            avgPoints: { $avg: "$points" },
          },
        },
      ]);

      const totalMembers = await models.Loyalty.countDocuments();
      const totalPointsIssued = await models.Loyalty.aggregate([
        { $group: { _id: null, total: { $sum: "$totalEarned" } } },
      ]);

      return {
        totalMembers,
        totalPointsIssued: totalPointsIssued[0]?.total || 0,
        tierDistribution: stats,
      };
    } catch (error) {
      console.error("Error getting loyalty statistics:", error);
      throw error;
    }
  }

  async getLeaderboard(models, limit = 10) {
    try {
      return models.Loyalty.getLeaderboard(limit);
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    }
  }

  canRedeemPoints(loyalty, points) {
    return loyalty.points >= points && points >= 100;
  }

  getPointsValue(points) {
    return points / 100 / 110;
  }

  getPointsValueInBDT(points) {
    return points / 100;
  }
}

module.exports = new LoyaltyService();
