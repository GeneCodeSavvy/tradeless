import express from "express";
import { inSchema } from "../../validations";
import { genToken, verifyToken } from "../../tokenthing";
import { authMail } from "../../mailthing";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../constant";
export const authRouter = express.Router();

let tokenMaps: Map<string, string> = new Map();

authRouter.post("/in", async (req, res) => {
  try {
    const { data, success } = inSchema.safeParse(req.body);
    if (!success) {
      res.status(402).json({ messsage: "email required" });
      return;
    }
    //do some signup thing here
    //if new user then add a user with 5000usd
    const token = genToken(data.email);
    tokenMaps.set(data.email, token);
    await authMail(data.email, token);
    res.json({ message: "Check your mail for the verification link" });
  } catch (e) {
    console.log(e);
    res.status(402).json({ message: "smth went wrong" });
  }
});

authRouter.get("/verify", async (req, res) => {
  try {
    const token = req.query.token as string;
    const token_valid = verifyToken(token) as jwt.JwtPayload;
    if (!token_valid) {
      res.status(403).json({ message: "Token expired or invalid login." });
      return;
    }
    const user_email = token_valid.email as string;
    tokenMaps.delete(user_email);
    //set cookie when user verified
    const auth_token = jwt.sign({ email: user_email }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("auth_token", auth_token, {
      httpOnly: true,
      secure: false, //set true in prod
      sameSite: "strict",
      maxAge: 60 * 60 * 1000,
    });
    res.json({ message: `Welcome ${user_email}.` });
  } catch (e) {
    console.log(e);
    res.status(402).json({ message: "smth went wrong" });
  }
});
