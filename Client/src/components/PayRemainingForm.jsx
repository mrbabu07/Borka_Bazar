import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCurrency } from '../hooks/useCurrency';

export default function PayRemainingForm({ order, onPaymentSubmitted }) {
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    method: 'COD',
    transactionId: '',
  });
  const [errors, setErrors] = useState({});
  const { formatPrice } = useCurrency();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (paymentData.method !== 'COD' && !paymentData.transactionId.trim()) {
      newErrors.transactionId = 'Transaction ID is required for online payment';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/orders/${order._id}/pay-remaining`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('firebaseToken')}`,
          },
          body: JSON.stringify({
            method: paymentData.method,
            transactionId: paymentData.transactionId,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit payment');
      }

      toast.success('Remaining payment submitted successfully!');
      setPaymentData({ method: 'COD', transactionId: '' });
      
      if (onPaymentSubmitted) {
        onPaymentSubmitted(result.data);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Failed to submit payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Pay Remaining Amount</h3>

      {/* Amount Display */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700 mb-1">Remaining Amount</p>
        <p className="text-3xl font-bold text-blue-600">{formatPrice(order.pricing.remainingAmount)}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Payment Method *
          </label>
          <div className="space-y-2">
            {['COD', 'bKash', 'Nagad'].map((method) => (
              <label
                key={method}
                className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition ${
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
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium text-gray-900">{method}</p>
                  <p className="text-xs text-gray-500">
                    {method === 'COD'
                      ? 'Pay when order arrives'
                      : `Send money via ${method}`}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Transaction ID Input (for online methods) */}
        {paymentData.method !== 'COD' && (
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
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
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
        )}

        {/* Payment Instructions for Online Methods */}
        {paymentData.method !== 'COD' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900 font-semibold mb-2">Payment Instructions:</p>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Open your {paymentData.method} app</li>
              <li>Select "Send Money"</li>
              <li>Enter number: <strong>01978305319</strong></li>
              <li>Enter amount: <strong>{formatPrice(order.pricing.remainingAmount)}</strong></li>
              <li>Use order code as reference: <strong>{order.orderCode}</strong></li>
              <li>Complete the transaction</li>
            </ol>
          </div>
        )}

        {/* COD Information */}
        {paymentData.method === 'COD' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-900 font-semibold mb-2">Cash on Delivery</p>
            <p className="text-sm text-green-800">
              You will pay {formatPrice(order.pricing.remainingAmount)} when your order arrives.
            </p>
          </div>
        )}

        {/* Submit Button */}
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
  );
}
