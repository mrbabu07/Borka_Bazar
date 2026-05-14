import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { updateProfile } from "firebase/auth";
import useAuth from "../hooks/useAuth";
import SocialLogin from "../components/SocialLogin";
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    <div className="flex min-h-[85vh] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <Link to="/" className="mb-6 inline-flex items-center space-x-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600">
              <span className="text-2xl font-bold text-white">H</span>
            </div>
          </Link>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Create an account
          </h1>
          <p className="text-gray-600">Join Borka Bazar and start shopping</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-soft">
          {error && (
            <div className="mb-6 flex items-start space-x-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <svg
                className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormInput
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
              <FormInput
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="01XXXXXXXXX"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormInput
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Division
                </label>
                <select
                  name="division"
                  value={formData.division}
                  onChange={handleChange}
                  required
                  className="input-field"
                >
                  <option value="">Select division</option>
                  {BANGLADESH_DIVISIONS.map((division) => (
                    <option key={division} value={division}>
                      {division}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormInput
                label="District"
                name="district"
                value={formData.district}
                onChange={handleChange}
                placeholder="District"
                required
              />
              <FormInput
                label="Upazila"
                name="upazila"
                value={formData.upazila}
                onChange={handleChange}
                placeholder="Upazila"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormInput
                label="Union"
                name="union"
                value={formData.union}
                onChange={handleChange}
                placeholder="Union"
                required
              />
              <FormInput
                label="Area Name"
                name="area"
                value={formData.area}
                onChange={handleChange}
                placeholder="Village/area name"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                House / Road / Details
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows="3"
                placeholder="House/flat, road, landmark"
                className="input-field resize-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <FormInput
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  required
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Must be at least 6 characters
                </p>
              </div>
              <FormInput
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center space-x-2 py-3 btn-primary"
            >
              {loading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <SocialLogin />

          <p className="mt-6 text-center text-xs text-gray-500">
            By creating an account, you agree to our{" "}
            <a href="#" className="text-primary-500 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary-500 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>

        <p className="mt-8 text-center text-gray-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-primary-500 hover:text-primary-600"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="input-field"
      />
    </div>
  );
}
