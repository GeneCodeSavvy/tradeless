
import { createClient, type RedisClientType } from "redis";
import { da } from "zod/locales";

type newOrderData = {
    orderId : string,
    asset : string,
    qty : number,
    slippage : number,
    price : number,
    type : "long" | "short"
}
const ORDER_STREAM_KEY = "order_stream"

export class RedisManager{
    private client:RedisClientType;
    private static instance : RedisManager;

    constructor(){
        this.client = createClient()
        
    }   
    public static getInstance(){
        if(!this.instance){
            this.instance = new RedisManager()
        }
        return this.instance;
    }

   async connect() {
    if (!this.client.isOpen) {
      await this.client.connect();
      console.log("redis connected");
    }
  }

    async newOrder(data:newOrderData){
        //adds to the redis using a new stream
        // this.client.xAdd()
        //engine will read this stream and process order

        const stream_data = { 
            asset : data.asset,
            qty : data.qty,
            slippage : data.slippage,
            price : data.price
        }
        
        await this.client.xAdd(ORDER_STREAM_KEY, "*", {data : JSON.stringify(stream_data)})

        return true;
        //this listen to a callback stream and return value when completed order
    }

    getClient(){
        return this.client
    }
}