import type { order, orderData,orderHandlerOptions } from "../types";

const open_orders: order[] = [];

export const orderHandler = async ({
	asset,
	qty,
	id,
	slippage,
	price,
	userId,
}: orderData,{balances , prices}: orderHandlerOptions) => {
	try {
		if (!userId) {
			console.log("No userId, cancelling....");
			return;
		}
		const assetInfo = prices[asset];
		if (!assetInfo) {
			console.log("asset not found");
			return;
		} //need to send update to the another stream that backend reads
		//check slippage
		const priceDiff = Math.abs(assetInfo.price - price);
		const actualslippage = (priceDiff * 100) / price;
		if (actualslippage > slippage) {
			console.log("Value slipped more than the set slippage");
			return;
		}
		//populate balance for user_id if new
		if (!balances[userId]) {
			balances[userId] = {
				tradable: 50000000, //stored in integer and not float with 4 decimal 5000USD = 50000000
				locked: 0,
				//this orders will be send to the frontend and there the current price will be calulated dynamically
				orders: [],
			};
			console.log("New user, setup is done.");
		}
		//assetInfo.price
		const assetPrice = assetInfo.price / 10 ** assetInfo.decimal;

		const orderPriceFloat = qty * assetPrice;
		//converting into intefer for deduction
		const orderPriceScaled = Math.round(orderPriceFloat * 10 ** 4);

		if (orderPriceScaled > balances[userId].tradable) {
			console.log("Insufficient Balance for order");
			return;
		}

		balances[userId].tradable -= orderPriceScaled;
		balances[userId].locked = orderPriceScaled;
		const order = {
			orderId: id,
			userId,
			type: "long",
			asset,
			buy: assetInfo.price,
			locked: orderPriceScaled,
		};
		balances[userId].orders.push(order);
		open_orders.push(order);
		//then send this update to the order_status stream that the backend listens to
		//using hset instead of stream because we want a snapshot,
		console.log(
			`Order for ${qty} ${asset} placed successfully at ${orderPriceScaled}`,
		);
		console.log(`Users balance is ${balances[userId].tradable}`);
		return balances[userId];
	} catch (e) {
		console.log(`Some error occured in processing order: ${e}`);
		return null;
	}
};
