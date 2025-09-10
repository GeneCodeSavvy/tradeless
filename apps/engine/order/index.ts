import { prices } from "..";

type orderData = {
  asset: string;
  qty: number;
  id: string;
  slippage: number;
  price: number;
};

type order = {
  orderId: string;
  userId: string;
  type: string;
  asset: string;
  buy: number;
  locked: number;
};
export type userInfo = {
  tradable: number;
  locked: number;
  orders: order[];
};

const balances: Record<string, userInfo> = {
  user_1: {
    tradable: 50000000, //stored in integer and not float with 4 decimal 5000USD = 10000000
    locked: 0,
    //this orders will be send to the frontend and there the current price will be calulated dynamically
    orders: [],
  },
};

const open_orders: order[] = [];

export const orderHandler = async ({
  asset,
  qty,
  id,
  slippage,
  price,
}: orderData) => {
  const assetInfo = prices[asset];
  if (!assetInfo) return; //need to send update to the another stream that backend reads
  //check slippage
  const priceDiff = Math.abs(assetInfo.price - price);
  const actualslippage = (priceDiff * 100) / price;
  if (actualslippage > slippage) {
    console.log("Value slipped more than the set slippage");
    return;
  }

  //assetInfo.price
  if (!balances["user_1"]) return;
  const assetPrice = assetInfo.price / 10 ** assetInfo.decimal;

  const orderPriceFloat = qty * assetPrice;
  const orderPriceScaled = Math.round(orderPriceFloat * 10 ** 4);

  if (orderPriceScaled > balances["user_1"].tradable) {
    console.log("Insufficient Balance for order");
    return;
  }

  balances["user_1"].tradable -= orderPriceScaled;
  balances["user_1"].locked = orderPriceScaled;
  const order = {
    orderId: id,
    userId: "1",
    type: "long",
    asset,
    buy: assetInfo.price,
    locked: orderPriceScaled,
  };
  balances["user_1"].orders.push(order);
  open_orders.push(order);
  //then send this update to the order_status stream that the backend listens to
  //using hset instead of stream because we want a snapshot,
  console.log(
    `Order for ${qty} ${asset} placed successfully at ${orderPriceScaled}`
  );
  console.log(`Users balance is ${balances["user_1"].tradable}`);
  return balances["user_1"];
};
