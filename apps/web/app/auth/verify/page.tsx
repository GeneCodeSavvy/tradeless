'use client'

import { useEffect, useState } from "react";
import {useRouter} from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";

export default function Page (){
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const token = new URLSearchParams(window.location.search).get("token");
        
        
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(`http://localhost:8080/api/v1/auth/verify?token=${token}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials : "include"
        });

        if (!response.ok) {
          throw new Error("Authentication failed");
        }

        const data = await response.json();
        setStatus("success");
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);

      } catch (error) {
        console.error("Authentication error:", error);
        setStatus("error");
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    };

    authenticateUser();
  }, []);

  const getStatusContent = () => {
    switch (status) {
      case "loading":
        return {
          title: "Getting you in",
          subtitle: "Please wait while we authenticate your account",
          // icon: <LoadingSpinner size="lg" className="animate-glow" />
          icon : <div className="animate-spin"><LoaderCircle/></div>
        };
      case "success":
        return {
          title: "Welcome!",
          subtitle: "Authentication successful, redirecting to dashboard",
          icon: (
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center animate-fade-in">
              <Check/>
            </div>
          )
        };
      case "error":
        return {
          title: "Authentication failed",
          subtitle: "Redirecting you back to the home page",
          icon: (
            <div className="w-12 h-12 bg-destructive rounded-full flex items-center justify-center animate-fade-in">
              <svg className="w-6 h-6 text-destructive-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-8 animate-fade-in">
        <div className="flex justify-center">
          {content.icon}
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {content.title}
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {content.subtitle}
          </p>
        </div>

        {/* {status === "loading" && (
          <div className="flex justify-center">
            <LoadingDots />
          </div>
        )} */}
      </div>
    </div>
  );
};

