import { useState } from 'react';
import { useCurrency } from '../hooks/useCurrency';
import toast from 'react-hot-toast';

export default function PaymentProcessModal({ 
  isOpen, 
  onClose, 
  orderData, 
  paymentMethod,
  onPaymentComplete 
}) {
  const { formatPrice } = useCurrency();
  const [currentStep, setCurrentStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [orderCode, setOrderCode] = useState('');

  if (!isOpen || !orderData) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('01978305319');
    setCopied(true);
    toast.success('Phone number copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(orderData.deliveryFee.toString());
    toast.success('Amount copied!');
  };

  const handleGenerateOrderCode = () => {
    const code = `ORD-${Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0')}`;
    setOrderCode(code);
    toast.success('Order code generated!');
  };

  const handleCopyOrderCode = () => {
    if (orderCode) {
      navigator.clipboard.writeText(orderCode);
      toast.success('Order code copied!');
    }
  };

  const handlePaymentComplete = () => {
    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }
    if (!orderCode.trim()) {
      toast.error('Please generate order code first');
      return;
    }
    onPaymentComplete(transactionId, orderCode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Payment Process</h2>
            <p className="text-primary-100 text-sm mt-1">Step {currentStep} of 4</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-primary-800 rounded-full p-2 transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition ${
                    step <= currentStep
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step < currentStep ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition ${
                      step < currentStep ? 'bg-primary-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Order Summary */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-semibold text-gray-900">{formatPrice(orderData.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee:</span>
                  <span className="font-semibold text-primary-600">{formatPrice(orderData.deliveryFee)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total Amount:</span>
                  <span className="font-bold text-lg text-primary-600">{formatPrice(orderData.total)}</span>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  <strong>Payment Breakdown:</strong>
                </p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>✓ Pay <strong>{formatPrice(orderData.deliveryFee)}</strong> now via {paymentMethod}</li>
                  <li>✓ Pay <strong>{formatPrice(orderData.subtotal)}</strong> on delivery (COD)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 2: Generate Order Code */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Generate Order Code</h3>
              
              <p className="text-gray-600 mb-4">
                Generate a unique order code to use as reference for your payment.
              </p>

              {!orderCode ? (
                <button
                  onClick={handleGenerateOrderCode}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
                >
                  Generate Order Code
                </button>
              ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-green-700 mb-2">Your Order Code</p>
                  <div className="flex items-center justify-center gap-3">
                    <p className="text-4xl font-bold text-green-600 font-mono">{orderCode}</p>
                    <button
                      onClick={handleCopyOrderCode}
                      className="p-2 hover:bg-green-100 rounded-lg transition"
                      title="Copy order code"
                    >
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-green-600 mt-2">✓ Copied to clipboard</p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Keep this order code safe. You'll need it to reference your payment.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Payment Instructions */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment Instructions</h3>
              
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900">
                  <strong>Payment Method:</strong> {paymentMethod}
                </p>
              </div>

              {/* Payment Details Card */}
              <div className="bg-white border-2 border-gray-200 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Payment Number:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-primary-600">01978305319</p>
                    <button
                      onClick={handleCopyPhone}
                      className={`p-2 rounded-lg transition ${
                        copied ? 'bg-green-100' : 'hover:bg-gray-100'
                      }`}
                      title="Copy phone number"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 mb-2">Amount to Send:</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-green-600">{formatPrice(orderData.deliveryFee)}</p>
                    <button
                      onClick={handleCopyAmount}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Copy amount"
                    >
                      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600 mb-2">Reference:</p>
                  <p className="text-sm font-mono text-gray-900">{orderCode}</p>
                </div>
              </div>

              {/* Step-by-Step Guide */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-3">Steps to Follow:</p>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                    <span>Open your {paymentMethod} app</span>
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
                    <span>Enter amount: <strong>{formatPrice(orderData.deliveryFee)}</strong></span>
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
          )}

          {/* Step 4: Enter Transaction ID */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Confirm Payment</h3>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-900">
                  ✓ Payment sent successfully? Enter your transaction ID below.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter your transaction ID (e.g., TXN123456789)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can find this in your {paymentMethod} transaction history
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-blue-900">Order Summary:</p>
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Order Code:</span>
                    <span className="font-mono font-bold">{orderCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method:</span>
                    <span className="font-bold">{paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount Paid:</span>
                    <span className="font-bold">{formatPrice(orderData.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining (COD):</span>
                    <span className="font-bold">{formatPrice(orderData.subtotal)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> Our team will verify your payment within 24 hours. You'll receive a confirmation via SMS/Email.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex gap-3">
          <button
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
              } else {
                onClose();
              }
            }}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>

          {currentStep < 4 ? (
            <button
              onClick={() => {
                if (currentStep === 2 && !orderCode) {
                  toast.error('Please generate order code first');
                  return;
                }
                setCurrentStep(currentStep + 1);
              }}
              className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handlePaymentComplete}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Complete Order
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
