import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../constant";


export function genToken(email : string){
    console.log(JWT_SECRET)
    return jwt.sign({email}, JWT_SECRET, {expiresIn : "15m"})
}

export function verifyToken(token:string){
    try{
        return jwt.verify(token, JWT_SECRET)
    }catch(e){
        console.log(e);
        return null
        
    }
}