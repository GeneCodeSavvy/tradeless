import express from "express";
import { RedisManager } from "../../redis";
export const tradeRouter = express.Router();

const redisService = RedisManager.getInstance();

tradeRouter.post("/", async (req, res) => {
	try {
		const { asset, qty, type, price, slippage, userId } = req.body;
		const placed = await redisService.newOrder({
			asset,
			qty,
			type,
			price,
			slippage,
			userId,
		});
		if (!placed) {
			res.status(402).json({ message: "unable to place order" });
			return;
		}
		res.json({ message: "order placed successfully" });
	} catch (e) {
		console.log(e);
		res.json({ message: "something went wrong" });
	}
});

tradeRouter.get("/info/:userId", async (req, res) => {
	try {
		const { userId } = req.params;
		const rawData = await redisService.getClient().get(`balances:${userId}`);
		console.log(rawData);
		if (!rawData) {
			res.status(404).json({ message: `no userdata for: ${userId}` });
			return;
		}
		const userInfo = JSON.parse(rawData);
		res.json(userInfo);
	} catch (e) {
		console.log(e);
		res.status(402).json({ message: "unable to get users info" });
	}
});
