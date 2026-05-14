import { render, waitFor } from "@testing-library/react";
import useProductView from "./useProductView";
import { auth } from "../firebase/firebase.config";

jest.mock("../firebase/firebase.config", () => ({
  auth: {
    currentUser: null,
  },
}));

function ProductViewProbe({ productId }) {
  useProductView(productId);
  return <div data-testid="probe">ready</div>;
}

describe("useProductView", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    auth.currentUser = null;
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("tracks a product view after the visibility delay", async () => {
    render(<ProductViewProbe productId="abc 123" />);

    expect(global.fetch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1000);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/products/abc%20123/view",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("adds an auth header when a Firebase user is present", async () => {
    auth.currentUser = {
      getIdToken: jest.fn().mockResolvedValue("token-123"),
    };

    render(<ProductViewProbe productId="product-id" />);
    jest.advanceTimersByTime(1000);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/products/product-id/view",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token-123",
        },
      }),
    );
  });

  it("does not retry the same product after a successful track", async () => {
    const { rerender } = render(<ProductViewProbe productId="same-product" />);

    jest.advanceTimersByTime(1000);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    rerender(<ProductViewProbe productId="same-product" />);
    jest.advanceTimersByTime(1000);

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
