import { buildApiUrl, getArrayData, getObjectData } from "./apiConfig";

describe("apiConfig", () => {
  it("builds stable API URLs from relative paths", () => {
    expect(buildApiUrl()).toBe("/api");
    expect(buildApiUrl("products")).toBe("/api/products");
    expect(buildApiUrl("/products/123/view")).toBe("/api/products/123/view");
  });

  it("normalizes array payloads safely", () => {
    expect(getArrayData({ data: { data: [1, 2, 3] } })).toEqual([1, 2, 3]);
    expect(getArrayData({ data: { data: null } })).toEqual([]);
    expect(getArrayData({ data: { data: { id: 1 } } })).toEqual([]);
    expect(getArrayData(null)).toEqual([]);
  });

  it("normalizes object payloads safely", () => {
    expect(getObjectData({ data: { data: { id: 1 } } })).toEqual({ id: 1 });
    expect(getObjectData({ data: { data: [1] } })).toBeNull();
    expect(getObjectData({ data: { data: null } })).toBeNull();
    expect(getObjectData(undefined)).toBeNull();
  });
});
