import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import { useCurrency } from '../hooks/useCurrency';
import PaymentProcessModal from '../components/PaymentProcessModal';
import toast from 'react-hot-toast';

export default function CheckoutPartialPayment() {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { formatPrice } = useCurrency();

  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    paymentMethod: 'bKash',
  });

  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    deliveryFee: 200,
    total: 0,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (cartItems.length > 0) {
      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const total = subtotal + orderSummary.deliveryFee;

      setOrderSummary({
        subtotal,
        deliveryFee: orderSummary.deliveryFee,
        total,
      });
    }
  }, [cartItems]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Full name is required';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (!/^[0-9]{10,15}$/.test(formData.customerPhone.replace(/\D/g, ''))) {
      newErrors.customerPhone = 'Invalid phone number';
    }

    if (!formData.customerAddress.trim()) {
      newErrors.customerAddress = 'Delivery address is required';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Payment method is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (transactionId, orderCode) => {
    setLoading(true);

    try {
      const orderData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        customerAddress: formData.customerAddress,
        products: cartItems.map((item) => ({
          productId: item._id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          size: item.size,
          color: item.color,
        })),
        subtotal: orderSummary.subtotal,
        deliveryFee: orderSummary.deliveryFee,
        paymentMethod: formData.paymentMethod,
        transactionId: transactionId,
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/orders/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create order');
      }

      clearCart();
      toast.success('Order created successfully!');
      setShowPaymentModal(false);

      navigate('/order-confirmation', {
        state: {
          orderCode: result.data.orderCode,
          orderId: result.data.orderId,
          total: result.data.total,
          deliveryFee: result.data.deliveryFee,
          remainingAmount: result.data.remainingAmount,
          paymentMethod: formData.paymentMethod,
        },
      });
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b">
                {cartItems.map((item) => (
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

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Payment Instructions</h3>

              <div className="space-y-4">
                <div className="bg-white rounded p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Send Delivery Fee via {formData.paymentMethod}:
                  </p>
                  <p className="text-2xl font-bold text-primary-600 mb-3">
                    {formatPrice(orderSummary.deliveryFee)}
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    <strong>Payment Number:</strong> 01978305319
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Reference:</strong> Use your Order Code as reference
                  </p>
                </div>

                <div className="bg-white rounded p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Steps:</p>
                  <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                    <li>Open {formData.paymentMethod} app</li>
                    <li>Select "Send Money"</li>
                    <li>Enter number: 01978305319</li>
                    <li>Enter amount: {formatPrice(orderSummary.deliveryFee)}</li>
                    <li>Use Order Code as reference</li>
                    <li>Complete the transaction</li>
                    <li>Enter Transaction ID in next step</li>
                  </ol>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Remaining amount ({formatPrice(orderSummary.subtotal)}) will be collected during delivery via Cash on Delivery.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.customerName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.customerName && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  placeholder="01XXXXXXXXX"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.customerPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.customerPhone && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerPhone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address *
                </label>
                <textarea
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleChange}
                  placeholder="Enter your complete delivery address"
                  rows="3"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.customerAddress ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.customerAddress && (
                  <p className="text-red-500 text-sm mt-1">{errors.customerAddress}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="bKash">bKash</option>
                  <option value="Nagad">Nagad</option>
                </select>
                {errors.paymentMethod && (
                  <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Proceed to Payment'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Total</h3>

              <div className="space-y-3 pb-4 border-b">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatPrice(orderSummary.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee:</span>
                  <span className="text-primary-600 font-semibold">
                    {formatPrice(orderSummary.deliveryFee)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold text-gray-900 pt-4 mb-6">
                <span>Total:</span>
                <span>{formatPrice(orderSummary.total)}</span>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>Pay Now:</strong> {formatPrice(orderSummary.deliveryFee)}
                </p>
                <p className="text-sm text-green-700 mt-2">
                  <strong>Pay on Delivery:</strong> {formatPrice(orderSummary.subtotal)}
                </p>
              </div>

              <div className="text-xs text-gray-500 text-center">
                <p>✓ Secure checkout</p>
                <p>✓ Manual payment verification</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PaymentProcessModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderData={orderSummary}
        paymentMethod={formData.paymentMethod}
        onPaymentComplete={handlePaymentComplete}
      />
    </div>
  );
}
