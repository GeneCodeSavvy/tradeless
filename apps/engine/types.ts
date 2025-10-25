
export type assetInfo = {
  price: number;
  decimal: number;
};

export type orderData = {
	asset: string;
	qty: number;
	id: string;
	slippage: number;
	price: number;
	userId: string;
};

export type order = {
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
export type orderHandlerOptions = {
  balances: Record<string, userInfo>;
    prices: Record<string, assetInfo> ;
};


