import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ConfirmationStep({ orderData, address, subtotal, deliveryFee, formatPrice }) {
  const [copied, setCopied] = useState(false);

  const handleCopyOrderCode = () => {
    navigator.clipboard.writeText(orderData.orderCode);
    setCopied(true);
    toast.success('Order code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Submitted!</h2>
        <p className="text-gray-600">Your payment is under verification. We'll confirm within 24 hours.</p>
      </div>

      {/* Order Code */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-sm text-gray-600 mb-2">Your Order Code</p>
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-4xl font-bold text-blue-600 font-mono">{orderData.orderCode}</p>
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
        {copied && <p className="text-sm text-green-600 mt-2">✓ Copied to clipboard</p>}
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery Fee (Paid)</span>
            <span className="text-green-600 font-semibold">{formatPrice(deliveryFee)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Remaining (COD)</span>
            <span className="text-2xl font-bold text-primary-600">{formatPrice(subtotal)}</span>
          </div>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="font-semibold text-gray-900">{address.fullName}</p>
          <p className="text-gray-600">{address.phone}</p>
          <p className="text-gray-600">
            {address.street}, {address.area}, {address.city}
            {address.postalCode && `, ${address.postalCode}`}
          </p>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
        <ol className="space-y-3">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">1</span>
            <span className="text-gray-700">Our team will verify your payment within 24 hours</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">2</span>
            <span className="text-gray-700">You'll receive a confirmation SMS/Email</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">3</span>
            <span className="text-gray-700">Your order will be processed and shipped</span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">4</span>
            <span className="text-gray-700">Pay {formatPrice(subtotal)} when delivery arrives (COD)</span>
          </li>
        </ol>
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-900 mb-2">Important Notes:</h4>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Keep your order code safe for reference</li>
          <li>• Payment verification may take up to 24 hours</li>
          <li>• You'll receive order updates via SMS and Email</li>
          <li>• Contact us if you don't receive updates within 24 hours</li>
        </ul>
      </div>

      {/* Contact Support */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="https://api.whatsapp.com/message/OSBDQIJSDBKUP1?autoload=1&app_absent=0"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition"
          >
            <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.2-5.02 5.97-5.02 9.981 0 1.396.264 2.823.786 4.171l-1.24 4.738 4.86-1.271c1.26.736 2.786 1.124 4.342 1.124 5.091 0 9.229-4.128 9.229-9.249 0-2.234-.795-4.331-2.265-6.001-1.47-1.67-3.585-2.61-5.657-2.61z"/>
            </svg>
            <div>
              <p className="font-semibold text-gray-900">WhatsApp</p>
              <p className="text-sm text-gray-600">Chat with us</p>
            </div>
          </a>
          <a
            href="mailto:info@borkabazar.com"
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition"
          >
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="font-semibold text-gray-900">Email</p>
              <p className="text-sm text-gray-600">info@borkabazar.com</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
