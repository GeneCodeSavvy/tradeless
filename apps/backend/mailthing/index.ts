import { Resend } from "resend";
import { RESEND_KEY } from "../constant";

const resend = new Resend(RESEND_KEY);

export async function authMail(to:string , token:string){
    try{
        console.log(to)
        const magic_link = `http://localhost:3000/auth/verify?token=${token}`
        await resend.emails.send({
            from : 'onboarding@resend.dev',
            to  : to,
            subject : "Welcome to Exness",
            html : `
        <div style="background-color: #1a1a1a;
      color: #ffffff;
      font-family: Arial, sans-serif;
      padding: 40px;
      text-align: center;">
      <h1 style="color: #ffffff;">Let's get you in!</h1>
      <p style="font-size: 16px; color: #cccccc;">
        Click the button below to access your dashboard.
      </p>
      <a href="${magic_link}" target="_blank" style="
        display: inline-block;
        margin-top: 30px;
        padding: 15px 30px;
        background-color: #4f46e5;
        color: #ffffff;
        text-decoration: none;
        border-radius: 8px;
        font-weight: bold;
        font-size: 16px;
      ">
        Get Started
      </a>
      <p style="margin-top: 30px; font-size: 12px; color: #888888;">
        If you did not request this, you can safely ignore this email.
      </p>
    </div>
  `
    })
    }catch{
        throw new Error("Unable to send email")
    }
}