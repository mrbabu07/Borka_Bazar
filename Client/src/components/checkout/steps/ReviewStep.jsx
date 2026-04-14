export default function ReviewStep({ cart, address, subtotal, deliveryFee, total, formatPrice }) {
  return (
    <div className="space-y-6">
      {/* Products */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Items</h2>
        <div className="space-y-4">
          {cart.map((item) => (
            <div key={item._id} className="flex gap-4 pb-4 border-b last:border-b-0">
              <img
                src={item.image}
                alt={item.title}
                className="w-20 h-20 object-cover rounded-lg bg-gray-100"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                {item.selectedSize && (
                  <p className="text-sm text-gray-600">Size: {item.selectedSize}</p>
                )}
                {item.selectedColor && (
                  <p className="text-sm text-gray-600">Color: {item.selectedColor.name}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatPrice(item.price)}</p>
                <p className="text-sm text-gray-600">×{item.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Address */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Address</h2>
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="font-semibold text-gray-900">{address.fullName}</p>
          <p className="text-gray-600">{address.phone}</p>
          <p className="text-gray-600">
            {address.street}, {address.area}, {address.city}
            {address.postalCode && `, ${address.postalCode}`}
          </p>
        </div>
      </div>

      {/* Price Breakdown */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Price Breakdown</h2>
        <div className="space-y-3">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Delivery Fee</span>
            <span>{formatPrice(deliveryFee)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-primary-600">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-900">
          ✓ Review your order carefully. You'll pay {formatPrice(deliveryFee)} now and {formatPrice(subtotal)} on delivery.
        </p>
      </div>
    </div>
  );
}
