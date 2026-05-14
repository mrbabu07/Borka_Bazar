import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { updateProfile as updateFirebaseProfile } from "firebase/auth";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Gift,
  Heart,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  UserRound,
} from "lucide-react";
import { toast } from "react-hot-toast";
import useAuth from "../hooks/useAuth";
import useWishlist from "../hooks/useWishlist";
import NotificationSettings from "../components/NotificationSettings";
import {
  getCurrentUser,
  getUserAddresses,
  getUserOrders,
  getUserReturns,
  updateUserProfile,
} from "../services/api";

export default function Profile() {
  const { user, isAdmin, logout } = useAuth();
  const { wishlist } = useWishlist();
  const [dbUser, setDbUser] = useState(null);
  const [stats, setStats] = useState({
    orders: 0,
    delivered: 0,
    addresses: 0,
    returns: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    avatar: "",
  });

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const [profileRes, ordersRes, addressesRes, returnsRes] =
          await Promise.allSettled([
            getCurrentUser(),
            getUserOrders(),
            getUserAddresses(),
            getUserReturns(),
          ]);

        if (!mounted) return;

        if (profileRes.status === "fulfilled") {
          const profile = profileRes.value.data.data;
          setDbUser(profile);
          setForm({
            firstName:
              profile?.profile?.firstName ||
              user?.displayName?.split(" ")[0] ||
              "",
            lastName:
              profile?.profile?.lastName ||
              user?.displayName?.split(" ").slice(1).join(" ") ||
              "",
            phone: profile?.profile?.phone || "",
            avatar: profile?.profile?.avatar || user?.photoURL || "",
          });
        }

        const orders =
          ordersRes.status === "fulfilled" ? ordersRes.value.data.data || [] : [];
        const addresses =
          addressesRes.status === "fulfilled"
            ? addressesRes.value.data.data || []
            : [];
        const returns =
          returnsRes.status === "fulfilled" ? returnsRes.value.data.data || [] : [];

        setStats({
          orders: orders.length,
          delivered: orders.filter(
            (order) => (order.orderStatus || order.status) === "delivered",
          ).length,
          addresses: addresses.length,
          returns: returns.length,
        });
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (user) loadProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  const displayName = useMemo(() => {
    const first = dbUser?.profile?.firstName || form.firstName;
    const last = dbUser?.profile?.lastName || form.lastName;
    return [first, last].filter(Boolean).join(" ") || user?.displayName || "Customer";
  }, [dbUser, form.firstName, form.lastName, user?.displayName]);

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  const completionItems = [
    Boolean(displayName && displayName !== "Customer"),
    Boolean(user?.email),
    Boolean(dbUser?.profile?.phone || form.phone),
    Boolean(dbUser?.profile?.avatar || form.avatar || user?.photoURL),
    stats.addresses > 0,
  ];
  const completion = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100,
  );

  const memberSince = user?.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        avatar: form.avatar.trim(),
      };

      const response = await updateUserProfile(payload);
      setDbUser(response.data.data);

      const firebaseName = [payload.firstName, payload.lastName]
        .filter(Boolean)
        .join(" ");
      if (user) {
        const firebasePayload = {};
        if (firebaseName) firebasePayload.displayName = firebaseName;
        if (payload.avatar && /^https?:\/\//i.test(payload.avatar)) {
          firebasePayload.photoURL = payload.avatar;
        }

        if (Object.keys(firebasePayload).length > 0) {
          try {
            await updateFirebaseProfile(user, firebasePayload);
          } catch (firebaseError) {
            console.warn("Firebase profile sync failed:", firebaseError);
          }
        }
      }

      setIsEditing(false);
      toast.success("Profile updated");
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  };

  const metrics = [
    { label: "Orders", value: stats.orders, icon: ShoppingBag },
    { label: "Delivered", value: stats.delivered, icon: PackageCheck },
    { label: "Wishlist", value: wishlist.length, icon: Heart },
    { label: "Addresses", value: stats.addresses, icon: MapPin },
  ];

  const quickLinks = [
    {
      to: "/orders",
      title: "Orders",
      description: "Track purchases and payment status",
      icon: ShoppingBag,
    },
    {
      to: "/addresses",
      title: "Address Book",
      description: "Manage delivery locations",
      icon: MapPin,
    },
    {
      to: "/wishlist",
      title: "Wishlist",
      description: "Saved pieces for later",
      icon: Heart,
    },
    {
      to: "/returns",
      title: "Returns",
      description: "Follow return requests",
      icon: RotateCcw,
    },
    {
      to: "/support",
      title: "Support",
      description: "Get help with an order",
      icon: HelpCircle,
    },
    {
      to: "/loyalty",
      title: "Loyalty",
      description: "Rewards and member benefits",
      icon: Gift,
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50 dark:bg-gray-950">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-gray-950 dark:border-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-gray-950 dark:bg-gray-950 dark:text-gray-100">
      <section className="border-b border-stone-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-950 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gold-500 dark:bg-white dark:text-gray-950 dark:hover:bg-gold-500 dark:hover:text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:text-gray-300 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
              <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                {form.avatar || user?.photoURL ? (
                  <img
                    src={form.avatar || user.photoURL}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-semibold text-gray-500 dark:text-gray-300">
                    {initials || <UserRound className="h-10 w-10" />}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-gold-600 dark:text-gold-400">
                  Account Suite
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-display text-4xl leading-tight text-gray-950 dark:text-white md:text-5xl">
                    {displayName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {user?.emailVerified ? "Verified" : "Email pending"}
                  </span>
                </div>
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {user?.email} · Member since {memberSince}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-5 dark:border-gray-800 dark:bg-gray-950/60">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Profile completion
                </span>
                <span className="font-semibold text-gray-950 dark:text-white">
                  {completion}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-stone-200 dark:bg-gray-800">
                <div
                  className="h-2 rounded-full bg-gold-500 transition-all"
                  style={{ width: `${completion}%` }}
                />
              </div>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                Add phone, avatar, and default address for faster checkout.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <Icon className="mb-5 h-5 w-5 text-gold-600 dark:text-gold-400" />
                <p className="text-3xl font-semibold text-gray-950 dark:text-white">
                  {metric.value}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {metric.label}
                </p>
              </div>
            );
          })}
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <button
              type="button"
              onClick={() => {
                setContactOpen((value) => !value);
                if (contactOpen) setIsEditing(false);
              }}
              className="flex w-full items-start justify-between gap-4 p-6 text-left transition hover:bg-stone-50 dark:hover:bg-gray-800/60"
              aria-expanded={contactOpen}
            >
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">
                  Personal Details
                </p>
                <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
                  Contact Profile
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {dbUser?.profile?.phone || form.phone
                    ? `Phone: ${dbUser?.profile?.phone || form.phone}`
                    : "Add phone number and avatar for faster checkout."}
                </p>
              </div>
              <ChevronDown
                className={`mt-1 h-5 w-5 text-gray-500 transition-transform dark:text-gray-400 ${
                  contactOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {contactOpen && (
              <div className="border-t border-stone-100 p-6 dark:border-gray-800">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Click edit to update the details used for delivery support.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsEditing((value) => !value)}
                    className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-stone-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    {isEditing ? "Cancel" : "Edit"}
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileInput
                      label="First Name"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                    <ProfileInput
                      label="Last Name"
                      name="lastName"
                      value={form.lastName}
                      onChange={handleChange}
                      disabled={!isEditing}
                    />
                  </div>
                  <ProfileInput
                    label="Phone Number"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="+880..."
                  />
                  <ProfileInput
                    label="Avatar URL"
                    name="avatar"
                    value={form.avatar}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="https://..."
                  />

                  {isEditing && (
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gold-500 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-white dark:text-gray-950 dark:hover:bg-gold-500 dark:hover:text-white dark:disabled:bg-gray-700 dark:disabled:text-gray-400 sm:w-auto"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group rounded-lg border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gold-700"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-stone-100 text-gray-700 transition group-hover:bg-gold-500 group-hover:text-white dark:bg-gray-800 dark:text-gray-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-950 dark:text-white">
                    {link.title}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {link.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">
              Account
            </p>
            <h2 className="text-2xl font-semibold text-gray-950 dark:text-white">
              Security Snapshot
            </h2>
            <div className="mt-5 divide-y divide-stone-100 dark:divide-gray-800">
              <InfoRow label="Role" value={isAdmin ? "Administrator" : "Customer"} />
              <InfoRow
                label="Email Status"
                value={user?.emailVerified ? "Verified" : "Pending"}
              />
              <InfoRow label="Returns" value={stats.returns} />
              <InfoRow
                label="Last Sign In"
                value={
                  user?.metadata?.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString(
                        "en-US",
                        { month: "short", day: "numeric", year: "numeric" },
                      )
                    : "N/A"
                }
              />
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">
                  Preferences
                </p>
                <h2 className="text-xl font-semibold text-gray-950 dark:text-white">
                  Notifications
                </h2>
              </div>
            </div>
            <NotificationSettings />
          </div>
        </section>
      </main>
    </div>
  );
}

function ProfileInput({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gold-500 disabled:bg-stone-50 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
      />
    </label>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-950 dark:text-white">{value}</span>
    </div>
  );
}
