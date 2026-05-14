import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Clipboard,
  Gift,
  History,
  Medal,
  Sparkles,
  TicketPercent,
  Trophy,
  Users,
  X,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { useCurrency } from "../hooks/useCurrency";
import { useToast } from "../context/ToastContext";
import { getCurrentUserToken } from "../utils/auth";
import Loading from "../components/Loading";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const tierThresholds = {
  bronze: { min: 0, next: "silver", nextThreshold: 1000 },
  silver: { min: 1000, next: "gold", nextThreshold: 5000 },
  gold: { min: 5000, next: "platinum", nextThreshold: 10000 },
  platinum: { min: 10000, next: null, nextThreshold: null },
};

const tierStyles = {
  platinum: "from-slate-950 via-slate-700 to-cyan-700",
  gold: "from-amber-500 via-yellow-500 to-orange-500",
  silver: "from-slate-500 via-gray-500 to-zinc-700",
  bronze: "from-orange-600 via-amber-600 to-stone-700",
};

function getNextTierInfo(currentTier = "bronze", totalEarned = 0) {
  const current = tierThresholds[currentTier] || tierThresholds.bronze;

  if (!current.next) {
    return {
      progress: 100,
      message: "Highest tier unlocked",
    };
  }

  const progress = Math.min(
    ((totalEarned - current.min) / (current.nextThreshold - current.min)) * 100,
    100,
  );
  const pointsNeeded = Math.max(current.nextThreshold - totalEarned, 0);

  return {
    progress: Math.round(progress),
    message: `${pointsNeeded.toLocaleString()} points to ${current.next}`,
  };
}

