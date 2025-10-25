// IN memory variable PRICES which gets updated in real-time
// Reads price updates from Redis Pub/Sub and order stream from Redis Stream
import { createClient } from "redis";
import type { assetInfo, userInfo } from "./types";
import { orderHandler } from "./order";
const redisClient = createClient();
await redisClient.connect();

const priceSubClient = redisClient.duplicate();
await priceSubClient.connect();

console.log("Engine is up and ready");

const UPDATE_CHANNEL = "price_updates";
const ORDER_STREAM_KEY = "order_stream";

const userBalances: Record<string, userInfo> = {
	user_1: {
		tradable: 50000000, //stored in integer and not float with 4 decimal 5000USD = 10000000
		locked: 0,
		//this orders will be send to the frontend and there the current price will be calulated dynamically
		orders: [],
	},
};
const prices: Record<string, assetInfo> = {};

async function persistBalance(userId: string, balance: userInfo) {
	try {
		await redisClient.set(`balances:${userId}`, JSON.stringify(balance));
		console.log("user-info updated");
	} catch (e) {
		console.log(e);
	}
}

export async function readStream(
	key: string,
	handler: (data: any) => void,
	count?: number,
) {
	let lastId = "$"; // start from latest || "0" --> start from old messages
	while (true) {
		const stream = await redisClient.xRead([{ key, id: lastId }], {
			BLOCK: 0,
			COUNT: count || 1,
		});

		if (!stream) continue;

		//@ts-ignore
		const messages = stream[0].messages;
		const latest = messages[messages.length - 1];
		//@ts-ignore
		const stream_data = JSON.parse(latest.message.data);

		await handler(stream_data);
		lastId = latest.id;
	}
}

export async function subscribePriceUpdates() {
	console.log("Subscribing to price updates...");
	await priceSubClient.subscribe(UPDATE_CHANNEL, (message) => {
		const stream_data = JSON.parse(message);
		// console.log("Received price update:", stream_data);

		for (const data of stream_data.price_updates) {
			prices[data.asset] = {
				price: data.price,
				decimal: data.decimal,
			};
		}
	});
}

Promise.all([
	subscribePriceUpdates(),
	readStream(ORDER_STREAM_KEY, async (stream_data) => {
		const id = new Date().toString();
		console.log("Processing order:", stream_data);

		const orderData = {
			asset: stream_data.asset,
			qty: stream_data.qty,
			slippage: stream_data.slippage,
			price: stream_data.price,
			userId: stream_data.userId,
			id,
		};

		const balances = await orderHandler(orderData, {balances:userBalances,prices});
		if (!balances) {
			console.log("Something went wrong while placing order");
			return;
		}

		console.log(`Balance for ${stream_data.userId} is ${balances}`);
		await persistBalance(stream_data.userId, balances);
	}),
]).catch(console.error);
