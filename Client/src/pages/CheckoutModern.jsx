import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import toast from 'react-hot-toast';
import CheckoutProgress from '../components/checkout/CheckoutProgress';
import AddressStep from '../components/checkout/steps/AddressStep';
import ReviewStep from '../components/checkout/steps/ReviewStep';
import PaymentStep from '../components/checkout/steps/PaymentStep';
import ConfirmationStep from '../components/checkout/steps/ConfirmationStep';

export default function CheckoutModern() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);

  // Address data
  const [address, setAddress] = useState({
    fullName: user?.displayName || '',
    phone: '',
    email: user?.email || '',
    street: '',
    city: '',
    area: '',
    postalCode: '',
  });

  // Payment data
  const [paymentData, setPaymentData] = useState({
    method: 'bKash',
    transactionId: '',
    screenshot: null,
  });

  const [errors, setErrors] = useState({});

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 200;
  const total = subtotal + deliveryFee;

  // Validate address
  const validateAddress = () => {
    const newErrors = {};
    if (!address.fullName.trim()) newErrors.fullName = 'Full name required';
    if (!address.phone.trim()) newErrors.phone = 'Phone required';
    if (!address.street.trim()) newErrors.street = 'Street address required';
    if (!address.city.trim()) newErrors.city = 'City required';
    if (!address.area.trim()) newErrors.area = 'Area required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate payment
  const validatePayment = () => {
    const newErrors = {};
    if (!paymentData.transactionId.trim()) {
      newErrors.transactionId = 'Transaction ID required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle step navigation
  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!validateAddress()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!validatePayment()) return;
      await submitOrder();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  // Submit order
  const submitOrder = async () => {
    setLoading(true);
    try {
      const orderPayload = {
        customerName: address.fullName,
        customerPhone: address.phone,
        customerEmail: address.email,
        customerAddress: `${address.street}, ${address.area}, ${address.city}, ${address.postalCode}`,
        products: cart.map((item) => ({
          productId: item._id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          size: item.selectedSize,
          color: item.selectedColor?.name,
        })),
        subtotal,
        deliveryFee,
        paymentMethod: paymentData.method,
        transactionId: paymentData.transactionId,
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create order');
      }

      setOrderData(result.data);
      clearCart();
      setCurrentStep(4);
      toast.success('Order submitted successfully!');
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.message || 'Failed to submit order');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && currentStep !== 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <button
            onClick={() => navigate('/products')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>
      </div>

      {/* Progress Indicator */}
      <CheckoutProgress currentStep={currentStep} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Steps */}
          <div className="lg:col-span-2">
            {currentStep === 1 && (
              <AddressStep
                address={address}
                setAddress={setAddress}
                errors={errors}
                setErrors={setErrors}
              />
            )}

            {currentStep === 2 && (
              <ReviewStep
                cart={cart}
                address={address}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                total={total}
                formatPrice={formatPrice}
              />
            )}

            {currentStep === 3 && (
              <PaymentStep
                paymentData={paymentData}
                setPaymentData={setPaymentData}
                errors={errors}
                setErrors={setErrors}
                deliveryFee={deliveryFee}
                formatPrice={formatPrice}
              />
            )}

            {currentStep === 4 && orderData && (
              <ConfirmationStep
                orderData={orderData}
                address={address}
                subtotal={subtotal}
                deliveryFee={deliveryFee}
                formatPrice={formatPrice}
              />
            )}

            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && (
                    <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  {currentStep === 3 ? 'Submit Payment' : 'Continue'}
                </button>
              </div>
            )}

            {currentStep === 4 && (
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => navigate('/products')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => navigate('/orders')}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  View Orders
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>

              {/* Cart Items */}
              <div className="space-y-3 mb-4 pb-4 border-b">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between text-sm">
                    <div>
                      <p className="text-gray-900 font-medium">{item.title}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-gray-900 font-semibold">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 mb-4 pb-4 border-b">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Fee</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-primary-600">{formatPrice(total)}</span>
              </div>

              {/* Payment Info */}
              {currentStep >= 3 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                  <p className="text-blue-900 font-semibold mb-2">Payment Breakdown</p>
                  <p className="text-blue-800">Pay Now: {formatPrice(deliveryFee)}</p>
                  <p className="text-blue-800">Pay on Delivery: {formatPrice(subtotal)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
