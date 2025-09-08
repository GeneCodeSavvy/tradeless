//backpack thing
// ws:  wss://ws.backpack.exchange/
//message 
// TICKER : {"method":"SUBSCRIBE","params":["bookTicker.SOL_USDC"],"id":1}
// TRAde : {"method":"SUBSCRIBE","params":["trade.SOL_USDC"],"id":3}
// DEPTH :  {"method":"SUBSCRIBE","params":["depth.200ms.SOL_USDC"],"id":2}

// 3 assets = ["SOL_USDC", "ETH_USDC", "BTC_USDC"] 
import WebSocket from "ws";
import { createClient } from "redis";

type assetData = {
    asset : string,
    decimal : number,
    price : number
}
const ws = new WebSocket("wss://ws.backpack.exchange/");
const redis = createClient();
await redis.connect();
const UPDATE_STREAM_KEY = "price_updates";
const TICKER_STREAM_KEY = "ticker_stream"

const asssets = [{symbol : "SOL_USDC", asset:"SOL", decimal : 6}, {symbol : "ETH_USDC", asset:"ETH", decimal : 4}, {symbol :"BTC_USDC", asset : "BTC", decimal : 4}]
const latest_price:Record<string , assetData > = {};

//when connection established to backpack, subscribe to 3 assets
ws.on('open', ()=>{
    console.log("Listening to backpack ws stream. Ready to subscribe");
    asssets.forEach((a)=> {
        ws.send(JSON.stringify({"method":"SUBSCRIBE","params":[`bookTicker.${a.symbol}`],"id":1}))
    })
})

//reciece data of 3 assets and format and store in-memory
ws.on('message', async(data)=>{
    const stream_data = JSON.parse(data.toString())
    // response 
    // { data : { a(ask), b(bid) , s(asset_name):"ETH_USDC"}}
    // can calculate mid price or choose either one
    const formatted_data:{ask : any , bid:any , symbol: "SOL_USDC" | "ETH_USDC"| "BTC_USDC"} = {
        ask : stream_data.data.a,
        bid : stream_data.data.b,
        symbol : stream_data.data.s
    }

    //stream for the ticker or bid and ask that will go to the frontend
    await redis.xAdd(TICKER_STREAM_KEY, "*", {data : JSON.stringify(formatted_data)});
    const mid_price = (parseFloat(formatted_data.ask)+ parseFloat(formatted_data.bid))/2
    const {asset , decimal} = asssets.find((a)=> a.symbol === formatted_data.symbol)!
    const current_price = Math.floor(mid_price * 10 ** decimal)

    latest_price[asset] ={
        asset,
        price : current_price,
        decimal 
    }
})

//on 100ms interval, add to redis stream "price_updates"
setInterval(async()=>{
    const stream_payload = {
        price_updates : Object.values(latest_price)
    }

    //do not push and empty data
    if(stream_payload.price_updates.length > 0){
        await redis.xAdd(UPDATE_STREAM_KEY , "*", {data : JSON.stringify(stream_payload)})
        console.log("Added data to the stream: ", stream_payload)
    }
    // .xadd(stream_name , id(use "*" so redis add own timestampped id), )
}, 100)