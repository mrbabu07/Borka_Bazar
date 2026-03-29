import { useState, useEffect } from "react";

export default function OrderTracking({ order }) {
  const [trackingSteps, setTrackingSteps] = useState([]);

  useEffect(() => {
    if (order) {
      generateTrackingSteps();
    }
  }, [order]);

  const generateTrackingSteps = () => {
    const steps = [
      {
        id: 1,
        title: "Order Placed",
        description: "Your order has been received",
        status: "completed",
        date: order.createdAt,
        icon: "check",
      },
      {
        id: 2,
        title: "Order Confirmed",
        description: "Your order has been confirmed",
        status: order.status === "pending" ? "current" : "completed",
        date: order.status !== "pending" ? order.updatedAt : null,
        icon: "clipboard",
      },
      {
        id: 3,
        title: "Processing",
        description: "Your order is being prepared",
        status:
          order.status === "processing"
            ? "current"
            : order.status === "pending"
              ? "pending"
              : "completed",
        date: order.status === "processing" || order.status === "shipped" || order.status === "delivered" ? order.updatedAt : null,
        icon: "package",
      },
      {
        id: 4,
        title: "Shipped",
        description: "Your order is on the way",
        status:
          order.status === "shipped"
            ? "current"
            : order.status === "delivered"
              ? "completed"
              : "pending",
        date: order.status === "shipped" || order.status === "delivered" ? order.updatedAt : null,
        icon: "truck",
      },
      {
        id: 5,
        title: "Delivered",
        description: "Your order has been delivered",
        status: order.status === "delivered" ? "completed" : "pending",
        date: order.status === "delivered" ? order.updatedAt : null,
        icon: "home",
      },
    ];

    // Handle cancelled orders
    if (order.status === "cancelled") {
      steps.forEach((step) => {
        if (step.status === "pending") {
          step.status = "cancelled";
        }
      });
      steps.push({
        id: 6,
        title: "Cancelled",
        description: "Your order has been cancelled",
        status: "cancelled",
        date: order.updatedAt,
        icon: "x",
      });
    }

    setTrackingSteps(steps);
  };

  const getIcon = (iconName) => {
    const icons = {
      check: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      clipboard: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      package: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      truck: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      ),
      home: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      x: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    };
    return icons[iconName] || icons.check;
  };

  const getStepColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white border-green-500";
      case "current":
        return "bg-black text-white border-black animate-pulse";
      case "cancelled":
        return "bg-red-500 text-white border-red-500";
      default:
        return "bg-gray-200 text-gray-400 border-gray-300";
    }
  };

  const getLineColor = (currentStatus, nextStatus) => {
    if (currentStatus === "completed" && (nextStatus === "completed" || nextStatus === "current")) {
      return "bg-green-500";
    }
    return "bg-gray-300";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-display text-xl text-black mb-6">Order Tracking</h3>

      {/* Tracking Timeline */}
      <div className="relative">
        {trackingSteps.map((step, index) => (
          <div key={step.id} className="relative pb-8 last:pb-0">
            {/* Connecting Line */}
            {index < trackingSteps.length - 1 && (
              <div
                className={`absolute left-5 top-12 w-0.5 h-full -ml-px ${getLineColor(step.status, trackingSteps[index + 1]?.status)}`}
              ></div>
            )}

            {/* Step Content */}
            <div className="relative flex items-start gap-4">
              {/* Icon */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getStepColor(step.status)}`}
              >
                {getIcon(step.icon)}
              </div>

              {/* Details */}
              <div className="flex-1 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-black">{step.title}</h4>
                  {step.date && (
                    <span className="text-xs text-gray-500">
                      {new Date(step.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>

                {/* Additional Info for Current Step */}
                {step.status === "current" && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-700">
                      {step.id === 2 && "We're confirming your order details and payment."}
                      {step.id === 3 && "Your order is being carefully prepared for shipment."}
                      {step.id === 4 && "Your order is on its way to you!"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Estimated Delivery */}
      {order.status !== "delivered" && order.status !== "cancelled" && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700">
              <span className="font-medium">Estimated Delivery:</span>{" "}
              {new Date(new Date(order.createdAt).getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      )}

      {/* Delivery Address */}
      {order.shippingAddress && (
        <div className="mt-6 p-4 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-black mb-2 text-sm">Delivery Address</h4>
          <p className="text-sm text-gray-700">
            {order.shippingAddress.name}<br />
            {order.shippingAddress.address}<br />
            {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
            {order.shippingAddress.phone}
          </p>
        </div>
      )}
    </div>
  );
}
