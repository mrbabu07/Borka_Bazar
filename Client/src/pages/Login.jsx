import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import BrandLogo from "../components/BrandLogo";
import useAuth from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success("Signed in successfully");
      navigate(from, { replace: true });
    } catch (error) {
      const message =
        error.message || "Failed to login. Please check your credentials.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-gray-950 dark:bg-gray-950 dark:text-gray-100">
      <main className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
        <section className="hidden lg:block">
          <BrandLogo />
          <div className="mt-14 max-w-xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-gold-600 dark:text-gold-400">
              Account Access
            </p>
            <h1 className="font-display text-5xl leading-tight text-gray-950 dark:text-white">
              Welcome back to your shopping account.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-gray-600 dark:text-gray-400">
              Sign in to track orders, manage delivery addresses, and continue
              checkout without losing your saved items.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo compact />
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="mb-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold-600 dark:text-gold-400">
                Sign In
              </p>
              <h2 className="text-3xl font-semibold text-gray-950 dark:text-white">
                Access your account
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                Use the email and password connected to your profile.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
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

              <AuthField
                icon={Lock}
                label="Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />

              <div className="flex items-center justify-end">
                <a
                  href="#"
                  className="text-sm font-semibold text-gray-600 transition hover:text-gold-600 dark:text-gray-300 dark:hover:text-gold-400"
                >
                  Forgot password?
                </a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gold-500 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-white dark:text-gray-950 dark:hover:bg-gold-500 dark:hover:text-white dark:disabled:bg-gray-700 dark:disabled:text-gray-400"
              >
                {loading ? "Signing in..." : "Sign In"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-gray-950 underline decoration-gold-500 underline-offset-4 transition hover:text-gold-600 dark:text-white dark:hover:text-gold-400"
              >
                Create one
              </Link>
            </p>
          </div>
        </section>
      </main>
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
