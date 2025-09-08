import express from "express";
import  cors from "cors";
import { authRouter } from "./routes/auth";
import { tradeRouter } from "./routes/order";
import { RedisManager } from "./redis";
const app =express();
const redisService = RedisManager.getInstance();
//iife
(async()=>{await redisService.connect()})()
app.use(express.json())
app.use(cors({
    origin : 'http://localhost:3000',
    credentials: true
}))

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/trade', tradeRouter)
app.listen(8080, ()=>{
    console.log("Main backend is up and running");
})