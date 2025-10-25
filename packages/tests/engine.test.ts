// engine.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { orderHandler } from "../../apps/engine/order";
import type { assetInfo, userInfo, orderData } from "../../apps/engine/types";

let mockPrices: Record<string, assetInfo>;
let mockBalances: Record<string, userInfo>;

beforeEach(() => {
  // Reset balances and prices before each test
  mockBalances = {
    user_1: {
      tradable: 50000000,
      locked: 0,
      orders: [],
    },
  };
  mockPrices = {};
});

describe("Engine price updates", () => {
  it("updates the prices record correctly", () => {
    mockPrices["BTC"] = { price: 1500000, decimal: 4 };
    mockPrices["ETH"] = { price: 50000, decimal: 4 };

    expect(mockPrices["BTC"]).toEqual({ price: 1500000, decimal: 4 });
    expect(mockPrices["ETH"]).toEqual({ price: 50000, decimal: 4 });
  });
});

describe("Orders for existing users", () => {
  it("places a valid order and updates balances exactly", async () => {
    mockPrices["BTC"] = { price: 1500000, decimal: 4 }; // 150.0000 USD

    const qty = 2;
    const orderData: orderData = {
      asset: "BTC",
      qty,
      id: "order_1",
      slippage: 1,
      price: 1500000,
      userId: "user_1",
    };

    const result = await orderHandler(orderData, { balances: mockBalances, prices: mockPrices });

    const assetPrice = mockPrices["BTC"]!.price / 10 ** mockPrices["BTC"]!.decimal;
    const expectedLocked = Math.round(qty * assetPrice * 10 ** 4);
    const expectedTradable = 50000000 - expectedLocked;

    expect(result).toBeDefined();
    expect(mockBalances["user_1"]!.locked).toBe(expectedLocked);
    expect(mockBalances["user_1"]!.tradable).toBe(expectedTradable);
    expect(mockBalances["user_1"]!.orders.length).toBe(1);
  });

  it("rejects order if slippage is exceeded", async () => {
    mockPrices["BTC"] = { price: 1500000, decimal: 4 };

    const orderData: orderData = {
      asset: "BTC",
      qty: 1,
      id: "order_slip",
      slippage: 0.1, // small slippage
      price: 1600000, // actual price diff is too high
      userId: "user_1",
    };

    const result = await orderHandler(orderData, { balances: mockBalances, prices: mockPrices });

    expect(result).toBeUndefined();
    expect(mockBalances["user_1"]!.orders.length).toBe(0);
    expect(mockBalances["user_1"]!.locked).toBe(0);
    expect(mockBalances["user_1"]!.tradable).toBe(50000000);
  });

  it("rejects order if tradable balance is insufficient", async () => {
    mockPrices["BTC"] = { price: 1500000, decimal: 4 };

    const orderData: orderData = {
      asset: "BTC",
      qty: 10000, // too high
      id: "order_insufficient",
      slippage: 1,
      price: 1500000,
      userId: "user_1",
    };

    const result = await orderHandler(orderData, { balances: mockBalances, prices: mockPrices });

    expect(result).toBeUndefined();
    expect(mockBalances["user_1"]!.orders.length).toBe(0);
    expect(mockBalances["user_1"]!.locked).toBe(0);
    expect(mockBalances["user_1"]!.tradable).toBe(50000000);
  });
});

describe("Orders for new users", () => {
  it("creates a new user with initial balance and places order correctly", async () => {
    mockPrices["ETH"] = { price: 50000, decimal: 4 }; // 5.0000 USD

    const orderData: orderData = {
      asset: "ETH",
      qty: 5,
      id: "order_new_user",
      slippage: 1,
      price: 50000,
      userId: "new_user",
    };

    const result = await orderHandler(orderData, { balances: mockBalances, prices: mockPrices });

    const assetPrice = mockPrices["ETH"]!.price / 10 ** mockPrices["ETH"]!.decimal;
    const expectedLocked = Math.round(orderData.qty * assetPrice * 10 ** 4);
    const expectedTradable = 50000000 - expectedLocked;

    expect(result).toBeDefined();
    expect(mockBalances["new_user"]).toBeDefined();
    expect(mockBalances["new_user"]!.locked).toBe(expectedLocked);
    expect(mockBalances["new_user"]!.tradable).toBe(expectedTradable);
    expect(mockBalances["new_user"]!.orders.length).toBe(1);
  });
});

describe("Integration test: price update + order for new user", () => {
  it("updates price and places order correctly for a new user", async () => {
    // Step 1: Update prices
    mockPrices["SOL"] = { price: 200000, decimal: 4 }; // 20.0000 USD

    // Step 2: Place order
    const orderData: orderData = {
      asset: "SOL",
      qty: 10,
      id: "order_integration",
      slippage: 1,
      price: 200000,
      userId: "integration_user",
    };

    const result = await orderHandler(orderData, { balances: mockBalances, prices: mockPrices });

    const assetPrice = mockPrices["SOL"]!.price / 10 ** mockPrices["SOL"]!.decimal;
    const expectedLocked = Math.round(orderData.qty * assetPrice * 10 ** 4);
    const expectedTradable = 50000000 - expectedLocked;

    expect(result).toBeDefined();
    expect(mockBalances["integration_user"]).toBeDefined();
    expect(mockBalances["integration_user"]!.locked).toBe(expectedLocked);
    expect(mockBalances["integration_user"]!.tradable).toBe(expectedTradable);
    expect(mockBalances["integration_user"]!.orders.length).toBe(1);
  });
});
