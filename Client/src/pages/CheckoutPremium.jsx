import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";
import { createOrder } from "../services/api";
import { toast } from "react-hot-toast";

export default function CheckoutPremium() {
  const navigate = useNavigate();
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.displayName || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState(null);

  // Fetch delivery settings
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        // Add cache-busting parameter to ensure fresh data
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/delivery-settings?t=${Date.now()}`,
          {
            cache: 'no-cache',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );
        const data = await response.json();
        console.log('🚚 Fetched delivery settings (Premium):', data);
        if (data.success) {
          setDeliverySettings(data.data);
          console.log('✅ Delivery settings applied (Premium):', data.data);
        }
      } catch (err) {
        console.error("Error fetching delivery settings:", err);
        // Use defaults if fetch fails
        setDeliverySettings({
          freeDeliveryThreshold: 50,
          standardDeliveryCharge: 100 / 110,
          freeDeliveryEnabled: true,
        });
      }
    };
    fetchDeliverySettings();
  }, []);

  // Calculate delivery charge
  const freeDeliveryThreshold = deliverySettings?.freeDeliveryThreshold || 50;
  const deliveryChargeAmount = deliverySettings?.standardDeliveryCharge || 100 / 110;
  const freeDeliveryEnabled = deliverySettings?.freeDeliveryEnabled !== false;
  
  const deliveryCharge =
    freeDeliveryEnabled && cartTotal >= freeDeliveryThreshold
      ? 0
      : deliveryChargeAmount;
  
  const finalTotal = cartTotal + deliveryCharge;

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.fullName || !formData.phone || !formData.address || !formData.city) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        products: cart.map((item) => ({
          productId: item._id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null,
          image: item.selectedImage || item.image,
        })),
        total: finalTotal,
        subtotal: cartTotal,
        deliveryCharge: deliveryCharge,
        shippingInfo: {
          name: formData.fullName,
          email: formData.email || user?.email || "",
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          area: "",
          zipCode: formData.postalCode || "",
        },
        paymentMethod: "cod",
        transactionId: null,
        specialInstructions: formData.notes || "",
        couponCode: null,
        redeemedPoints: null,
        pointsDiscount: 0,
        couponDiscount: 0,
        totalDiscount: 0,
      };

      const response = await createOrder(orderData);

      if (response.data.success) {
        clearCart();
        toast.success("Order placed successfully!");
        const orderId = response.data?.data?._id || response.data?._id || "NEW";
        navigate(`/orders`);
      }
    } catch (error) {
      console.error("Order creation failed:", error);
      toast.error(error.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  // Show loading or empty state while redirecting
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-gray-500">Redirecting to cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gray-50 border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl md:text-4xl text-black text-center">
            Checkout
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Contact Information */}
              <div>
                <h2 className="text-sm font-medium text-black mb-6 uppercase tracking-wide">
                  Contact Information
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors"
                      placeholder="+880 1XXX-XXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="pt-8 border-t border-gray-100">
                <h2 className="text-sm font-medium text-black mb-6 uppercase tracking-wide">
                  Shipping Address
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors resize-none"
                      placeholder="House/Flat no, Street, Area"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors"
                        placeholder="Dhaka"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-black mb-2 uppercase tracking-wide">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors"
                        placeholder="1200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Notes */}
              <div className="pt-8 border-t border-gray-100">
                <h2 className="text-sm font-medium text-black mb-6 uppercase tracking-wide">
                  Order Notes (Optional)
                </h2>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 focus:border-black focus:outline-none transition-colors resize-none"
                  placeholder="Any special instructions for your order..."
                />
              </div>

              {/* Payment Method */}
              <div className="pt-8 border-t border-gray-100">
                <h2 className="text-sm font-medium text-black mb-6 uppercase tracking-wide">
                  Payment Method
                </h2>
                <div className="bg-gray-50 p-6 border border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      checked
                      readOnly
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="text-sm font-medium text-black">Cash on Delivery</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Pay with cash when your order is delivered
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button - Mobile */}
              <div className="lg:hidden">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-black text-white text-sm tracking-widest uppercase font-medium hover:bg-gold-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Place Order"}
                </button>
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 mt-12 lg:mt-0">
            <div className="bg-gray-50 p-8 sticky top-24">
              <h2 className="font-display text-xl text-black mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                {cart.map((item) => (
                  <div key={`${item._id}_${item.selectedSize || 'no-size'}_${item.selectedColor?.name || 'no-color'}`} className="flex gap-4">
                    <div className="w-16 h-20 flex-shrink-0 bg-white border border-gray-200 overflow-hidden">
                      <img
                        src={item.selectedImage || item.image}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-black font-medium truncate mb-2">
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
                        <p className="text-sm text-gray-600">
                          ৳{item.price.toLocaleString()} × {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-black">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-black">
                    ৳{cartTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className={`font-medium ${deliveryCharge === 0 ? 'text-green-600' : 'text-black'}`}>
                    {deliveryCharge === 0 ? 'Free' : `৳${deliveryCharge.toLocaleString()}`}
                  </span>
                </div>
                {freeDeliveryEnabled && cartTotal < freeDeliveryThreshold && (
                  <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    Add ৳{(freeDeliveryThreshold - cartTotal).toLocaleString()} more for free delivery
                  </div>
                )}
              </div>

              <div className="flex justify-between text-lg mb-8">
                <span className="font-medium text-black">Total</span>
                <span className="font-display text-2xl font-semibold text-black">
                  ৳{finalTotal.toLocaleString()}
                </span>
              </div>

              {/* Submit Button - Desktop */}
              <div className="hidden lg:block">
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-4 bg-black text-white text-sm tracking-widest uppercase font-medium hover:bg-gold-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : "Place Order"}
                </button>
              </div>

              {/* Security Badge */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-3 text-xs text-gray-500">
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
    </div>
  );
}
