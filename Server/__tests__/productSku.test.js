const { ObjectId } = require("mongodb");
const Product = require("../models/Product");
const { searchProducts } = require("../controllers/productController");

function createProductModel() {
  return new Product({
    collection: () => ({
      createIndex: jest.fn(() => Promise.resolve()),
    }),
  });
}

function createResponse() {
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

describe("product SKU behavior", () => {
  test("generates professional SKU from product title and id", () => {
    const model = createProductModel();
    const id = new ObjectId("6655aabbccddeeff00112233");

    expect(model.generateSku({ title: "Premium Black Abaya" }, id)).toBe(
      "BB-PREM-BLAC-112233",
    );
  });

  test("normalizes manual SKU values", () => {
    const model = createProductModel();

    expect(model.generateSku({ sku: " bb premium 001 " })).toBe(
      "BB-PREMIUM-001",
    );
  });

  test("black-box search finds products by product SKU and variant SKU", async () => {
    const req = {
      query: { q: "VAR-42" },
      app: {
        locals: {
          models: {
            Product: {
              findAll: jest.fn(() =>
                Promise.resolve([
                  {
                    _id: "1",
                    title: "Plain Abaya",
                    sku: "BB-PLAI-000001",
                    variants: [],
                  },
                  {
                    _id: "2",
                    title: "Premium Abaya",
                    sku: "BB-PREM-000002",
                    variants: [{ sku: "VAR-42-BLK" }],
                  },
                ]),
              ),
            },
          },
        },
      },
    };
    const res = createResponse();

    await searchProducts(req, res);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]._id).toBe("2");
  });
});
