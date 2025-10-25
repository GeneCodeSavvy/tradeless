import { expect, test } from "bun:test";
import { createClient, type RedisClientType } from "redis";
import { prices, startEngine } from "../../apps/engine/index";
import { type userInfo } from "../../apps/engine/order/index";

test("Reads from stream and puts order", async () => {
	const redis = createClient();
    await redis.connect()
	await redis.flushDb();
	const controller = new AbortController();
	//@ts-ignore
	startEngine(redis as RedisClientType, controller.signal);
    await new Promise(r=> setTimeout(r,100))
	const asset = "SOL";
	const price = 194365000;
	const decimal = 6;
	await redis.xAdd(
		"price_updates",
		"*",

		{ data: JSON.stringify({ price_updates: [{ asset, price, decimal }] }) },
	);
	await new Promise((r) => setTimeout(r, 100));

	//place order
	const qty = 2;
	const userId = "user_4";
	const orderData = {
		asset,
		qty,
		slippage: 1,
		price,
		userId,
	};
	await redis.xAdd("order_stream", "*", { data: JSON.stringify(orderData) });
	//integer balance
	const rawBalance = await redis.get(`balances:${userId}`);
    console.log(rawBalance)
	const balance: userInfo = JSON.parse(rawBalance!);
	const assetPrice = price / 10 ** decimal;
	const orderPriceFloat = qty * assetPrice;
	const expectedLocked = Math.round(orderPriceFloat * 10 ** 4);
	const initialBalance = 50000000;

	expect(balance.locked).toBe(expectedLocked);
	expect(balance.tradable).toBe(initialBalance - expectedLocked);

	controller.abort();
});
