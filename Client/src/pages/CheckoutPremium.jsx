import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";
import {
  createAddress,
  createOrder,
  getDefaultAddress,
  getUserAddresses,
  validateCoupon,
} from "../services/api";
import { toast } from "react-hot-toast";
import {
  BANGLADESH_DIVISIONS,
  getAddressSummary,
  normalizeAddress,
  toAddressPayload,
} from "../utils/bangladeshAddress";
import { calculateCheckoutPricing } from "../utils/checkoutPricing";

const PAYMENT_ACCOUNTS = {
  bKash: {
    label: "bKash",
    number: process.env.NEXT_PUBLIC_BKASH_PAYMENT_NUMBER || "01878305319",
  },
  Nagad: {
    label: "Nagad",
    number: process.env.NEXT_PUBLIC_NAGAD_PAYMENT_NUMBER || "01878305319",
  },
};
const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
const fieldClass =
  "w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-white";

export default function CheckoutPremium() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    address: "",
    division: "",
    district: "",
    upazila: "",
    union: "",
    area: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showSavedAddresses, setShowSavedAddresses] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    method: "bKash",
    transactionId: "",
    senderNumber: "",
  });

  // Fetch delivery settings
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        // Add cache-busting parameter to ensure fresh data
        const response = await fetch(
          `${API_URL}/delivery-settings?t=${Date.now()}`,
          {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );
        const data = await response.json();
        if (data.success) {
          setDeliverySettings(data.data);
        }
      } catch (err) {
        console.error("Error fetching delivery settings:", err);
        // Use defaults if fetch fails
        setDeliverySettings({
          standardDeliveryCharge: 100,
        });
      }
    };
    fetchDeliverySettings();
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadDefaultAddress() {
      if (!user) return;

      setFormData((current) => ({
        ...current,
        fullName: user.displayName || current.fullName,
        email: user.email || current.email,
      }));

      try {
        const response = await getDefaultAddress();
        if (ignore) return;
        if (response.data?.success && response.data?.data) {
          setDefaultAddress(response.data.data);
          loadAddress(response.data.data);
        }
      } catch (error) {
        if (error.response?.status !== 404) {
          console.error("Failed to load default address:", error);
        }
      }
    }

    loadDefaultAddress();

    return () => {
      ignore = true;
    };
  }, [user]);

  // Use delivery settings or BDT defaults
  const {
    deliveryCharge,
    paymentOption,
    requiresOnlinePayment: calculatedRequiresOnlinePayment,
    advancePaymentAmount,
    finalTotal,
    dueAmount,
  } = calculateCheckoutPricing({
    cartTotal,
    couponDiscount,
    deliverySettings,
  });
  const deliverySettingsReady = Boolean(deliverySettings);
  const requiresOnlinePayment =
    !deliverySettingsReady || calculatedRequiresOnlinePayment;
  const paymentModeTitle =
    paymentOption === "full_payment"
      ? "Full Payment"
      : paymentOption === "cod"
        ? "Cash On Delivery"
        : "Delivery Fee Payment";
  const paymentInstruction =
    paymentOption === "full_payment"
      ? "Send the full order amount before placing the order."
      : paymentOption === "cod"
        ? "No advance payment is required. Pay the full amount on delivery."
        : "Send only the delivery fee before placing the order. Product amount stays cash on delivery.";
  const selectedPaymentAccount =
    PAYMENT_ACCOUNTS[paymentInfo.method] || PAYMENT_ACCOUNTS.bKash;

  useEffect(() => {
    setPaymentInfo((current) => {
      if (requiresOnlinePayment && !PAYMENT_ACCOUNTS[current.method]) {
        return { method: "bKash", transactionId: "", senderNumber: "" };
      }

      return current;
    });
  }, [requiresOnlinePayment]);

  // Redirect to cart if empty
  useEffect(() => {
    if (cart.length === 0) {
      navigate("/cart");
    }
  }, [cart.length, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const loadAddress = (address) => {
    const normalized = normalizeAddress(address);
    setFormData((current) => ({
      ...current,
      fullName: normalized.name || current.fullName,
      phone: normalized.phone || current.phone,
      address: normalized.address,
      division: normalized.division,
      district: normalized.district,
      upazila: normalized.upazila,
      union: normalized.union,
      area: normalized.area,
    }));
    setAddressLoaded(true);
    setShowSavedAddresses(false);
  };

  const fetchSavedAddresses = async () => {
    try {
      const response = await getUserAddresses();
      setSavedAddresses(response.data?.data || []);
      setShowSavedAddresses(true);
    } catch (error) {
      console.error("Failed to load saved addresses:", error);
      toast.error("Failed to load saved addresses");
    }
  };

  const handlePaymentChange = (e) => {
    setPaymentInfo({
      ...paymentInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    try {
      setCouponLoading(true);
      const response = await validateCoupon(couponCode.toUpperCase(), cartTotal);

      if (response.data.success && response.data.data) {
        const discount = response.data.data.discountAmount || 0;
        setCouponDiscount(discount);
        setCouponApplied(true);
        toast.success(`Coupon applied! Discount: ৳${discount.toLocaleString()}`);
      } else {
        toast.error(response.data.message || "Invalid coupon code");
        setCouponDiscount(0);
        setCouponApplied(false);
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast.error(error.response?.data?.message || "Failed to validate coupon");
      setCouponDiscount(0);
      setCouponApplied(false);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setCouponApplied(false);
    toast.success("Coupon removed");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!deliverySettingsReady) {
      toast.error("Delivery settings are still loading. Please try again.");
      return;
    }

    // Validation
    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.address ||
      !formData.division ||
      !formData.district ||
      !formData.upazila ||
      !formData.union ||
      !formData.area
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (requiresOnlinePayment && !paymentInfo.transactionId.trim()) {
      toast.error(`Please enter your ${selectedPaymentAccount.label} transaction ID`);
      return;
    }

    if (requiresOnlinePayment && !paymentInfo.senderNumber.trim()) {
      toast.error(`Please enter the ${selectedPaymentAccount.label} sender number`);
      return;
    }

    if (
      requiresOnlinePayment &&
      !/^(\+?88)?01[3-9]\d{8}$/.test(paymentInfo.senderNumber.trim())
    ) {
      toast.error("Please enter a valid Bangladeshi sender number");
      return;
    }

    try {
      setLoading(true);

      if (saveAsDefault || (!defaultAddress && user)) {
        await createAddress({
          ...toAddressPayload({
            name: formData.fullName,
            phone: formData.phone,
            address: formData.address,
            division: formData.division,
            district: formData.district,
            upazila: formData.upazila,
            union: formData.union,
            area: formData.area,
            zipCode: "",
          }),
          isDefault: true,
        }).catch((error) => {
          console.error("Failed to save checkout address:", error);
        });
      }

      const orderItems = cart.map((item) => ({
          productId: item._id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null,
          image: item.selectedImage || item.image,
        }));

      const shippingInfo = {
        name: formData.fullName,
        email: formData.email || user?.email || "",
        phone: formData.phone,
        address: formData.address,
        city: formData.district,
        division: formData.division,
        district: formData.district,
        upazila: formData.upazila,
        union: formData.union,
        area: formData.area,
        zipCode: "",
      };

      const orderData = {
        products: orderItems,
        orderItems,
        total: finalTotal,
        totalPrice: finalTotal,
        subtotal: cartTotal,
        deliveryFee: deliveryCharge,
        deliveryCharge: deliveryCharge,
        shippingInfo,
        customerName: shippingInfo.name,
        customerPhone: shippingInfo.phone,
        customerEmail: shippingInfo.email,
        customerAddress: shippingInfo.address,
        paymentMethod: requiresOnlinePayment ? paymentInfo.method : "COD",
        transactionId: requiresOnlinePayment
          ? paymentInfo.transactionId.trim()
          : "",
        senderNumber: requiresOnlinePayment
          ? paymentInfo.senderNumber.trim()
          : "",
        receiverNumber: requiresOnlinePayment
          ? selectedPaymentAccount.number
          : "",
        specialInstructions: formData.notes || "",
        couponCode: couponApplied ? couponCode : null,
        couponDiscount: couponDiscount,
        totalDiscount: couponDiscount,
      };

      const response = await createOrder(orderData);

      if (response.data.success) {
        clearCart();
        toast.success("Order placed successfully!");
        const orderData_response = response.data?.data || response.data;
        console.log('📦 Order created, response data:', orderData_response);
        console.log('💰 Response fields:', {
          totalPrice: orderData_response?.totalPrice,
          deliveryCharge: orderData_response?.deliveryCharge,
          subtotal: orderData_response?.subtotal,
          pricing: orderData_response?.pricing,
        });
        
        // Redirect to order confirmation with full order data
        console.log('🔄 Redirecting to order confirmation with state:', {
          totalPrice: orderData_response?.totalPrice || finalTotal,
          deliveryCharge: orderData_response?.deliveryCharge || deliveryCharge,
          subtotal: orderData_response?.subtotal || cartTotal,
        });
        
        // Ensure we have valid values (not 0 or undefined)
        const confirmationTotalPrice = orderData_response?.totalPrice ?? finalTotal;
        const confirmationDeliveryCharge = orderData_response?.deliveryCharge ?? deliveryCharge;
        const confirmationSubtotal = orderData_response?.subtotal ?? cartTotal;
        
        console.log('🔄 Final values being passed to confirmation:', {
          confirmationTotalPrice,
          confirmationDeliveryCharge,
          confirmationSubtotal,
          finalTotal,
          deliveryCharge,
          cartTotal,
        });
        
        navigate("/order-confirmation", {
          state: {
            orderCode: orderData_response?.orderCode,
            _id: orderData_response?._id,
            orderId: orderData_response?._id,
            totalPrice: confirmationTotalPrice,
            deliveryCharge: confirmationDeliveryCharge,
            subtotal: confirmationSubtotal,
            paymentInfo: orderData_response?.paymentInfo,
            advancePayment: orderData_response?.advancePayment,
            pricing: {
              total: confirmationTotalPrice,
              deliveryFee: confirmationDeliveryCharge,
              subtotal: confirmationSubtotal,
              remainingAmount: dueAmount,
              advancePaymentAmount,
              paymentOption,
            },
            paymentMethod:
              paymentOption === "full_payment"
                ? paymentInfo.method
                : paymentOption === "cod"
                  ? "COD"
                  : `Hybrid ${paymentInfo.method} + COD`,
          },
        });
      }
    } catch (error) {
      const apiMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to place order";
      console.warn("Order creation failed:", {
        status: error.response?.status,
        message: apiMessage,
        details: error.response?.data?.details,
      });
      toast.error(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show loading or empty state while redirecting
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center dark:bg-gray-950">
        <div className="text-center px-4">
          <p className="text-gray-500 dark:text-gray-400">Redirecting to cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28 text-gray-900 dark:bg-gray-950 dark:text-gray-100 lg:pb-0">
      {/* Page Header */}
      <div className="border-b border-gray-100 bg-white py-10 dark:border-gray-800 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="font-display text-3xl md:text-4xl text-black dark:text-white">
              Checkout
            </h1>
            <div className="mt-6 grid grid-cols-3 gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {["Address", "Payment", "Review"].map((step, index) => (
                <div
                  key={step}
                  className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-950"
                >
                  <span className="mr-1 text-black dark:text-white">{index + 1}.</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8 xl:gap-10">
          {/* Checkout Form */}
          <div>
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                <h2 className="text-sm font-medium text-black mb-6 uppercase tracking-wide dark:text-white">
                  Contact Information
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide dark:text-gray-100">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className={fieldClass}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide dark:text-gray-100">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={fieldClass}
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide dark:text-gray-100">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className={fieldClass}
                      placeholder="+880 1XXX-XXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-sm font-medium text-black uppercase tracking-wide dark:text-white">
                    Shipping Address
                  </h2>
                  <button
                    type="button"
                    onClick={fetchSavedAddresses}
                    className="self-start rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold uppercase tracking-wide text-black transition hover:border-black sm:self-auto dark:border-gray-700 dark:text-white dark:hover:border-white"
                  >
                    Use Saved Address
                  </button>
                </div>
                {defaultAddress && addressLoaded && (
                  <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                    <p className="font-semibold">Default address loaded</p>
                    <p className="mt-1">{getAddressSummary(defaultAddress)}</p>
                  </div>
                )}
                {showSavedAddresses && (
                  <div className="mb-5 space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                    {savedAddresses.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No saved addresses found.</p>
                    ) : (
                      savedAddresses.map((address) => (
                        <button
                          key={address._id}
                          type="button"
                          onClick={() => loadAddress(address)}
                          className="block w-full rounded-lg border border-gray-200 bg-white p-3 text-left transition hover:border-black dark:border-gray-800 dark:bg-gray-950 dark:hover:border-white"
                        >
                          <span className="block text-sm font-bold text-black dark:text-white">
                            {address.name} {address.isDefault ? "(Default)" : ""}
                          </span>
                          <span className="mt-1 block text-sm text-gray-600 dark:text-gray-300">
                            {address.phone} - {getAddressSummary(address)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide dark:text-gray-100">
                      House / Road / Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows="3"
                      className={`${fieldClass} resize-none`}
                      placeholder="House/flat, road, landmark"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide dark:text-gray-100">
                        Division <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="division"
                        value={formData.division}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                      >
                        <option value="">Select division</option>
                        {BANGLADESH_DIVISIONS.map((division) => (
                          <option key={division} value={division}>
                            {division}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide dark:text-gray-100">
                        District <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                        placeholder="District"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide dark:text-gray-100">
                        Upazila <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="upazila"
                        value={formData.upazila}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                        placeholder="Upazila"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide dark:text-gray-100">
                        Union <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="union"
                        value={formData.union}
                        onChange={handleChange}
                        required
                        className={fieldClass}
                        placeholder="Union"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide dark:text-gray-100">
                      Area Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      required
                      className={fieldClass}
                      placeholder="Village/area name"
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={saveAsDefault}
                      onChange={(event) => setSaveAsDefault(event.target.checked)}
                      className="h-4 w-4 border-gray-300 text-black focus:ring-black dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-white"
                    />
                    Save this address as default
                  </label>
                </div>
              </div>

              {/* Order Notes */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                <h2 className="text-sm font-medium text-black mb-6 uppercase tracking-wide dark:text-white">
                  Order Notes (Optional)
                </h2>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  className={`${fieldClass} resize-none`}
                  placeholder="Any special instructions for your order..."
                />
              </div>

              {requiresOnlinePayment ? (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                <h2 className="text-sm font-medium text-black mb-6 uppercase tracking-wide dark:text-white">
                  {paymentModeTitle}
                </h2>
                <div className="mb-5 grid grid-cols-2 gap-3">
                  {Object.entries(PAYMENT_ACCOUNTS).map(([method, account]) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() =>
                        setPaymentInfo((current) => ({
                          ...current,
                          method,
                        }))
                      }
                      className={`rounded-lg border-2 p-4 text-left transition ${
                        paymentInfo.method === method
                          ? "border-pink-500 bg-pink-50 dark:bg-pink-950/30"
                          : "border-gray-200 bg-white hover:border-pink-200 dark:border-gray-800 dark:bg-gray-950 dark:hover:border-pink-700"
                      }`}
                    >
                      <p className="text-sm font-bold text-gray-950 dark:text-white">{account.label}</p>
                      <p className="mt-1 font-mono text-sm text-gray-600 dark:text-gray-300">{account.number}</p>
                    </button>
                  ))}
                </div>

                <div className="rounded-lg border-2 border-pink-200 bg-pink-50 p-5 mb-5 dark:border-pink-900/60 dark:bg-pink-950/30">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-pink-800">
                        Send Money to this {selectedPaymentAccount.label} number
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="rounded-lg bg-white px-3 py-2 font-mono text-xl font-bold text-pink-800 shadow-sm dark:bg-gray-950 dark:text-pink-200">
                          {selectedPaymentAccount.number}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedPaymentAccount.number);
                            toast.success(`${selectedPaymentAccount.label} number copied`);
                          }}
                          className="rounded-lg border border-pink-200 bg-white px-3 py-2 text-xs font-bold text-pink-700 transition hover:bg-pink-100 dark:border-pink-900 dark:bg-gray-950 dark:text-pink-200 dark:hover:bg-pink-950"
                        >
                          Copy
                        </button>
                      </div>
                      <p className="text-xs text-pink-700 mt-1">
                        {paymentInstruction}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-pink-700">
                      ৳{advancePaymentAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide dark:text-gray-100">
                      {selectedPaymentAccount.label} Transaction ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="transactionId"
                      value={paymentInfo.transactionId}
                      onChange={handlePaymentChange}
                      required={requiresOnlinePayment}
                      className={fieldClass}
                      placeholder={`${selectedPaymentAccount.label} transaction ID`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide dark:text-gray-100">
                      Your {selectedPaymentAccount.label} Sender Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="senderNumber"
                      value={paymentInfo.senderNumber}
                      onChange={handlePaymentChange}
                      required={requiresOnlinePayment}
                      className={fieldClass}
                      placeholder="01XXXXXXXXX"
                    />
                  </div>
                </div>
              </div>
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
                  <h2 className="text-sm font-medium text-black mb-6 uppercase tracking-wide dark:text-white">
                    Cash On Delivery
                  </h2>
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      No online payment needed before order.
                    </p>
                    <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-200">
                      Pay ৳{finalTotal.toLocaleString()} when your parcel is delivered.
                    </p>
                  </div>
                </div>
              )}

            </form>
          </div>

          {/* Order Summary */}
          <div className="mt-8 lg:mt-0">
            <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-display text-xl text-black dark:text-white">Order Summary</h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {cart.length} item{cart.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                {cart.map((item) => (
                  <div key={`${item._id}_${item.selectedSize || 'no-size'}_${item.selectedColor?.name || 'no-color'}`} className="flex gap-4">
                    <div className="w-16 h-20 flex-shrink-0 bg-white border border-gray-200 overflow-hidden dark:border-gray-800 dark:bg-gray-950">
                      <img
                        src={item.selectedImage || item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black font-medium truncate mb-2 dark:text-white">
                        {item.title}
                      </p>
                      
                      {/* Size and Color Display */}
                      {(item.selectedSize || item.selectedColor) && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {item.selectedSize && (
                            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              {item.selectedSize}
                            </span>
                          )}
                          {item.selectedColor && (
                            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                              </svg>
                              {typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor?.name || 'N/A'}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          ৳{item.price.toLocaleString()} × {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-black dark:text-white">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                {/* Coupon Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-800 dark:bg-gray-950">
                  <label className="block text-sm font-medium text-black mb-3 uppercase tracking-wide dark:text-white">
                    Promo Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={couponApplied}
                      placeholder="Enter coupon code"
                      className="flex-1 min-w-0 px-4 py-2 border border-gray-300 rounded-lg focus:border-black focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                    />
                    {!couponApplied ? (
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponLoading}
                        className="flex-shrink-0 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gold-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="flex-shrink-0 px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  {couponApplied && (
                    <p className="text-xs text-green-600 mt-2">✓ Coupon applied successfully</p>
                  )}
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Product Total</span>
                  <span className="font-medium text-black dark:text-white">
                    ৳{cartTotal.toLocaleString()}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Discount</span>
                    <span className="font-medium text-green-600">
                      -৳{couponDiscount.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Shipping</span>
                  <span className={`font-medium ${deliveryCharge === 0 ? 'text-green-600 dark:text-green-400' : 'text-black dark:text-white'}`}>
                    {deliveryCharge === 0 ? 'Free' : `৳${deliveryCharge.toLocaleString()}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm rounded-lg bg-pink-50 border border-pink-200 px-3 py-2 dark:border-pink-900/60 dark:bg-pink-950/30">
                  <span className="font-semibold text-pink-800 dark:text-pink-200">
                    {paymentOption === "cod" ? "Pay Before Order" : paymentModeTitle}
                  </span>
                  <span className="font-bold text-pink-700 dark:text-pink-200">
                    ৳{advancePaymentAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 dark:border-orange-900/60 dark:bg-orange-950/30">
                  <span className="font-semibold text-orange-800 dark:text-orange-200">
                    {paymentOption === "cod" ? "Cash On Delivery" : "Due On Delivery"}
                  </span>
                  <span className="font-bold text-orange-700 dark:text-orange-200">৳{dueAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg mb-8">
                <span className="font-medium text-black dark:text-white">Total</span>
                <span className="font-display text-2xl font-semibold text-black dark:text-white">
                  ৳{finalTotal.toLocaleString()}
                </span>
              </div>

              {/* Submit Button - Desktop */}
              <div className="hidden lg:block">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading || !deliverySettingsReady}
                  className="w-full rounded-lg bg-black py-4 text-sm font-semibold uppercase tracking-widest text-white transition-colors hover:bg-gold-500 disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-white dark:text-black dark:hover:bg-gold-400"
                >
                  {loading
                    ? "Processing..."
                    : deliverySettingsReady
                      ? "Place Order"
                      : "Loading Delivery..."}
                </button>
              </div>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Your information is secure and encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-2xl backdrop-blur lg:hidden dark:border-gray-800 dark:bg-gray-950/95">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Total
            </p>
            <p className="font-display text-xl font-semibold text-black dark:text-white">
              ৳{finalTotal.toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !deliverySettingsReady}
            className="min-w-[160px] rounded-lg bg-black px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-gold-500 disabled:cursor-not-allowed disabled:bg-gray-400 dark:bg-white dark:text-black dark:hover:bg-gold-400"
          >
            {loading
              ? "Processing..."
              : deliverySettingsReady
                ? "Place Order"
                : "Loading..."}
          </button>
        </div>
      </div>
    </div>
  );
}



