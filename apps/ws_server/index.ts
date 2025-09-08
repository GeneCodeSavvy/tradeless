import { createClient } from "redis";
import {WebSocketServer, type WebSocket} from "ws"
const TICKER_STREAM_KEY = "ticker_stream"

const redis = createClient()
redis.connect()
const wss = new WebSocketServer({port : 3333})

//subscribe message with the asset name -> keep track of subscripitons
//assets coming from redis and stored here
//ws sends the latest asset which is required in {a,b} fashion

//track connections
// { {ws, ["BTC", "SOL", "ETH"] }... } multiple subscriptions
const subscriptions = new Map<WebSocket , Set<string>>();


//managin ws subscriptions
wss.on("connection", (ws)=>{
    console.log("new client connected, ready to receive subscription")
    //subscribe/unsubscribe message
    ws.on("message", async(message)=>{
        // const data = JSON.parse(message.toString());
        const data = JSON.parse(message.toString());
        
        // // data = {e : "subscribe", params:["BTC", "SOL", "ETH" ]}
        if(data.e === "subscribe" && Array.isArray(data.params)){
            //add to subscription MAP
            subscriptions.set(ws, new Set(data.params))
        }
        //TODO: add for unsubscribe also
    })
})

//reading from stream and sending to the ws subscribers
redis.on("connect", async()=> {
    console.log("reading ticker stream")

    while(true){
        const stream = await redis.xRead(
            {
                key : TICKER_STREAM_KEY,
                id : "$"
            },
            {
                BLOCK : 0,
                COUNT : 1
            }
        )
        if(!stream) continue;

        // @ts-ignore
        const ticker_data = JSON.parse(stream[0].messages[0].message.data)
        const asset = ticker_data.symbol.split("_")[0]; // gives "BTC", "ETH","SOL"
        //send to the subscribed users
        [...subscriptions.entries()].forEach(([ws,subs])=>{
            if(subs.has(asset)){
                ws.send(JSON.stringify(ticker_data))
            }
        })
    }
})