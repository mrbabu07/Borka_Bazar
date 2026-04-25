import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  getUserOrders,
  createReturnRequest,
  cancelOrder,
} from "../services/api";
import { createReview } from "../services/reviewApi";
import { uploadToImgBB } from "../services/imageUpload";
import { useCurrency } from "../hooks/useCurrency";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import PaymentBreakdown from "../components/PaymentBreakdown";
import PayRemainingForm from "../components/PayRemainingForm";
import { useNotifications } from "../context/NotificationContext";
import { useToast } from "../context/ToastContext";
import useCart from "../hooks/useCart";
import OrderTracking from "../components/OrderTracking";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const location = useLocation();
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { success, error } = useToast();
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnFormData, setReturnFormData] = useState({
    reason: "",
    description: "",
    refundMethod: "",
    refundAccountNumber: "",
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [reorderingItems, setReorderingItems] = useState({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await getUserOrders();
      setOrders(response.data.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatus = (order) => {
    const status = order.orderStatus || order.status || order.order?.status || 'pending';
    return status.toLowerCase();
  };

  const getPaymentStatus = (order) => {
    const status = order.paymentInfo?.status || order.paymentStatus || order.payment?.status || 'pending';
    return status.toLowerCase();
  };

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((order) => getOrderStatus(order) === filter);

  const handleReturnRequest = (order, product) => {
    setSelectedOrder(order);
    setSelectedProduct(product);
    setShowReturnModal(true);
  };

  const handleReviewRequest = (order, product) => {
    setSelectedOrder(order);
    setSelectedProduct(product);
    setShowReviewModal(true);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);

    try {
      const productId = selectedProduct.productId || selectedProduct._id;
      if (!productId || productId.length !== 24) {
        throw new Error("Invalid product ID. Please try again.");
      }

      await createReview({
        productId: productId,
        rating: reviewFormData.rating,
        comment: reviewFormData.comment.trim(),
      });

      setShowReviewModal(false);
      setReviewFormData({ rating: 5, comment: "" });
      success("Review submitted successfully!", {
        title: "Review Submitted",
      });
    } catch (err) {
      console.error("Review submission error:", err);
      let errorMessage = "Failed to submit review";
      if (err.response?.status === 403) {
        errorMessage = err.response?.data?.error || "You must purchase this product before you can review it";
      } else if (err.response?.status === 409) {
        errorMessage = "You have already reviewed this product";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      error(errorMessage, { title: "Review Failed" });
    } finally {
      setSubmittingReview(false);
    }
  };

  const closeReviewModal = () => {
    setShowReviewModal(false);
    setSelectedProduct(null);
    setSelectedOrder(null);
    setReviewFormData({ rating: 5, comment: "" });
  };

  const submitReturnRequest = async (e) => {
    e.preventDefault();
    setUploadingImages(true);

    try {
      let imageUrls = [];
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.map((file) => uploadToImgBB(file));
        imageUrls = await Promise.all(uploadPromises);
      }

      await createReturnRequest({
        orderId: selectedOrder._id,
        productId: selectedProduct.productId || selectedProduct._id,
        reason: returnFormData.reason,
        description: returnFormData.description,
        images: imageUrls,
        refundMethod: returnFormData.refundMethod,
        refundAccountNumber: returnFormData.refundAccountNumber,
      });

      setShowReturnModal(false);
      setReturnFormData({
        reason: "",
        description: "",
        refundMethod: "",
        refundAccountNumber: "",
      });
      setSelectedFiles([]);

      addNotification({
        type: "return",
        title: "Return Request Submitted",
        message: "Your return request has been submitted and is under review by our team.",
        link: "/returns",
      });

      success("Return request submitted successfully!", {
        title: "Return Request Submitted",
      });

      navigate("/returns");
    } catch (err) {
      error(err.response?.data?.error || "Failed to submit return request", {
        title: "Return Request Failed",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const closeReturnModal = () => {
    setShowReturnModal(false);
    setSelectedProduct(null);
    setSelectedOrder(null);
    setReturnFormData({
      reason: "",
      description: "",
      refundMethod: "",
      refundAccountNumber: "",
    });
    setSelectedFiles([]);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const isReturnEligible = (order) => {
    if (getOrderStatus(order) !== "delivered") return false;
    const deliveryDate = new Date(order.updatedAt || order.createdAt);
    const daysSinceDelivery = (new Date() - deliveryDate) / (1000 * 60 * 60 * 24);
    return daysSinceDelivery <= 7;
  };

  const handleQuickReorder = async (item, orderId) => {
    const itemKey = `${orderId}-${item.productId || item._id}`;
    setReorderingItems((prev) => ({ ...prev, [itemKey]: true }));

    try {
      await addToCart(
        {
          _id: item.productId || item._id,
          title: item.title,
          price: item.price,
          image: item.image,
          stock: 999,
        },
        item.quantity,
        item.image,
        item.selectedSize,
        item.selectedColor,
      );

      success(`${item.title} added to cart!`, {
        title: "Quick Reorder Successful",
      });
    } catch (err) {
      error("Failed to add item to cart. Please try again.", {
        title: "Reorder Failed",
      });
    } finally {
      setReorderingItems((prev) => ({ ...prev, [itemKey]: false }));
    }
  };

  const handleReorderEntireOrder = async (order) => {
    setReorderingItems((prev) => ({ ...prev, [order._id]: true }));

    try {
      let successCount = 0;
      const items = order.orderItems || order.products || [];
      for (const item of items) {
        try {
          await addToCart(
            {
              _id: item.productId || item._id,
              title: item.title,
              price: item.price,
              image: item.image,
              stock: 999,
            },
            item.quantity,
            item.image,
            item.size || item.selectedSize,
            item.color || item.selectedColor,
          );
          successCount++;
        } catch (itemError) {
          console.error(`Failed to add ${item.title} to cart:`, itemError);
        }
      }

      if (successCount === items.length) {
        success(`All ${successCount} items added to cart!`, {
          title: "Order Reordered Successfully",
        });
        navigate("/checkout");
      } else if (successCount > 0) {
        success(`${successCount} of ${items.length} items added to cart`, {
          title: "Partial Reorder Successful",
        });
        navigate("/checkout");
      } else {
        error("Failed to add any items to cart", {
          title: "Reorder Failed",
        });
      }
    } catch (err) {
      error("Failed to reorder items. Please try again.", {
        title: "Reorder Failed",
      });
    } finally {
      setReorderingItems((prev) => ({ ...prev, [order._id]: false }));
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      await cancelOrder(orderId);
      success("Order cancelled successfully", {
        title: "Order Cancelled",
      });
      fetchOrders();
    } catch (err) {
      error(err.response?.data?.error || "Failed to cancel order", {
        title: "Cancellation Failed",
      });
    }
  };

  const canCancelOrder = (order) => {
    if (getOrderStatus(order) !== "pending") return false;
    const createdAt = new Date(order.createdAt);
    const canCancelUntil = order.canCancelUntil
      ? new Date(order.canCancelUntil)
      : new Date(createdAt.getTime() + 30 * 60 * 1000);
    const now = new Date();
    return now < canCancelUntil;
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold text-gray-900">My Purchases</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-4">
        {/* Filter Tabs */}
        <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto">
          {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`pb-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                filter === status
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 mb-4">No purchases found</p>
            <Link to="/" className="text-primary-600 font-medium hover:text-primary-700">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredOrders.map((order) => (
              <div key={order._id} className="border border-gray-200 hover:border-gray-300 transition-colors">
                {/* Order Row */}
                <div className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm text-gray-600">Order #{order._id.slice(-8).toUpperCase()}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium truncate">
                      {(order.orderItems || order.products || [])[0]?.title || "Order"}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {(order.orderItems || order.products || []).length} item{(order.orderItems || order.products || []).length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{formatPrice(order.pricing?.total || order.totalPrice)}</p>
                    <p className="text-xs text-gray-600 mt-1">{getOrderStatus(order).charAt(0).toUpperCase() + getOrderStatus(order).slice(1)}</p>
                  </div>

                  <Link
                    to={`/order/${order._id}`}
                    className="text-primary-600 text-sm font-medium hover:text-primary-700 flex-shrink-0"
                  >
                    View
                  </Link>
                </div>

                {/* Action Buttons */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleReorderEntireOrder(order)}
                    disabled={reorderingItems[order._id]}
                    className="text-xs font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
                  >
                    {reorderingItems[order._id] ? "Adding..." : "Reorder"}
                  </button>

                  {isReturnEligible(order) && (
                    <button
                      onClick={() => {
                        const firstItem = (order.orderItems || order.products || [])[0];
                        if (firstItem) handleReturnRequest(order, firstItem);
                      }}
                      className="text-xs font-medium text-gray-700 hover:text-gray-900"
                    >
                      Return
                    </button>
                  )}

                  {getOrderStatus(order) === "delivered" && (
                    <button
                      onClick={() => {
                        const firstItem = (order.orderItems || order.products || [])[0];
                        if (firstItem) handleReviewRequest(order, firstItem);
                      }}
                      className="text-xs font-medium text-gray-700 hover:text-gray-900"
                    >
                      Review
                    </button>
                  )}

                  {canCancelOrder(order) && (
                    <button
                      onClick={() => handleCancelOrder(order._id)}
                      className="text-xs font-medium text-gray-700 hover:text-gray-900"
                    >
                      Cancel
                    </button>
                  )}

                  {order.payment && order.payment.remaining && order.payment.remaining.status === 'Pending' && order.payment.advance.status === 'Confirmed' && (
                    <button
                      onClick={() => {
                        setSelectedOrderForPayment(order);
                        setShowPaymentModal(true);
                      }}
                      className="text-xs font-medium text-gray-700 hover:text-gray-900"
                    >
                      Pay Remaining
                    </button>
                  )}
                </div>

                {/* Payment Breakdown */}
                {order.payment && order.payment.advance && (
                  <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                    <PaymentBreakdown order={order} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return Modal */}
      <Modal isOpen={showReturnModal} onClose={closeReturnModal} title="Request Return">
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm font-medium text-gray-900 mb-2">{selectedProduct.title}</p>
              <p className="text-xs text-gray-600">Qty: {selectedProduct.quantity} • {formatPrice(selectedProduct.price)}</p>
            </div>

            <form onSubmit={submitReturnRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Reason *</label>
                <select
                  value={returnFormData.reason}
                  onChange={(e) => setReturnFormData({ ...returnFormData, reason: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  <option value="">Select a reason</option>
                  <option value="Defective Product">Defective Product</option>
                  <option value="Wrong Item Received">Wrong Item Received</option>
                  <option value="Size/Fit Issues">Size/Fit Issues</option>
                  <option value="Not as Described">Not as Described</option>
                  <option value="Damaged in Shipping">Damaged in Shipping</option>
                  <option value="Changed Mind">Changed Mind</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={returnFormData.description}
                  onChange={(e) => setReturnFormData({ ...returnFormData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                  placeholder="Provide details..."
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Refund Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Refund Method *</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["bkash", "nagad", "rocket", "upay"].map((method) => (
                        <label key={method} className={`flex items-center p-2 border rounded cursor-pointer text-sm ${
                          returnFormData.refundMethod === method ? "border-primary-500 bg-primary-50" : "border-gray-200"
                        }`}>
                          <input
                            type="radio"
                            name="refundMethod"
                            value={method}
                            checked={returnFormData.refundMethod === method}
                            onChange={(e) => setReturnFormData({ ...returnFormData, refundMethod: e.target.value })}
                            required
                            className="w-4 h-4"
                          />
                          <span className="ml-2 capitalize">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                    <input
                      type="tel"
                      value={returnFormData.refundAccountNumber}
                      onChange={(e) => setReturnFormData({ ...returnFormData, refundAccountNumber: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="01521721946"
                      pattern="[0-9]{11}"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={uploadingImages}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {uploadingImages ? "Uploading..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={closeReturnModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded text-sm font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={closeReviewModal} title="Write a Review">
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm font-medium text-gray-900">{selectedProduct.title}</p>
              <p className="text-xs text-gray-600 mt-1">{formatPrice(selectedProduct.price)}</p>
            </div>

            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewFormData({ ...reviewFormData, rating: star })}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`w-8 h-8 ${star <= reviewFormData.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Review *</label>
                <textarea
                  value={reviewFormData.comment}
                  onChange={(e) => setReviewFormData({ ...reviewFormData, comment: e.target.value })}
                  rows="4"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                  placeholder="Share your experience..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
                >
                  {submittingReview ? "Submitting..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded text-sm font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedOrderForPayment(null);
        }}
        title="Pay Remaining Amount"
      >
        {selectedOrderForPayment && (
          <PayRemainingForm
            order={selectedOrderForPayment}
            onPaymentSubmitted={(data) => {
              setShowPaymentModal(false);
              setSelectedOrderForPayment(null);
              fetchOrders();
              success('Payment submitted successfully!', {
                title: 'Payment Submitted',
              });
            }}
          />
        )}
      </Modal>
    </div>
  );
}
