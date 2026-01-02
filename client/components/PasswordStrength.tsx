"use client";
import { useEffect, useState } from "react";

interface PasswordStrengthProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);
  const [strengthText, setStrengthText] = useState("");

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setStrength(0);
      setStrengthText("");
      return;
    }

    let strengthValue = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Calculate strength based on passed checks
    Object.values(checks).forEach(passed => {
      if (passed) strengthValue += 20;
    });

    // Bonus for longer passwords
    if (password.length >= 12) strengthValue += 10;
    if (password.length >= 16) strengthValue += 10;

    setStrength(Math.min(strengthValue, 100));

    // Set strength text
    if (strengthValue <= 20) {
      setStrengthText("Weak");
    } else if (strengthValue <= 40) {
      setStrengthText("Fair");
    } else if (strengthValue <= 60) {
      setStrengthText("Good");
    } else if (strengthValue <= 80) {
      setStrengthText("Strong");
    } else {
      setStrengthText("Very Strong");
    }
  }, [password]);

  const getStrengthColor = () => {
    if (strength <= 20) return "bg-red-500";
    if (strength <= 40) return "bg-orange-500";
    if (strength <= 60) return "bg-yellow-500";
    if (strength <= 80) return "bg-blue-500";
    return "bg-green-500";
  };

  const getStrengthTextColor = () => {
    if (strength <= 20) return "text-red-500";
    if (strength <= 40) return "text-orange-500";
    if (strength <= 60) return "text-yellow-500";
    if (strength <= 80) return "text-blue-500";
    return "text-green-500";
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Password Strength</span>
        <span className={`font-medium ${getStrengthTextColor()}`}>
          {strengthText}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${strength}%` }}
        />
      </div>
      {showRequirements && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className={password.length >= 8 ? "text-green-500" : ""}>
              {password.length >= 8 ? "✓" : "○"} At least 8 characters
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={/[a-z]/.test(password) ? "text-green-500" : ""}>
              {/[a-z]/.test(password) ? "✓" : "○"} One lowercase letter
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={/[A-Z]/.test(password) ? "text-green-500" : ""}>
              {/[A-Z]/.test(password) ? "✓" : "○"} One uppercase letter
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={/\d/.test(password) ? "text-green-500" : ""}>
              {/\d/.test(password) ? "✓" : "○"} One number
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "text-green-500" : ""}>
              {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? "✓" : "○"} One special character
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
