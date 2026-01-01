"use client";
import React from 'react';
import { LoginForm } from "@/components/login-form";
import { Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LoginProps {
    onLogin: () => void;
    defaultMode?: "login" | "signup";
}

const Login = ({ onLogin, defaultMode = "login" }: LoginProps) => {
    const router = useRouter();

    const handleModeChange = (newMode: "login" | "signup") => {
        router.push(`/${newMode}`);
    };

    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-background relative overflow-hidden">
            {/* Left Side: Premium Banner (Visible on Laptop Screens) */}
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
                {/* Extremely subtle overlay to ground the text without obscuring the 'Full View' artwork */}
                <div className="absolute inset-0 bg-zinc-950/5 pointer-events-none"></div>

                <div className="relative z-10 flex items-center gap-3 mb-8">
                    <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
                        <Zap className="w-6 h-6 text-white" fill="currentColor" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-zinc-950">FlowZen</span>
                </div>

                <blockquote className="relative z-10 space-y-2 max-w-lg">
                    <p className="text-lg font-medium text-zinc-950 italic">
                        &ldquo;Elevate your workflow with intelligent automation and real-time insights.&rdquo;
                    </p>
                    <footer className="text-sm text-zinc-600 font-medium">FlowZen Engineering Team</footer>
                </blockquote>

                {/* Subtle Glows */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
            </div>

            {/* Right Side: Centered Login Form */}
            <div className="flex items-center justify-center p-8 lg:p-12 relative bg-zinc-950/5 dark:bg-zinc-950/20">
                <div className="w-full max-w-md relative z-10">
                    <LoginForm
                        onLogin={onLogin}
                        defaultMode={defaultMode}
                        onModeChange={handleModeChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;
