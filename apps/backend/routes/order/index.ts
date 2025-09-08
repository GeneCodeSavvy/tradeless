import express from "express"
import { RedisManager } from "../../redis";
export const tradeRouter = express.Router();

const redisService = RedisManager.getInstance()


tradeRouter.post('/', async(req,res)=>{
    try{    
        const {asset , qty , type }= req.body;
        const placed = await redisService.newOrder({asset , qty , type, orderId:"123"})
        if(!placed){
            res.status(402).json({message : "unable to place order"})
            return
        }
        res.json({orderId : "123" , message : "order placed successfully"})
    }catch(e){
        console.log(e)
        res.json({message : "something went wrong"})
    }
})