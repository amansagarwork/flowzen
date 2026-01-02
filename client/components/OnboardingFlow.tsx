"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Zap, Code, Database, Cloud, Shield, Smartphone, Globe } from "lucide-react";

interface OnboardingFlowProps {
  onComplete: (username: string, projectInterests: string[]) => void;
  onSkip?: () => void;
}

const PROJECT_INTERESTS = [
  { id: "web-development", label: "Web Development", icon: Globe },
  { id: "mobile-apps", label: "Mobile Apps", icon: Smartphone },
  { id: "backend-api", label: "Backend APIs", icon: Code },
  { id: "database", label: "Database Design", icon: Database },
  { id: "cloud-services", label: "Cloud Services", icon: Cloud },
  { id: "security", label: "Security", icon: Shield },
];

export function OnboardingFlow({ onComplete, onSkip }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests(prev => 
      prev.includes(interestId) 
        ? prev.filter(id => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleNext = () => {
    if (step === 1 && username.trim()) {
      setStep(2);
    } else if (step === 2) {
      onComplete(username.trim(), selectedInterests);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const canProceed = step === 1 ? username.trim().length >= 2 : true;

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background relative overflow-hidden">
      {/* Left Side: Premium Banner */}
      <div
        className="hidden lg:flex relative flex-col justify-end p-12 overflow-hidden"
        style={{
          backgroundImage: "url('/images/auth-banner.png')",
          backgroundSize: 'contain',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#c5c6c0'
        }}
      >
        <div className="absolute inset-0 bg-zinc-950/5 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-3 mb-8">
          <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
            <Zap className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-zinc-950">FlowZen</span>
        </div>
        <blockquote className="relative z-10 space-y-2 max-w-lg">
          <p className="text-lg font-medium text-zinc-950 italic">
            &ldquo;Complete your profile to unlock personalized automation workflows.&rdquo;
          </p>
          <footer className="text-sm text-zinc-600 font-medium">FlowZen Engineering Team</footer>
        </blockquote>
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      {/* Right Side: Onboarding Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 relative bg-zinc-950/5 dark:bg-zinc-950/20">
        <div className="w-full max-w-md relative z-10">
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardHeader className="text-center">
              <div className="mx-auto bg-primary/20 w-12 h-12 rounded-xl flex items-center justify-center mb-2 border border-primary/30">
                <Zap className="w-6 h-6 text-primary" fill="currentColor" />
              </div>
              <CardTitle className="text-2xl">
                {step === 1 ? "Welcome to FlowZen!" : "Choose Your Interests"}
              </CardTitle>
              <CardDescription>
                {step === 1 
                  ? "Let's start with your username"
                  : "Select the areas you're interested in working on"
                }
              </CardDescription>
              
              {/* Progress Indicator */}
              <div className="flex justify-center gap-2 mt-4">
                <div className={`w-8 h-2 rounded-full transition-colors ${
                  step >= 1 ? "bg-primary" : "bg-gray-200"
                }`} />
                <div className={`w-8 h-2 rounded-full transition-colors ${
                  step >= 2 ? "bg-primary" : "bg-gray-200"
                }`} />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Username
                    </label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="mt-2"
                      minLength={2}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be your unique identifier in FlowZen
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-3">What are you interested in?</p>
                    <div className="grid grid-cols-2 gap-3">
                      {PROJECT_INTERESTS.map(interest => {
                        const Icon = interest.icon;
                        const isSelected = selectedInterests.includes(interest.id);
                        
                        return (
                          <button
                            key={interest.id}
                            type="button"
                            onClick={() => handleInterestToggle(interest.id)}
                            className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                              isSelected 
                                ? "border-primary bg-primary/10 text-primary" 
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4" />
                              <span className="text-sm font-medium">{interest.label}</span>
                            </div>
                            {isSelected && (
                              <Badge variant="secondary" className="text-xs">
                                Selected
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Select as many as you like (optional)
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button 
                    variant="outline" 
                    onClick={handlePrevious}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </Button>
                )}
                
                <div className="flex-1 flex gap-3 justify-end">
                  {onSkip && (
                    <Button 
                      variant="ghost" 
                      onClick={onSkip}
                      className="text-muted-foreground"
                    >
                      Skip for now
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="flex items-center gap-2"
                  >
                    {step === 2 ? "Complete" : "Next"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
