import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  Home,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import useAuth from "../hooks/useAuth";
import { createAddress, getCurrentUser, updateUserProfile } from "../services/api";
import {
  BANGLADESH_DIVISIONS,
  createEmptyAddress,
  toAddressPayload,
} from "../utils/bangladeshAddress";

const requiredAddressFields = [
  "name",
  "phone",
  "address",
  "division",
  "district",
  "upazila",
  "union",
  "area",
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    ...createEmptyAddress({ isDefault: true }),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    const addressPayload = toAddressPayload(formData);
    if (requiredAddressFields.some((field) => !addressPayload[field])) {
      setError("Please complete your delivery address");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await register(formData.email, formData.password);
      await updateProfile(userCredential.user, { displayName: formData.name });
      await userCredential.user.getIdToken(true);
      await getCurrentUser();
      await updateUserProfile({
        firstName: formData.name.split(" ")[0] || "",
        lastName: formData.name.split(" ").slice(1).join(" ") || "",
        phone: formData.phone,
      });
      await createAddress({ ...addressPayload, isDefault: true });
      navigate("/");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login instead.");
      } else {
        setError(
          error.response?.data?.error ||
            error.response?.data?.message ||
            error.message ||
            "Failed to register",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-gray-950 dark:bg-gray-950 dark:text-gray-100">
      <main className="mx-auto grid min-h-screen max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
        <section className="hidden py-10 lg:block">
          <BrandLogo />
          <div className="mt-14 max-w-xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-gold-600 dark:text-gold-400">
              New Account
            </p>
            <h1 className="font-display text-5xl leading-tight text-gray-950 dark:text-white">
              Create a delivery-ready profile.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-gray-600 dark:text-gray-400">
              Add your contact and delivery details once, then checkout faster
              on every order.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-3xl py-0 lg:py-10">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo compact />
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">
                Register
              </p>
              <h2 className="text-3xl font-semibold text-gray-950 dark:text-white">
                Open your account
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Your address is saved as the default delivery location.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              <section>
                <SectionTitle eyebrow="Profile" title="Contact Details" />
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <AuthField
                    icon={User}
                    label="Full Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    autoComplete="name"
                    required
                  />
                  <AuthField
                    icon={Phone}
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    required
                  />
                  <AuthField
                    icon={Mail}
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                  <AuthSelect
                    icon={MapPin}
                    label="Division"
                    name="division"
                    value={formData.division}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select division</option>
                    {BANGLADESH_DIVISIONS.map((division) => (
                      <option key={division} value={division}>
                        {division}
                      </option>
                    ))}
                  </AuthSelect>
                </div>
              </section>

              <section>
                <SectionTitle eyebrow="Delivery" title="Address Details" />
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <AuthField
                    icon={MapPin}
                    label="District"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="District"
                    required
                  />
                  <AuthField
                    icon={MapPin}
                    label="Upazila"
                    name="upazila"
                    value={formData.upazila}
                    onChange={handleChange}
                    placeholder="Upazila"
                    required
                  />
                  <AuthField
                    icon={MapPin}
                    label="Union"
                    name="union"
                    value={formData.union}
                    onChange={handleChange}
                    placeholder="Union"
                    required
                  />
                  <AuthField
                    icon={MapPin}
                    label="Area Name"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    placeholder="Village or area name"
                    required
                  />
                </div>
                <AuthTextarea
                  icon={Home}
                  label="House / Road / Details"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House/flat, road, landmark"
                  required
                  className="mt-5"
                />
              </section>

              <section>
                <SectionTitle eyebrow="Security" title="Password" />
                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <AuthField
                    icon={Lock}
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    required
                  />
                  <AuthField
                    icon={Lock}
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </section>

              <label className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-gray-800 dark:bg-gray-950/60">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-gray-950 focus:ring-gold-500 dark:border-gray-700"
                />
                <span className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Save this as my default delivery address.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gold-500 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-white dark:text-gray-950 dark:hover:bg-gold-500 dark:hover:text-white dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
              >
                {loading ? "Creating account..." : "Create Account"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-gray-950 underline decoration-gold-500 underline-offset-4 transition hover:text-gold-600 dark:text-white dark:hover:text-gold-400"
              >
                Sign in
              </Link>
            </p>

            <p className="mt-5 text-center text-xs leading-5 text-gray-500 dark:text-gray-500">
              By creating an account, you agree to our Terms of Service and
              Privacy Policy.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div className="border-b border-stone-100 pb-3 dark:border-gray-800">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-xl font-semibold text-gray-950 dark:text-white">
        {title}
      </h3>
    </div>
  );
}

function AuthField({
  icon: Icon,
  label,
  className = "",
  required = false,
  ...props
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          {...props}
          required={required}
          className={`w-full rounded-lg border border-stone-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500 ${className}`}
        />
      </span>
    </label>
  );
}

function AuthSelect({
  icon: Icon,
  label,
  children,
  required = false,
  ...props
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <select
          {...props}
          required={required}
          className="w-full appearance-none rounded-lg border border-stone-300 bg-white py-3 pl-11 pr-10 text-sm text-gray-950 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </span>
    </label>
  );
}

function AuthTextarea({
  icon: Icon,
  label,
  className = "",
  required = false,
  ...props
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-gray-400" />
        <textarea
          {...props}
          rows="3"
          required={required}
          className="w-full resize-none rounded-lg border border-stone-300 bg-white py-3 pl-11 pr-4 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/15 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500"
        />
      </span>
    </label>
  );
}
