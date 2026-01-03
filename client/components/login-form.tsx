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
import { PasswordStrength } from "./PasswordStrength"
import { GoogleSignIn } from "./GoogleSignIn"
import { toast } from "@/lib/toast"
import { AppleSpinner } from "./ui/apple-spinner"

export function LoginForm({
  className,
  onLogin,
  defaultMode = "login",
  onModeChange,
  ...props
}: React.ComponentProps<"div"> & {
  onLogin?: (userData: { id: string; username: string | null; email: string; createdAt: string; onboardingCompleted: boolean; projectInterests: string[] }, token: string) => void;
  defaultMode?: "login" | "signup";
  onModeChange?: (mode: "login" | "signup") => void;
}) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // Sync mode if defaultMode changes from parent (URL change)
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleModeToggle = (newMode: "login" | "signup") => {
    setMode(newMode);
    onModeChange?.(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const GraphQL_ENDPOINT = "http://localhost:5000/graphql";

      if (mode === "login") {
        const loginMutation = `
          mutation {
            login(input: {
              email: "${email}"
              password: "${password}"
            }) {
              token
              user {
                id
                username
                email
                createdAt
                updatedAt
                onboardingCompleted
                projectInterests
                authProvider
                avatarUrl
              }
            }
          }
        `;

        const response = await fetch(GraphQL_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: loginMutation })
        });

        const result = await response.json();

        if (result.errors) {
          toast.error(result.errors[0].message);
        } else if (result.data?.login) {
          localStorage.removeItem('flowzen_pending_onboarding');
          // Pass user data and token to parent
          onLogin?.(result.data.login.user, result.data.login.token);
        } else {
          toast.error("Login failed. Please try again.");
        }
      } else {
        // Signup mode
        const signupMutation = `
          mutation {
            register(input: {
              email: "${email}"
              password: "${password}"
            }) {
              token
              user {
                id
                username
                email
                createdAt
                updatedAt
                onboardingCompleted
                projectInterests
                authProvider
                avatarUrl
              }
            }
          }
        `;

        const response = await fetch(GraphQL_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query: signupMutation })
        });

        const result = await response.json();

        if (result.errors) {
          toast.error(result.errors[0].message);
        } else if (result.data?.register) {
          localStorage.setItem('flowzen_pending_onboarding', 'true');
          // Pass user data and token to parent
          onLogin?.(result.data.register.user, result.data.register.token);
        } else {
          toast.error("Registration failed. Please try again.");
        }
      }
    } catch (error) {
      toast.error("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (idToken: string) => {
    setLoading(true);

    try {
      const GraphQL_ENDPOINT = "http://localhost:5000/graphql";

      const googleLoginMutation = `
        mutation {
          loginWithGoogle(input: {
            idToken: "${idToken}"
          }) {
            token
            user {
                id
                username
                email
                createdAt
                updatedAt
                onboardingCompleted
                projectInterests
                authProvider
                avatarUrl
              }
            isNewUser
          }
        }
      `;

      const response = await fetch(GraphQL_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: googleLoginMutation })
      });

      const result = await response.json();

      if (result.errors) {
        toast.error(result.errors[0].message);
      } else if (result.data?.loginWithGoogle) {
        const { user, token, isNewUser } = result.data.loginWithGoogle;

        // Set onboarding flag for new Google users
        if (isNewUser) {
          localStorage.setItem('flowzen_pending_onboarding', 'true');
        } else {
          localStorage.removeItem('flowzen_pending_onboarding');
        }

        // Pass user data and token to parent
        onLogin?.(user, token);
      } else {
        toast.error("Google login failed. Please try again.");
      }
    } catch (error) {
      toast.error("Network error during Google login.");
    } finally {
      setLoading(false);
    }
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
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                {mode === "signup" && (
                  <PasswordStrength password={password} />
                )}
              </Field>
              <Field>
                <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                  {loading ? (
                    <>
                      <AppleSpinner size="sm" className="mr-2" />
                      {mode === "login" ? "Authenticating..." : "Creating Account..."}
                    </>
                  ) : (
                    <>
                      {mode === "login" ? "Login" : "Sign Up"}
                      <ShieldCheck className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              </Field>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Field>
                <GoogleSignIn
                  onSuccess={handleGoogleSignIn}
                  onError={toast.error}
                  disabled={loading}
                />
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
                    onClick={() => onLogin?.({ id: 'guest', username: 'Guest User', email: 'guest@flowzen.com', createdAt: new Date().toISOString(), onboardingCompleted: true, projectInterests: [] }, 'guest-token')}
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
