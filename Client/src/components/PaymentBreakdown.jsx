import { useCurrency } from '../hooks/useCurrency';

export default function PaymentBreakdown({ order }) {
  const { formatPrice } = useCurrency();

  const getStatusBadge = (status, type = 'advance') => {
    const baseClasses = 'px-3 py-1 rounded-full text-xs font-semibold';

    let classes = baseClasses;
    if (type === 'advance') {
      switch (status) {
        case 'Pending':
          classes += ' bg-yellow-100 text-yellow-800';
          break;
        case 'Confirmed':
          classes += ' bg-green-100 text-green-800';
          break;
        case 'Rejected':
          classes += ' bg-red-100 text-red-800';
          break;
        default:
          classes += ' bg-gray-100 text-gray-800';
      }
    } else {
      switch (status) {
        case 'Pending':
          classes += ' bg-yellow-100 text-yellow-800';
          break;
        case 'Paid':
          classes += ' bg-green-100 text-green-800';
          break;
        default:
          classes += ' bg-gray-100 text-gray-800';
      }
    }
    
    return <span className={classes}>{status}</span>;
  };

  const getPaymentStatusIcon = (status) => {
    switch (status) {
      case 'Pending':
        return '⏳';
      case 'Confirmed':
      case 'Paid':
        return '✅';
      case 'Rejected':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>

      {/* Overall Payment Status */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-700 font-medium">Overall Payment Status</p>
            <p className="text-2xl font-bold text-blue-900 mt-1">
              {order.payment.paymentStatus === 'full' ? '✅ Fully Paid' : '⏳ Partially Paid'}
            </p>
          </div>
          <div className="text-4xl">
            {order.payment.paymentStatus === 'full' ? '✅' : '⏳'}
          </div>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="mb-6 space-y-3 pb-6 border-b">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Subtotal (Products):</span>
          <span className="font-semibold text-gray-900">{formatPrice(order.pricing.subtotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Delivery Fee:</span>
          <span className="font-semibold text-gray-900">{formatPrice(order.pricing.deliveryFee)}</span>
        </div>
        <div className="flex justify-between items-center text-lg">
          <span className="font-semibold text-gray-900">Total Amount:</span>
          <span className="font-bold text-primary-600">{formatPrice(order.pricing.total)}</span>
        </div>
      </div>

      {/* Advance Payment */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Advance Payment (Delivery Fee)</p>
            <p className="text-xs text-gray-500 mt-1">
              Method: <span className="font-semibold">{order.payment.advance.method}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{formatPrice(order.payment.advance.amount)}</p>
            <div className="mt-2">
              {getStatusBadge(order.payment.advance.status, 'advance')}
            </div>
          </div>
        </div>

        {/* Advance Payment Details */}
        <div className="space-y-2 text-sm">
          {order.payment.advance.transactionId && (
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-gray-900">{order.payment.advance.transactionId}</span>
            </div>
          )}
          {order.payment.advance.confirmedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Confirmed At:</span>
              <span className="text-gray-900">
                {new Date(order.payment.advance.confirmedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {order.payment.advance.rejectionReason && (
            <div className="flex justify-between">
              <span className="text-gray-600">Rejection Reason:</span>
              <span className="text-red-600 font-medium">{order.payment.advance.rejectionReason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Remaining Payment */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Remaining Payment (Products)</p>
            <p className="text-xs text-gray-500 mt-1">
              Method: <span className="font-semibold">{order.payment.remaining.method}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">{formatPrice(order.payment.remaining.amount)}</p>
            <div className="mt-2">
              {getStatusBadge(order.payment.remaining.status, 'remaining')}
            </div>
          </div>
        </div>

        {/* Remaining Payment Details */}
        <div className="space-y-2 text-sm">
          {order.payment.remaining.transactionId && (
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID:</span>
              <span className="font-mono text-gray-900">{order.payment.remaining.transactionId}</span>
            </div>
          )}
          {order.payment.remaining.paidAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Paid At:</span>
              <span className="text-gray-900">
                {new Date(order.payment.remaining.paidAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {order.payment.remaining.method === 'COD' && order.payment.remaining.status === 'Pending' && (
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs">
              💳 You will pay this amount when your order arrives
            </div>
          )}
        </div>
      </div>

      {/* Payment Status Legend */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-xs font-semibold text-gray-700 mb-2">Status Legend:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400"></span>
            <span className="text-gray-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-green-400"></span>
            <span className="text-gray-600">Confirmed/Paid</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-red-400"></span>
            <span className="text-gray-600">Rejected</span>
          </div>
        </div>
      </div>
    </div>
  );
}
