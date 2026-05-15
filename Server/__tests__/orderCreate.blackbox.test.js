jest.mock("../controllers/notificationController", () => ({
  createRealtimeNotification: jest.fn(() => Promise.resolve()),
}));

const { createOrder } = require("../controllers/orderController");

function createMockResponse() {
  const res = {
    statusCode: 200,
    body: null,
    status: jest.fn((code) => {
      res.statusCode = code;
      return res;
    }),
    json: jest.fn((payload) => {
      res.body = payload;
      return res;
    }),
  };

  return res;
}

function createMockRequest({ body = {}, deliverySettings = {}, orderOverrides = {} } = {}) {
  const Order = {
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn((orderData) =>
      Promise.resolve({
        ...orderData,
        _id: "order-123",
        ...orderOverrides,
      }),
    ),
  };

  return {
    body,
    app: {
      locals: {
        models: {
          Order,
          DeliverySettings: {
            getSettings: jest.fn(() =>
              Promise.resolve({
                standardDeliveryCharge: 100,
                deliveryAreas: [],
                ...deliverySettings,
              }),
            ),
          },
        },
      },
    },
  };
}

const validBody = {
  orderItems: [{ productId: "product-1", title: "Abaya", price: 1000, quantity: 2 }],
  shippingInfo: {
    name: "Test Customer",
    phone: "01712345678",
    email: "test@example.com",
    address: "House 1",
    area: "Dhaka",
  },
  subtotal: 2000,
  total: 2100,
  totalPrice: 2100,
  deliveryCharge: 100,
  paymentMethod: "bKash",
  transactionId: "TXN-1001",
  senderNumber: "01712345678",
  receiverNumber: "01878305319",
};

describe("order creation black-box behavior", () => {
  let logSpy;
  let errorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test("rejects COD when a delivery fee is required", async () => {
    const req = createMockRequest({
      body: {
        ...validBody,
        paymentMethod: "COD",
        transactionId: "",
        senderNumber: "",
      },
    });
    const res = createMockResponse();

    await createOrder(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("pay the delivery fee");
    expect(req.app.locals.models.Order.create).not.toHaveBeenCalled();
  });

  test("rejects mobile payment orders without transaction details", async () => {
    const req = createMockRequest({
      body: {
        ...validBody,
        transactionId: "",
      },
    });
    const res = createMockResponse();

    await createOrder(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("Transaction ID");
    expect(res.body.details.hasTransactionId).toBe(false);
    expect(req.app.locals.models.Order.create).not.toHaveBeenCalled();
  });

  test("creates a pending order when delivery fee payment is submitted", async () => {
    const req = createMockRequest({ body: validBody });
    const res = createMockResponse();

    await createOrder(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.deliveryCharge).toBe(100);
    expect(res.body.data.deliveryPaymentStatus).toBe("pending");
    expect(res.body.data.paymentInfo.method).toBe("bKash");
    expect(res.body.data.payment.remaining.method).toBe("COD");
    expect(res.body.data.payment.remaining.amount).toBe(2000);
  });

  test("uses enabled area delivery charge", async () => {
    const req = createMockRequest({
      body: {
        ...validBody,
        shippingInfo: {
          ...validBody.shippingInfo,
          area: "Savar",
        },
      },
      deliverySettings: {
        standardDeliveryCharge: 100,
        deliveryAreas: [{ name: "savar", charge: 150, enabled: true }],
      },
    });
    const res = createMockResponse();

    await createOrder(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body.data.deliveryCharge).toBe(150);
    expect(res.body.data.totalPrice).toBe(2150);
  });
});
