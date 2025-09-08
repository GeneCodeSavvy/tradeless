import { prices } from ".."

type orderData = {
    asset : string,
    qty : number
}

const balances = {
    "user_1" : {
        tradable : 10000000, //stored in integer and not float with 4 decimal 1000USD = 10000000
        locked : 0
    }
}

export const orderHandler = async({asset , qty} : orderData)=>{
    const assetInfo = prices[asset]
    if(!assetInfo) return; //need to send update to the another stream that backend reads
    const orderPrice = (qty * assetInfo.price)

    if(orderPrice > balances["user_1"].tradable){
        console.log("Insufficient Balance for order")
        return
    }

    balances["user_1"].tradable -= orderPrice;
    balances["user_1"].locked = orderPrice;

    //then send this update to the order_status stream that the backend listens to
    console.log(`Order for ${qty} ${asset} placed successfully`)
    console.log(`Users balance is ${balances["user_1"].tradable/10**4}`)

}