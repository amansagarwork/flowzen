"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "@/lib/toast";


declare global {
  interface Window {
    google: any;
  }
}

interface GoogleSignInProps {
  onSuccess: (token: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export function GoogleSignIn({ onSuccess, onError, disabled = false }: GoogleSignInProps) {
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.google || !buttonRef.current) {
      return;
    }

    const initializeGoogleSignIn = () => {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: (response: any) => {
          setLoading(true);
          if (response.credential) {
            onSuccess(response.credential);
          } else {
            console.error("Google Sign-In response missing credential:", response);
            toast.error("Failed to get Google credential");
            onError("Failed to get Google credential");
          }
          setLoading(false);
        },
      });

      window.google.accounts.id.renderButton(
        buttonRef.current,
        {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "continue_with"
        }
      );
    };

    initializeGoogleSignIn();
  }, [onSuccess, onError]);

  return (
    <div
      ref={buttonRef}
      className="w-full flex justify-center items-center h-[40px]"
      style={{ minHeight: '40px' }}
    />
  );
}
