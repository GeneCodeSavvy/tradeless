// IN memory variable PRICES which gets updated in every 100ms
//  reads from the redis stream and updates the price
import { createClient } from "redis";
import { orderHandler, type userInfo } from "./order";

type assetInfo = {
  price: number;
  decimal: number;
};

const redisClient = createClient();
redisClient.connect();
const UPDATE_STREAM_KEY = "price_updates";
const ORDER_STREAM_KEY = "order_stream";

export const prices: Record<string, assetInfo> = {};

// /TODO: function for reading that sends data to other functions further
async function readStream(
  key: string,
  handler: (data: any) => void,
  count?: number
) {
  //based on key read diff stream and pass in their handler functions
  while (true) {
    const stream = await redisClient.xRead(
      {
        key,
        id: "$",
      },
      {
        BLOCK: 0,
        COUNT: count || 1,
      }
    );
    if (!stream) continue;
    //@ts-ignore
    const stream_data = JSON.parse(stream[0].messages[0].message.data);
    //pass the data to the handler functions
    await handler(stream_data);
  }
}

async function persistBalance(userId: string, balance: userInfo) {
  try {
    await redisClient.set(`balances:${userId}`, JSON.stringify(balance));
    console.log("user-info updated");
  } catch (e) {
    console.log(e);
  }
}

// xRead() -> Promise<StreamMessages[] | null>
// xRead(
//  streams: {
//              key : stream_name ,
//              id: from_where_to_read(set to "$" if want read from last message only
//                  or "0" if you want to replay the history)
//            }
//  options?: {
//              BLOCK: how much to wait for new message (0 for indefinetly / 5000 -> 5sec),
//              COUNT : max no. of message to read in one call(for batching)
//
//             }
// )
//

// We use while(true) and not setInterval(()=>{},100)
// bcos it will poll in 100ms even if there is not data added to the stream wasting resources
redisClient.on("connect", async () => {
  console.log("Engine is up and reading for latest price");

  //updates current price
  readStream(UPDATE_STREAM_KEY, (stream_data: any) => {
    for (const data of stream_data.price_updates) {
      prices[data.asset] = {
        price: data.price,
        decimal: data.decimal,
      };
    }
    //here also change the users balance that he is gaining profit or loss on all orders
    //check if loss is greater than margin
    // loss = (currentSellPrice - orderBoughPrice) * qty * leverage
  });

  //order handler
  //reads the order stream and calls the order handler
  // readStream(ORDER_STREAM , (stream_data:any)=>{
  // const orderData = { asset : stream_data.asset , qty:stream_data:qty }
  // orderHandler(orderData);
  // })
  readStream(ORDER_STREAM_KEY, async (stream_data) => {
    const id = new Date().toString();
    const orderData = {
      asset: stream_data.asset,
      qty: stream_data.qty,
      slippage: stream_data.slippage,
      price: stream_data.price,
      id,
    };
    const balances = await orderHandler(orderData);
    if (!balances) {
      console.log("something happened while placing order");
      return;
    }
    await persistBalance("user_1", balances);
  });
});
