import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function PaymentStep({ paymentData, setPaymentData, errors, setErrors, deliveryFee, formatPrice }) {
  const [orderCode, setOrderCode] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate order code on mount
  useEffect(() => {
    const code = `ORD-${Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0')}`;
    setOrderCode(code);
  }, []);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('01978305319');
    setCopied(true);
    toast.success('Phone number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyOrderCode = () => {
    navigator.clipboard.writeText(orderCode);
    toast.success('Order code copied!');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div className="bg-white rounded-lg shadow-sm p-6">
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
      <div className="bg-white rounded-lg shadow-sm p-6">
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
          {/* Amount */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 mb-2">Amount to Send</p>
            <p className="text-3xl font-bold text-green-600">{formatPrice(deliveryFee)}</p>
          </div>

          {/* Phone Number */}
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-sm text-purple-700 mb-2">Payment Number</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-purple-600">01978305319</p>
              <button
                onClick={handleCopyPhone}
                className={`p-2 rounded-lg transition ${copied ? 'bg-green-100' : 'hover:bg-purple-100'}`}
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
              <span>Enter amount: <strong>{formatPrice(deliveryFee)}</strong></span>
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
      <div className="bg-white rounded-lg shadow-sm p-6">
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
            placeholder="Enter your transaction ID (e.g., TXN123456789)"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.transactionId ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.transactionId && (
            <p className="text-red-500 text-sm mt-1">{errors.transactionId}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            You can find this in your {paymentData.method} transaction history
          </p>
        </div>

        {/* Info Box */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-900">
            ⚠️ Make sure you enter the correct transaction ID. Our team will verify your payment within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}
