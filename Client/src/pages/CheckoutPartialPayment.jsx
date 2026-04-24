import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import useAuth from '../hooks/useAuth';
import { useCurrency } from '../hooks/useCurrency';
import toast from 'react-hot-toast';

export default function CheckoutPartialPayment() {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [copied, setCopied] = useState(false);

  const [paymentData, setPaymentData] = useState({
    method: 'bKash',
    transactionId: '',
  });

  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    deliveryFee: 0,
    total: 0,
  });

  const [errors, setErrors] = useState({});
  const [deliverySettings, setDeliverySettings] = useState(null);

  // Fetch delivery settings on mount
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
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
        if (data.success) {
          setDeliverySettings(data.data);
          setOrderSummary(prev => ({
            ...prev,
            deliveryFee: data.data.standardDeliveryCharge || 200
          }));
        }
      } catch (err) {
        console.error("Error fetching delivery settings:", err);
        // Use default if fetch fails
        setOrderSummary(prev => ({
          ...prev,
          deliveryFee: 200
        }));
      }
    };
    fetchDeliverySettings();
  }, []);

  // Generate order code on mount
  useEffect(() => {
    const code = `ORD-${Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0')}`;
    setOrderCode(code);
  }, []);

  // Calculate totals
  useEffect(() => {
    if (cart.length > 0) {
      const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const total = subtotal + orderSummary.deliveryFee;

      setOrderSummary({
        subtotal,
        deliveryFee: orderSummary.deliveryFee,
        total,
      });
    }
  }, [cart]);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('01978305319');
    toast.success('Phone number copied!');
  };

  const handleCopyOrderCode = () => {
    navigator.clipboard.writeText(orderCode);
    setCopied(true);
    toast.success('Order code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validatePayment = () => {
    const newErrors = {};
    if (!paymentData.transactionId.trim()) {
      newErrors.transactionId = 'Transaction ID is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePayment()) {
      toast.error('Please enter transaction ID');
      return;
    }

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        customerName: user?.displayName || 'User',
        customerPhone: '01978305319',
        customerEmail: user?.email || '',
        customerAddress: 'Address will be collected from checkout',
        products: cart.map((item) => ({
          productId: item._id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          size: item.selectedSize,
          color: item.selectedColor?.name,
        })),
        subtotal: orderSummary.subtotal,
        deliveryFee: orderSummary.deliveryFee,
        paymentMethod: paymentData.method,
        transactionId: paymentData.transactionId,
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create order');
      }

      clearCart();
      toast.success('Payment submitted! Waiting for verification...');

      navigate('/order-confirmation', {
        state: {
          orderCode: result.data.orderCode,
          orderId: result.data.orderId,
          total: result.data.total,
          deliveryFee: result.data.deliveryFee,
          remainingAmount: result.data.remainingAmount,
          paymentMethod: paymentData.method,
        },
      });
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-20">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Payment</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b">
                {cart.map((item) => (
                  <div key={item._id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatPrice(orderSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee:</span>
                  <span>{formatPrice(orderSummary.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 pt-3 border-t">
                  <span>Total:</span>
                  <span>{formatPrice(orderSummary.total)}</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Payment Method</h2>
              <div className="space-y-3">
                {['bKash', 'Nagad'].map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition ${
                      paymentData.method === method
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="method"
                      value={method}
                      checked={paymentData.method === method}
                      onChange={handleChange}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{method}</p>
                      <p className="text-sm text-gray-600">Send money via {method}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Instructions</h2>

              {/* Order Code */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">Your Order Code</p>
                <div className="flex items-center gap-3">
                  <p className="text-3xl font-bold text-blue-600 font-mono">{orderCode}</p>
                  <button
                    onClick={handleCopyOrderCode}
                    className="p-2 hover:bg-blue-100 rounded-lg transition"
                    title="Copy order code"
                  >
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700 mb-2">Amount to Send</p>
                  <p className="text-3xl font-bold text-green-600">{formatPrice(orderSummary.deliveryFee)}</p>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700 mb-2">Payment Number</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-purple-600">01978305319</p>
                    <button
                      onClick={handleCopyPhone}
                      className="p-2 hover:bg-purple-100 rounded-lg transition"
                      title="Copy phone number"
                    >
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="font-semibold text-gray-900 mb-3">Steps to Follow:</p>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                    <span>Open your {paymentData.method} app</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                    <span>Select "Send Money"</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                    <span>Enter number: <strong>01978305319</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">4</span>
                    <span>Enter amount: <strong>{formatPrice(orderSummary.deliveryFee)}</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">5</span>
                    <span>Use order code as reference: <strong>{orderCode}</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">6</span>
                    <span>Complete the transaction</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Transaction ID Input */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Confirm Payment</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  name="transactionId"
                  value={paymentData.transactionId}
                  onChange={handleChange}
                  placeholder="Enter your transaction ID"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.transactionId ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.transactionId && (
                  <p className="text-red-500 text-sm mt-1">{errors.transactionId}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  You will receive a notification from {paymentData.method} after payment
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-900">
                  ⚠️ After payment, you will receive a notification from {paymentData.method}. Our team will verify your payment within 24 hours.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {loading ? 'Submitting...' : 'Submit Payment'}
              </button>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>

              <div className="space-y-3 pb-4 border-b">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatPrice(orderSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee:</span>
                  <span className="text-primary-600 font-semibold">{formatPrice(orderSummary.deliveryFee)}</span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 mb-6">
                <span>Total:</span>
                <span>{formatPrice(orderSummary.total)}</span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-sm text-green-800">
                  <strong>Pay Now:</strong> {formatPrice(orderSummary.deliveryFee)}
                </p>
                <p className="text-sm text-green-700 mt-2">
                  <strong>Pay on Delivery:</strong> {formatPrice(orderSummary.subtotal)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
