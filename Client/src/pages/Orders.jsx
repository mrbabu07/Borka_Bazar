import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import PageHeader from "../components/PageHeader";
import Button from "../components/Button";
import Input, { Select, Textarea } from "../components/Input";
import Badge, { StatusBadge } from "../components/Badge";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

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

  const getDeliveryFee = (order) => {
    const fee = order.pricing?.deliveryFee || order.deliveryCharge || order.deliveryFee || order.shipping?.fee || order.shippingFee;
    if (!fee || fee === 0) return "FREE";
    return formatPrice(fee);
  };

  const getCODRemainingAmount = (order) => {
    // Calculate remaining amount to be paid on delivery
    // Total = Product Price + Delivery Fee
    // Paid = Delivery Fee (paid upfront)
    // Remaining = Product Price (to be paid on delivery)
    const total = order.pricing?.total || order.totalPrice || 0;
    const deliveryFee = order.pricing?.deliveryFee || order.deliveryCharge || order.deliveryFee || order.shipping?.fee || order.shippingFee || 0;
    const remaining = total - deliveryFee;
    return remaining > 0 ? remaining : 0;
  };

  const isPaymentPending = (order) => {
    // Check if order is waiting for delivery fee payment
    return order.paymentStatus === 'pending' || order.payment?.status === 'pending' || order.paymentInfo?.status === 'pending';
  };

  const isCODOrder = (order) => {
    // Check if this is a Cash on Delivery order
    return order.paymentMethod === 'COD' || order.payment?.method === 'COD' || order.paymentInfo?.method === 'COD';
  };

  const getAdvancePaymentInfo = (order) => {
    // Get advance payment details from new or legacy structure
    return order.advancePayment || order.payment?.advance || null;
  };

  const isAdvancePaymentPending = (order) => {
    const advancePayment = getAdvancePaymentInfo(order);
    return advancePayment?.status === 'Pending';
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
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Premium page header (project style) */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-gold-500 text-sm tracking-[0.3em] uppercase mb-3">
            Account
          </p>
          <h1 className="font-display text-3xl md:text-4xl text-black dark:text-white mb-3">
            My Orders
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
            Track your purchases, reorder items, request returns, and manage payments.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Keep PageHeader for spacing consistency (hidden visually) */}
        <PageHeader title="" subtitle="" showBack={false} className="hidden" />

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto">
            <div className="flex gap-0 min-w-max">
              {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map(
                (status) => {
                  const active = filter === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`px-4 sm:px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                        active
                          ? "text-black dark:text-white border-gold-500"
                          : "text-gray-600 dark:text-gray-300 border-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                      type="button"
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg
                className="w-7 h-7 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-2">No orders found</p>
            <p className="text-sm text-gray-500 mb-6">
              When you place an order, it will appear here with tracking and payment details.
            </p>
            <Link to="/" className="inline-block">
              <button className="px-10 py-4 bg-black text-white text-sm tracking-widest uppercase font-medium hover:bg-gold-500 transition-colors">
                Continue shopping
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {filteredOrders.map((order) => {
              const status = getOrderStatus(order);
              const paymentStatus = getPaymentStatus(order);
              const items = order.orderItems || order.products || [];
              const firstItem = items[0];
              const orderShortId = order._id?.slice(-8)?.toUpperCase?.() || "ORDER";
              const createdAt = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })
                : "";
              const firstItemImage =
                firstItem?.image ||
                firstItem?.selectedImage ||
                order?.shippingInfo?.image ||
                "https://images.unsplash.com/photo-1520975958225-2cc4f8915c84?w=200&auto=format&fit=crop";

              return (
                <div
                  key={order._id}
                  onClick={() => {
                    setDetailOrder(order);
                    setShowDetailModal(true);
                  }}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {/* Card Header */}
                  <div className="bg-gray-50 dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs tracking-widest uppercase text-gray-500 dark:text-gray-400">
                          Order #{orderShortId}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {createdAt || "—"}
                        </p>
                      </div>
                      <StatusBadge status={status} />
                    </div>
                  </div>

                  {/* Product Preview */}
                  <div className="p-4">
                    <div className="w-full h-40 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden mb-3">
                      <img
                        src={firstItemImage}
                        alt={firstItem?.title || "Order item"}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                      {firstItem?.title || "Order"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  {/* Pricing */}
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Total:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {formatPrice(order.pricing?.total || order.totalPrice)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-gray-400">Delivery:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {getDeliveryFee(order)}
                        </span>
                      </div>
                      {isCODOrder(order) && getCODRemainingAmount(order) > 0 && (
                        <div className="flex justify-between items-center text-xs pt-2 border-t border-gray-300 dark:border-gray-700">
                          <span className="text-orange-600 dark:text-orange-400 font-semibold">Pay on Delivery:</span>
                          <span className="font-bold text-orange-600 dark:text-orange-400">
                            {formatPrice(getCODRemainingAmount(order))}
                          </span>
                        </div>
                      )}
                      {isAdvancePaymentPending(order) && (
                        <div className="flex justify-between items-center text-xs pt-2 border-t border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 -mx-4 -mb-3 px-4 py-2 rounded-b">
                          <span className="text-yellow-700 dark:text-yellow-300 font-semibold">⏳ Advance Payment:</span>
                          <span className="font-bold text-yellow-700 dark:text-yellow-300">
                            {formatPrice(getAdvancePaymentInfo(order)?.amount || 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                    <button
                      type="button"
                      className="w-full px-4 py-2 bg-black text-white text-xs tracking-widest uppercase font-medium hover:bg-gold-500 transition-colors rounded"
                    >
                      View details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Return Modal */}
      <Modal isOpen={showReturnModal} onClose={closeReturnModal} title="Request Return">
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-900 mb-1">{selectedProduct.title}</p>
              <p className="text-xs text-gray-600">
                Qty: {selectedProduct.quantity} • {formatPrice(selectedProduct.price)}
              </p>
            </div>

            <form onSubmit={submitReturnRequest} className="space-y-4">
              <Select
                label="Return reason"
                required
                value={returnFormData.reason}
                onChange={(e) =>
                  setReturnFormData({ ...returnFormData, reason: e.target.value })
                }
                options={[
                  { value: "Defective Product", label: "Defective product" },
                  { value: "Wrong Item Received", label: "Wrong item received" },
                  { value: "Size/Fit Issues", label: "Size / fit issues" },
                  { value: "Not as Described", label: "Not as described" },
                  { value: "Damaged in Shipping", label: "Damaged in shipping" },
                  { value: "Changed Mind", label: "Changed mind" },
                  { value: "Other", label: "Other" },
                ]}
              />

              <Textarea
                label="Description"
                value={returnFormData.description}
                onChange={(e) =>
                  setReturnFormData({ ...returnFormData, description: e.target.value })
                }
                rows={3}
                placeholder="Provide details..."
              />

              {/* Return images (already supported by existing upload logic) */}
              <div className="border border-gray-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload images (optional)
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Up to 5 images. These help us verify the issue faster.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-800 file:font-semibold hover:file:bg-gray-200"
                />
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2"
                      >
                        <p className="text-xs text-gray-700 truncate">{file.name}</p>
                        <button
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="text-xs font-semibold text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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

                  <Input
                    label="Account number"
                    required
                    type="tel"
                    value={returnFormData.refundAccountNumber}
                    onChange={(e) =>
                      setReturnFormData({
                        ...returnFormData,
                        refundAccountNumber: e.target.value,
                      })
                    }
                    placeholder="01521721946"
                    pattern="[0-9]{11}"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" loading={uploadingImages} fullWidth>
                  Submit request
                </Button>
                <Button type="button" variant="outline" onClick={closeReturnModal} fullWidth>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={closeReviewModal} title="Write a Review">
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-900">{selectedProduct.title}</p>
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

              <Textarea
                label="Your review"
                required
                value={reviewFormData.comment}
                onChange={(e) =>
                  setReviewFormData({ ...reviewFormData, comment: e.target.value })
                }
                rows={4}
                placeholder="Share your experience..."
              />

              <div className="flex gap-2 pt-4">
                <Button type="submit" loading={submittingReview} fullWidth>
                  Submit review
                </Button>
                <Button type="button" variant="outline" onClick={closeReviewModal} fullWidth>
                  Cancel
                </Button>
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

      {/* Detail Modal */}
      {detailOrder && (
        <Modal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setDetailOrder(null);
          }}
          title={`Order #${detailOrder._id?.slice(-8)?.toUpperCase?.() || "ORDER"}`}
        >
          {(() => {
            const status = getOrderStatus(detailOrder);
            const items = detailOrder.orderItems || detailOrder.products || [];
            return (
              <div className="space-y-4">
                {/* Status & Date */}
                <div className="flex justify-between items-start pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Status</p>
                    <StatusBadge status={status} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-1">Placed On</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(detailOrder.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Payment Status Alert */}
                {isPaymentPending(detailOrder) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-yellow-800 mb-1">⏳ Awaiting Delivery Fee Payment</p>
                    <p className="text-xs text-yellow-700">
                      Please complete the delivery fee payment to confirm your order. Admin will verify and confirm your order after payment.
                    </p>
                  </div>
                )}

                {/* Advance Payment Info */}
                {getAdvancePaymentInfo(detailOrder) && (
                  <div className={`border rounded-lg p-4 ${isAdvancePaymentPending(detailOrder) ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className={`text-sm font-bold ${isAdvancePaymentPending(detailOrder) ? 'text-yellow-800' : 'text-green-800'}`}>
                          💳 Advance Payment (Delivery Fee)
                        </p>
                        <p className={`text-xs mt-1 ${isAdvancePaymentPending(detailOrder) ? 'text-yellow-700' : 'text-green-700'}`}>
                          Method: <span className="font-semibold">{getAdvancePaymentInfo(detailOrder)?.method || 'bKash'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${isAdvancePaymentPending(detailOrder) ? 'text-yellow-800' : 'text-green-800'}`}>
                          {formatPrice(getAdvancePaymentInfo(detailOrder)?.amount || 0)}
                        </p>
                        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded mt-1 ${
                          isAdvancePaymentPending(detailOrder) 
                            ? 'bg-yellow-200 text-yellow-800' 
                            : 'bg-green-200 text-green-800'
                        }`}>
                          {getAdvancePaymentInfo(detailOrder)?.status || 'Pending'}
                        </span>
                      </div>
                    </div>
                    {getAdvancePaymentInfo(detailOrder)?.transactionId && (
                      <p className={`text-xs ${isAdvancePaymentPending(detailOrder) ? 'text-yellow-700' : 'text-green-700'}`}>
                        Transaction ID: <span className="font-mono font-semibold">{getAdvancePaymentInfo(detailOrder).transactionId}</span>
                      </p>
                    )}
                    {getAdvancePaymentInfo(detailOrder)?.confirmedAt && (
                      <p className={`text-xs mt-2 ${isAdvancePaymentPending(detailOrder) ? 'text-yellow-700' : 'text-green-700'}`}>
                        ✓ Confirmed on {new Date(getAdvancePaymentInfo(detailOrder).confirmedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* COD Alert */}
                {isCODOrder(detailOrder) && !isPaymentPending(detailOrder) && getCODRemainingAmount(detailOrder) > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-orange-800 mb-1">💰 Cash on Delivery</p>
                    <p className="text-xs text-orange-700">
                      You will pay <strong>{formatPrice(getCODRemainingAmount(detailOrder))}</strong> when you receive the product.
                    </p>
                  </div>
                )}

                {/* Items */}
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-3 font-semibold">Order Items ({items.length})</p>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                          <p className="text-xs text-gray-600 mt-1">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {formatPrice((item.price || 0) * (item.quantity || 0))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 uppercase tracking-wide mb-3 font-semibold">Pricing</p>
                  <div className="space-y-2">
                    {!detailOrder.payment && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">
                          {formatPrice(detailOrder.pricing?.subtotal || detailOrder.subtotal || 0)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivery Fee</span>
                      <span className="font-medium text-gray-900">{getDeliveryFee(detailOrder)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-gray-300">
                      <span className="font-semibold text-gray-900">Order Total</span>
                      <span className="text-lg font-bold text-primary-600">
                        {formatPrice(detailOrder.pricing?.total || detailOrder.totalPrice)}
                      </span>
                    </div>
                    {isCODOrder(detailOrder) && getCODRemainingAmount(detailOrder) > 0 && (
                      <div className="flex justify-between text-sm pt-3 border-t border-orange-300 bg-orange-50 -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                        <span className="font-bold text-orange-700">💰 Pay on Delivery</span>
                        <span className="text-lg font-bold text-orange-600">
                          {formatPrice(getCODRemainingAmount(detailOrder))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Breakdown */}
                {detailOrder.payment?.advance && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <PaymentBreakdown order={detailOrder} />
                  </div>
                )}

                {/* Tracking */}
                {detailOrder.tracking && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 uppercase tracking-wide mb-3 font-semibold">Tracking</p>
                    <OrderTracking order={detailOrder} />
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-200">
                  {detailOrder.payment?.remaining?.status === "Pending" &&
                    detailOrder.payment?.advance?.status === "Confirmed" && (
                      <Button
                        onClick={() => {
                          setSelectedOrderForPayment(detailOrder);
                          setShowPaymentModal(true);
                          setShowDetailModal(false);
                        }}
                        fullWidth
                      >
                        Pay Remaining ({formatPrice(detailOrder.payment.remaining.amount)})
                      </Button>
                    )}
                  {canCancelOrder(detailOrder) && (
                    <Button
                      onClick={() => {
                        handleCancelOrder(detailOrder._id);
                        setShowDetailModal(false);
                      }}
                      variant="danger"
                      fullWidth
                    >
                      Cancel Order
                    </Button>
                  )}
                  <Button
                    onClick={() => handleReorderEntireOrder(detailOrder)}
                    disabled={reorderingItems[detailOrder._id]}
                    fullWidth
                  >
                    {reorderingItems[detailOrder._id] ? "Adding to Cart..." : "Reorder All Items"}
                  </Button>
                </div>
              </div>
            );
          })()}
        </Modal>
      )}
    </div>
  );
}
