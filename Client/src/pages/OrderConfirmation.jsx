import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';
import { getOrderById } from '../services/api';
import toast from 'react-hot-toast';

export default function OrderConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const [copied, setCopied] = useState(false);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const state = location.state;

  useEffect(() => {
    // If we have state data, use it
    if (state?.orderCode) {
      console.log('📦 Order confirmation state:', state);
      console.log('📦 State pricing object:', state.pricing);
      console.log('📦 State totalPrice:', state.totalPrice);
      console.log('📦 State deliveryCharge:', state.deliveryCharge);
      console.log('📦 State subtotal:', state.subtotal);
      
      // Save order ID to localStorage for fallback
      if (state._id) {
        localStorage.setItem('lastOrderId', state._id);
      }
      
      // Support both new 2-step payment structure and legacy orders
      const total = state.pricing?.total || state.totalPrice || state.total || 0;
      const deliveryFee = state.pricing?.deliveryFee || state.deliveryCharge || 0;
      const subtotal = state.pricing?.subtotal || state.subtotal || 0;
      const remainingAmount = state.pricing?.remainingAmount || subtotal || 0;
      
      console.log('💰 Calculated amounts from state:', { total, deliveryFee, subtotal, remainingAmount });
      console.log('💰 Amount sources:', {
        total_from: state.pricing?.total ? 'pricing.total' : (state.totalPrice ? 'totalPrice' : (state.total ? 'total' : 'default 0')),
        deliveryFee_from: state.pricing?.deliveryFee ? 'pricing.deliveryFee' : (state.deliveryCharge ? 'deliveryCharge' : 'default 0'),
        subtotal_from: state.pricing?.subtotal ? 'pricing.subtotal' : (state.subtotal ? 'subtotal' : 'default 0'),
      });
      
      setOrder({
        orderCode: state.orderCode,
        orderId: state._id || state.orderId,
        total: total,
        deliveryFee: deliveryFee,
        remainingAmount: remainingAmount,
        paymentMethod: state.payment?.advance?.method || state.paymentInfo?.method || state.paymentMethod || 'COD',
      });
      setLoading(false);
      return;
    }

    // Try to get the last order from localStorage as fallback
    const lastOrderId = localStorage.getItem('lastOrderId');
    console.log('📦 No state data, trying localStorage:', lastOrderId);
    if (lastOrderId) {
      fetchOrder(lastOrderId);
    } else {
      // Redirect to home if no order data
      console.log('❌ No order data found, redirecting to home');
      setLoading(false);
      navigate('/');
    }
  }, [state, navigate]);

  const fetchOrder = async (orderId) => {
    try {
      console.log('📦 Fetching order from server:', orderId);
      const response = await getOrderById(orderId);
      if (response.data?.data) {
        const orderData = response.data.data;
        console.log('✅ Order fetched from server:', orderData);
        console.log('✅ Server response fields:', {
          totalPrice: orderData.totalPrice,
          deliveryCharge: orderData.deliveryCharge,
          subtotal: orderData.subtotal,
          pricing: orderData.pricing,
          advancePayment: orderData.advancePayment,
        });
        
        // Support both new 2-step payment structure and legacy orders
        const total = orderData.pricing?.total || orderData.totalPrice || orderData.total || 0;
        const deliveryFee = orderData.pricing?.deliveryFee || orderData.deliveryCharge || 0;
        const subtotal = orderData.pricing?.subtotal || orderData.subtotal || 0;
        const remainingAmount = orderData.pricing?.remainingAmount || subtotal || 0;
        
        console.log('💰 Calculated amounts from server:', { total, deliveryFee, subtotal, remainingAmount });
        
        setOrder({
          orderCode: orderData.orderCode,
          orderId: orderData._id,
          total: total,
          deliveryFee: deliveryFee,
          remainingAmount: remainingAmount,
          paymentMethod: orderData.payment?.advance?.method || orderData.paymentInfo?.method || orderData.paymentMethod || 'COD',
        });
      }
    } catch (error) {
      console.error('❌ Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order?.orderCode) {
    return null;
  }

  const handleCopyOrderCode = () => {
    navigator.clipboard.writeText(order.orderCode);
    setCopied(true);
    toast.success('Order code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">Thank you for your order. Your payment is under verification.</p>
        </div>

        {/* Order Code Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 mb-2">Your Order Code</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-4xl font-bold text-primary-600 font-mono">{order.orderCode}</p>
              <button
                onClick={handleCopyOrderCode}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
                title="Copy order code"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
            {copied && <p className="text-sm text-green-600 mt-2">✓ Copied!</p>}
          </div>

          {/* Order Summary */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee (Paid Now):</span>
                <span className="font-semibold text-green-600">{formatPrice(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Product Amount (COD):</span>
                <span className="font-semibold text-blue-600">{formatPrice(order.remainingAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t">
                <span>Total Order Value:</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Payment Status</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-blue-900">Delivery Fee Payment</p>
                <p className="text-sm text-blue-700">Awaiting verification from our team</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-blue-900">Product Amount (COD)</p>
                <p className="text-sm text-blue-700">Will be collected during delivery</p>
              </div>
            </div>
          </div>
        </div>

        {/* What's Next */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">1</span>
              <span className="text-gray-700">Our team will verify your payment within 24 hours</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">2</span>
              <span className="text-gray-700">Once verified, your order will be processed and shipped</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">3</span>
              <span className="text-gray-700">You'll receive a tracking number via SMS/Email</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">4</span>
              <span className="text-gray-700">Pay the remaining amount ({formatPrice(order.remainingAmount)}) when the delivery arrives</span>
            </li>
          </ol>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <h4 className="font-semibold text-yellow-900 mb-2">Important Notes:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Keep your Order Code ({order.orderCode}) safe for reference</li>
            <li>• Payment verification may take up to 24 hours</li>
            <li>• You'll receive order updates via SMS and Email</li>
            <li>• Contact us if you don't receive updates within 24 hours</li>
          </ul>
        </div>

        {/* Contact Support */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://api.whatsapp.com/message/OSBDQIJSDBKUP1?autoload=1&app_absent=0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition"
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
              className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition"
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/products')}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/orders')}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            View My Orders
          </button>
        </div>
      </div>
    </div>
  );
}
