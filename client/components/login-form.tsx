"use client";
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Zap, ShieldCheck, Eye, EyeOff } from "lucide-react"

export function LoginForm({
  className,
  onLogin,
  defaultMode = "login",
  onModeChange,
  ...props
}: React.ComponentProps<"div"> & {
  onLogin?: () => void;
  defaultMode?: "login" | "signup";
  onModeChange?: (mode: "login" | "signup") => void;
}) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [showPassword, setShowPassword] = useState(false);

  // Sync mode if defaultMode changes from parent (URL change)
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleModeToggle = (newMode: "login" | "signup") => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin?.();
    }, 1000);
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-2 border border-primary/30">
            <Zap className="w-6 h-6 text-primary" fill="currentColor" />
          </div>
          <CardTitle className="text-2xl">
            {mode === "login" ? "Login to FlowZen" : "Create an Account"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Enter your email below to login to your account"
              : "Enter your details below to create your account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {mode === "signup" && (
                <Field>
                  <FieldLabel htmlFor="name">Full Name</FieldLabel>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  {mode === "login" && (
                    <a
                      href="#"
                      className="ml-auto inline-block text-xs underline-offset-4 hover:underline cursor-pointer"
                    >
                      Forgot your password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </Field>
              <Field>
                <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                  {loading ? (mode === "login" ? "Authenticating..." : "Creating Account...") : (mode === "login" ? "Login" : "Sign Up")}
                  {!loading && <ShieldCheck className="ml-2 w-4 h-4" />}
                </Button>
                <Button variant="outline" type="button" className="w-full cursor-pointer">
                  Continue with Google
                </Button>
                <FieldDescription className="text-center mt-2">
                  {mode === "login" ? (
                    <>Don&apos;t have an account? <button type="button" onClick={() => handleModeToggle("signup")} className="underline underline-offset-4 hover:text-primary cursor-pointer">Sign up</button></>
                  ) : (
                    <>Already have an account? <button type="button" onClick={() => handleModeToggle("login")} className="underline underline-offset-4 hover:text-primary cursor-pointer">Login</button></>
                  )}
                </FieldDescription>
                <div className="pt-4 border-t border-border/50 mt-4 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-primary cursor-pointer"
                    onClick={onLogin}
                  >
                    Skip for now (Guest Mode)
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
