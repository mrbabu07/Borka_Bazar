import { Link, useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart";
import { toast } from "react-hot-toast";

export default function CartPremium() {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();

  const handleQuantityChange = (item, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantity(item._id, newQuantity, item.selectedSize, item.selectedColor);
  };

  const handleRemove = (item) => {
    removeFromCart(item._id, item.selectedSize, item.selectedColor);
    toast.success("Item removed from cart");
  };

  if (cartCount === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-4">
          <svg
            className="w-24 h-24 mx-auto mb-6 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h2 className="font-display text-2xl text-black mb-4">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-8">
            Discover our elegant collection of modest fashion
          </p>
          <Link
            to="/products"
            className="inline-block px-12 py-4 bg-black text-white text-sm tracking-widest uppercase font-medium hover:bg-gold-500 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page Header */}
      <div className="bg-gray-50 border-b border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl md:text-4xl text-black text-center">
            Shopping Cart
          </h1>
          <p className="text-gray-500 text-center mt-2">
            {cartCount} {cartCount === 1 ? "item" : "items"} in your cart
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item) => (
              <div
                key={`${item._id}_${item.selectedSize || 'no-size'}_${item.selectedColor?.name || 'no-color'}`}
                className="flex gap-6 pb-6 border-b border-gray-100 last:border-0"
              >
                {/* Product Image */}
                <Link
                  to={`/product/${item._id}`}
                  className="flex-shrink-0 w-24 h-32 md:w-32 md:h-40 overflow-hidden bg-gray-50"
                >
                  <img
                    src={item.selectedImage || item.image}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item._id}`}
                    className="font-display text-lg text-black hover:text-gold-500 transition-colors block mb-2"
                  >
                    {item.title}
                  </Link>

                  <div className="space-y-1 text-sm text-gray-600 mb-4">
                    {item.selectedSize && (
                      <p>
                        <span className="font-medium text-black">Size:</span> {item.selectedSize}
                      </p>
                    )}
                    {item.selectedColor && (
                      <p>
                        <span className="font-medium text-black">Color:</span>{" "}
                        {typeof item.selectedColor === 'string' ? item.selectedColor : item.selectedColor?.name}
                      </p>
                    )}
                    {item.fabric && (
                      <p>
                        <span className="font-medium text-black">Fabric:</span>{" "}
                        {item.fabric}
                      </p>
                    )}
                  </div>

                  <p className="text-xl font-semibold text-black mb-4">
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity - 1)}
                        className="w-8 h-8 border border-gray-300 hover:border-black transition-colors flex items-center justify-center"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 12H4"
                          />
                        </svg>
                      </button>
                      <span className="text-sm font-medium w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item, item.quantity + 1)}
                        className="w-8 h-8 border border-gray-300 hover:border-black transition-colors flex items-center justify-center"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item)}
                      className="text-sm text-gray-500 hover:text-red-600 transition-colors uppercase tracking-wide"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 mt-12 lg:mt-0">
            <div className="bg-gray-50 p-8 sticky top-24">
              <h2 className="font-display text-xl text-black mb-6">Order Summary</h2>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-black">
                    ৳{cartTotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-black">Calculated at checkout</span>
                </div>
              </div>

              <div className="flex justify-between text-lg mb-8">
                <span className="font-medium text-black">Total</span>
                <span className="font-display text-2xl font-semibold text-black">
                  ৳{cartTotal.toLocaleString()}
                </span>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full py-4 bg-black text-white text-sm tracking-widest uppercase font-medium hover:bg-gold-500 transition-colors mb-4"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/products"
                className="block text-center text-sm text-gray-600 hover:text-black transition-colors uppercase tracking-wide"
              >
                Continue Shopping
              </Link>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-gray-200 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Secure Checkout</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <span>Free Shipping Over ৳2000</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