function Card({ children, className = "" }) {
  return (
    <section
      className={`rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {children}
    </section>
  );
}

function MetricCard({ title, value, helper, icon }) {
  const IconComponent = icon;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {helper}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-200">
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function LoyaltyDashboard() {
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [loyalty, setLoyalty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [pointsHistory, setPointsHistory] = useState([]);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const fetchLoyaltyData = async () => {
    try {
      const token = await getCurrentUserToken();
      const response = await fetch(`${API_URL}/loyalty/my-points`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLoyalty(data.data);
      } else {
        error("Failed to fetch loyalty data");
      }
    } catch (err) {
      console.error("Error fetching loyalty data:", err);
      error("Failed to fetch loyalty data");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API_URL}/loyalty/leaderboard?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    }
  };

  const fetchPointsHistory = async () => {
    try {
      const token = await getCurrentUserToken();
      const response = await fetch(`${API_URL}/loyalty/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPointsHistory(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching points history:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
      fetchLeaderboard();
      fetchPointsHistory();
    }
  }, [user]);

  const handleApplyReferral = async () => {
    if (!referralCode.trim()) {
      error("Please enter a referral code");
      return;
    }

    try {
      const token = await getCurrentUserToken();
      const response = await fetch(`${API_URL}/loyalty/apply-referral`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ referralCode: referralCode.trim() }),
      });
      const data = await response.json();

      if (response.ok) {
        success(data.message);
        setShowReferralInput(false);
        setReferralCode("");
        fetchLoyaltyData();
        fetchPointsHistory();
      } else {
        error(data.message || "Failed to apply referral code");
      }
    } catch (err) {
      console.error("Error applying referral code:", err);
      error("Failed to apply referral code");
    }
  };

  const handleRedeemPoints = async (pointsToRedeem) => {
    if (!pointsToRedeem || pointsToRedeem < 100) {
      error("Minimum 100 points required to redeem");
      return;
    }

    if (pointsToRedeem > (loyalty?.points || 0)) {
      error("Insufficient points");
      return;
    }

    try {
      const token = await getCurrentUserToken();
      const response = await fetch(`${API_URL}/loyalty/redeem`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points: pointsToRedeem }),
      });
      const data = await response.json();

      if (response.ok) {
        success(
          `Redeemed ${pointsToRedeem.toLocaleString()} points for ${formatPrice(
            pointsToRedeem / 100,
          )} store credit`,
        );
        fetchLoyaltyData();
        fetchPointsHistory();
      } else {
        error(data.message || "Failed to redeem points");
      }
    } catch (err) {
      console.error("Error redeeming points:", err);
      error("Failed to redeem points");
    }
  };

  const copyReferralCode = () => {
    if (!loyalty?.referralCode) return;
    navigator.clipboard.writeText(loyalty.referralCode);
    success("Referral code copied to clipboard");
  };

  const tier = loyalty?.tier || "bronze";
  const availablePoints = loyalty?.points || 0;
  const totalEarned = loyalty?.totalEarned || 0;
  const tierInfo = getNextTierInfo(tier, totalEarned);
  const visibleHistory = showFullHistory
    ? pointsHistory
    : pointsHistory.slice(0, 5);

  const benefitItems = useMemo(
    () => [
      {
        title: "Free Shipping",
        helper: loyalty?.benefits?.freeShipping ? "Unlocked" : "Locked",
        active: Boolean(loyalty?.benefits?.freeShipping),
        icon: Gift,
      },
      {
        title: "Express Shipping",
        helper: loyalty?.benefits?.expressShipping ? "Priority delivery" : "Locked",
        active: Boolean(loyalty?.benefits?.expressShipping),
        icon: ArrowRight,
      },
      {
        title: "Early Access",
        helper: loyalty?.benefits?.earlyAccess ? "Sales and launches" : "Locked",
        active: Boolean(loyalty?.benefits?.earlyAccess),
        icon: Sparkles,
      },
      {
        title: "Exclusive Deals",
        helper: loyalty?.benefits?.exclusiveDeals ? "Member offers" : "Locked",
        active: Boolean(loyalty?.benefits?.exclusiveDeals),
        icon: TicketPercent,
      },
    ],
    [loyalty],
  );

  if (loading) return <Loading />;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <Trophy className="h-3.5 w-3.5" />
                Rewards
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-gray-950 dark:text-white sm:text-4xl">
                Loyalty Rewards
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Track your points, tier progress, referral rewards, and store
                credit from one place.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Points Value
              </p>
              <p className="mt-1 text-2xl font-bold text-gray-950 dark:text-white">
                {formatPrice(availablePoints / 100)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section
          className={`mb-6 overflow-hidden rounded-lg bg-gradient-to-r ${
            tierStyles[tier] || tierStyles.bronze
          } text-white shadow-xl`}
        >
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
            <div>
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <Medal className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-white/70">
                    Current Tier
                  </p>
                  <h2 className="text-3xl font-bold capitalize">
                    {tier} Member
                  </h2>
                </div>
              </div>

              <div className="mb-5 flex items-center justify-between gap-4 text-sm">
                <span className="text-white/75">{tierInfo.message}</span>
                <span className="font-bold">{tierInfo.progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-300"
                  style={{ width: `${tierInfo.progress}%` }}
                />
              </div>
            </div>

            <div className="rounded-lg bg-white/15 p-5 ring-1 ring-white/20">
              <p className="text-sm font-semibold text-white/75">
                Available Points
              </p>
              <p className="mt-2 text-5xl font-bold">
                {availablePoints.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-white/75">
                {loyalty?.benefits?.pointsMultiplier || 1}x points multiplier
              </p>
            </div>
          </div>
        </section>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Total Earned"
            value={(loyalty?.totalEarned || 0).toLocaleString()}
            helper="Lifetime points"
            icon={Sparkles}
          />
          <MetricCard
            title="Total Redeemed"
            value={(loyalty?.totalRedeemed || 0).toLocaleString()}
            helper="Used as credit"
            icon={History}
          />
          <MetricCard
            title="Birthday Bonus"
            value={(loyalty?.benefits?.birthdayBonus || 0).toLocaleString()}
            helper="Tier bonus points"
            icon={Gift}
          />
          <MetricCard
            title="Referral Code"
            value={loyalty?.referralCode || "Pending"}
            helper="Share and earn"
            icon={Users}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                    Tier Benefits
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Perks currently attached to your account
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {benefitItems.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={benefit.title}
                      className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                          benefit.active
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-950 dark:text-white">
                          {benefit.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {benefit.helper}
                        </p>
                      </div>
                      {benefit.active ? (
                        <Check className="h-5 w-5 text-emerald-600" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                    Recent Activity
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Latest point changes
                  </p>
                </div>
                {pointsHistory.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowFullHistory((value) => !value)}
                    className="text-sm font-semibold text-gray-950 hover:text-gray-600 dark:text-white dark:hover:text-gray-300"
                  >
                    {showFullHistory ? "Show Less" : "View All"}
                  </button>
                )}
              </div>

              {visibleHistory.length > 0 ? (
                <div className="space-y-3">
                  {visibleHistory.map((transaction, index) => {
                    const isEarned = transaction.type === "earned";
                    return (
                      <div
                        key={`${transaction.date}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-950"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold ${
                              isEarned
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                : "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                            }`}
                          >
                            {isEarned ? "+" : "-"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-950 dark:text-white">
                              {transaction.reason}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {transaction.date
                                ? new Date(transaction.date).toLocaleDateString()
                                : "No date"}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`font-bold ${
                            isEarned
                              ? "text-emerald-600 dark:text-emerald-300"
                              : "text-red-600 dark:text-red-300"
                          }`}
                        >
                          {isEarned ? "+" : "-"}
                          {transaction.points}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400">
                  No transactions yet. Start shopping to earn points.
                </div>
              )}
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                Refer & Earn
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Share your code with a friend and earn referral points.
              </p>
              <div className="mt-5 rounded-lg bg-gray-50 p-4 dark:bg-gray-950">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Your Code
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="truncate text-2xl font-bold text-primary-600 dark:text-primary-300">
                    {loyalty?.referralCode || "Pending"}
                  </p>
                  <button
                    type="button"
                    onClick={copyReferralCode}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-white hover:text-gray-950 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-900 dark:hover:text-white"
                    title="Copy code"
                  >
                    <Clipboard className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {!showReferralInput ? (
                <button
                  type="button"
                  onClick={() => setShowReferralInput(true)}
                  className="mt-4 w-full rounded-lg border border-primary-500 px-4 py-3 text-sm font-bold text-primary-600 transition hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/30"
                >
                  Have a Referral Code?
                </button>
              ) : (
                <div className="mt-4 space-y-3">
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(event) => setReferralCode(event.target.value)}
                    placeholder="Enter referral code"
                    className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm focus:border-primary-500 focus:outline-none dark:border-gray-700 dark:bg-gray-950 dark:text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleApplyReferral}
                      className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-700"
                    >
                      Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReferralInput(false);
                        setReferralCode("");
                      }}
                      className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                Redeem Points
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                100 points equals {formatPrice(1)} store credit.
              </p>

              <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                    Available
                  </span>
                  <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {availablePoints.toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                  Worth {formatPrice(availablePoints / 100)}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[100, 500, 1000].map((points) => (
                  <button
                    key={points}
                    type="button"
                    onClick={() => handleRedeemPoints(points)}
                    disabled={availablePoints < points}
                    className="rounded-lg border border-gray-200 p-3 text-left transition hover:border-primary-400 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-800 dark:hover:bg-primary-950/30"
                  >
                    <p className="font-bold text-gray-950 dark:text-white">
                      {points} pts
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatPrice(points / 100)}
                    </p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleRedeemPoints(availablePoints)}
                  disabled={availablePoints < 100}
                  className="rounded-lg border border-primary-500 p-3 text-left text-primary-700 transition hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-50 dark:text-primary-300 dark:hover:bg-primary-950/30"
                >
                  <p className="font-bold">All</p>
                  <p className="text-sm">{formatPrice(availablePoints / 100)}</p>
                </button>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-950 dark:text-white">
                Top Members
              </h2>
              <div className="mt-4 space-y-2">
                {leaderboard.length > 0 ? (
                  leaderboard.map((member, index) => (
                    <div
                      key={member._id || member.email || index}
                      className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-950 dark:text-white">
                          {(member.email || "member").split("@")[0]}
                        </p>
                        <p className="text-xs capitalize text-gray-500 dark:text-gray-400">
                          {member.tier} - {member.totalEarned} pts
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
                    Leaderboard is empty.
                  </p>
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}
