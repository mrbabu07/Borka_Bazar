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
    <div className="min-h-screen bg-[#EAEDED]">
      {/* Amazon-like header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
                Your Orders
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View, track, reorder, return items, and manage payments.
              </p>
            </div>
            <Link to="/" className="hidden sm:inline-flex">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Continue shopping
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Keep PageHeader for spacing consistency (hidden visually) */}
        <PageHeader title="" subtitle="" showBack={false} className="hidden" />

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
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
                          ? "text-[#007185] border-[#007185]"
                          : "text-gray-700 border-transparent hover:bg-gray-50"
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

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
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
              <button className="px-6 py-3 rounded-lg bg-[#FFD814] border border-[#FCD200] text-gray-900 font-semibold hover:bg-[#F7CA00] transition-colors">
                Continue shopping
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
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
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-soft transition-shadow"
                >
                  {/* Amazon-like order summary bar */}
                  <div className="bg-[#F3F3F3] border-b border-gray-200 px-4 sm:px-6 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                      <div className="sm:col-span-3">
                        <p className="text-[11px] font-bold text-gray-600 uppercase">
                          Order placed
                        </p>
                        <p className="text-sm text-gray-900">{createdAt || "—"}</p>
                      </div>
                      <div className="sm:col-span-3">
                        <p className="text-[11px] font-bold text-gray-600 uppercase">
                          Total
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatPrice(order.pricing?.total || order.totalPrice)}
                        </p>
                      </div>
                      <div className="sm:col-span-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-gray-600 uppercase">
                              Order #
                            </p>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {orderShortId}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                            <StatusBadge status={status} />
                            {paymentStatus && paymentStatus !== "pending" && (
                              <Badge
                                variant={paymentStatus === "paid" ? "success" : "info"}
                                size="sm"
                              >
                                {paymentStatus === "paid"
                                  ? "Paid"
                                  : `Payment: ${paymentStatus}`}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order item preview */}
                  <div className="p-4 sm:p-5">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                        <img
                          src={firstItemImage}
                          alt={firstItem?.title || "Order item"}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                          {firstItem?.title || "Order"}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                          <span>
                            {items.length} item{items.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="font-semibold text-gray-900">
                            Total {formatPrice(order.pricing?.total || order.totalPrice)}
                          </span>
                        </div>

                        {/* Per-item quick reorder (uses existing handler/state) */}
                        {items.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {items.slice(0, 2).map((item) => {
                              const itemKey = `${order._id}-${item.productId || item._id}`;
                              return (
                                <button
                                  key={itemKey}
                                  type="button"
                                  onClick={() => handleQuickReorder(item, order._id)}
                                  disabled={reorderingItems[itemKey]}
                                  className="px-4 py-2 rounded-lg bg-[#FFD814] border border-[#FCD200] text-xs font-semibold text-gray-900 hover:bg-[#F7CA00] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                                  title={`Buy again: ${item.title}`}
                                >
                                  {reorderingItems[itemKey] ? "Adding..." : "Buy it again"}
                                </button>
                              );
                            })}
                            {items.length > 2 && (
                              <span className="text-xs text-gray-500 self-center">
                                +{items.length - 2} more items
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tracking (if any) */}
                  {order.tracking && (
                    <div className="px-4 sm:px-5 pb-4 -mt-2">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <OrderTracking order={order} />
                      </div>
                    </div>
                  )}

                  {/* Actions (Amazon-like) */}
                  <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/order/${order._id}`} className="inline-flex">
                        <button
                          type="button"
                          className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                          View order details
                        </button>
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleReorderEntireOrder(order)}
                        disabled={reorderingItems[order._id]}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                      >
                        {reorderingItems[order._id] ? "Adding..." : "Buy all again"}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                    {isReturnEligible(order) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (firstItem) handleReturnRequest(order, firstItem);
                        }}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Return items
                      </button>
                    )}

                    {status === "delivered" && (
                      <button
                        type="button"
                        onClick={() => {
                          if (firstItem) handleReviewRequest(order, firstItem);
                        }}
                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Write a product review
                      </button>
                    )}

                    {canCancelOrder(order) && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order._id)}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                      >
                        Cancel order
                      </button>
                    )}

                    {order.payment &&
                      order.payment.remaining &&
                      order.payment.remaining.status === "Pending" &&
                      order.payment.advance.status === "Confirmed" && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedOrderForPayment(order);
                            setShowPaymentModal(true);
                          }}
                          className="px-4 py-2 rounded-lg bg-[#007185] text-white text-sm font-semibold hover:bg-[#005f6b] transition-colors"
                        >
                          Pay remaining
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Payment Breakdown */}
                  {order.payment && order.payment.advance && (
                    <div className="px-4 sm:px-5 py-4 border-t border-gray-200 bg-white">
                      <PaymentBreakdown order={order} />
                    </div>
                  )}
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
    </div>
  );
}
