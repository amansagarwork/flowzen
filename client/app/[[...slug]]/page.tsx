"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import TerminalWidget from '../components/TerminalWidget';
import InsightsPanel from '../components/InsightsPanel';
import Login from '../components/Login';
import { Badge } from '@/components/ui/badge';
import { Search, Bell, User, Sun, Moon, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { FlowZenMetrics } from '@/components/flowzen-metrics';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable, schema } from '@/components/data-table';
import { z } from 'zod';

const sampleData: z.infer<typeof schema>[] = [
    { id: 1, header: "Refactor suggested in auth.ts", type: "Code Quality", status: "In Progress", target: "Improve", limit: "N/A", reviewer: "AI Analyzer" },
    { id: 2, header: "Dependencies outdated: 2 found", type: "Security", status: "Pending", target: "Update", limit: "Critical", reviewer: "Dependency Bot" },
    { id: 3, header: "Test coverage improved by +5%", type: "Quality", status: "Done", target: "87%", limit: "80%", reviewer: "CI Pipeline" },
    { id: 4, header: "Bundle size optimized", type: "Performance", status: "Done", target: "< 500KB", limit: "600KB", reviewer: "Build Agent" },
    { id: 5, header: "API response time check", type: "Performance", status: "Done", target: "< 200ms", limit: "500ms", reviewer: "Monitor" },
];

export default function Home() {
    const params = useParams();
    const router = useRouter();
    const pathname = usePathname();

    // Derive activeTab from URL slug
    // params.slug is an array: [] for /, ['console'] for /console, etc.
    const slugArray = params?.slug as string[] | undefined;
    const slug = slugArray?.[0] || 'dashboard';

    // Format slug for display and state mapping
    const activeTab = slug.charAt(0).toUpperCase() + slug.slice(1);

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [terminalAuthorized, setTerminalAuthorized] = useState(false);
    const { theme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    // Check if we are in an auth route
    const isLoginRoute = slug === 'login';
    const isSignupRoute = slug === 'signup';
    const isAuthRoute = isLoginRoute || isSignupRoute;

    const handleLogin = () => {
        setIsLoggedIn(true);
        setShowLogin(false);
        // If we were on an auth route, go to dashboard
        if (isAuthRoute) {
            router.push('/');
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setTerminalAuthorized(false);
        router.push('/');
    };

    const handleProfileClick = () => {
        if (!isLoggedIn) {
            router.push('/login');
        }
    };

    const handleTabChange = (tab: string) => {
        const newSlug = tab.toLowerCase() === 'dashboard' ? '/' : `/${tab.toLowerCase()}`;
        router.push(newSlug);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard':
                return (
                    <div className="flex-1 flex flex-col gap-6 overflow-auto pr-2 custom-scrollbar pb-12">
                        {/* High-level metrics */}
                        <FlowZenMetrics />

                        <div className="grid grid-cols-1 lg:grid-cols-0 gap-6 px-4 lg:px-6">
                            {/* Main Performance Chart */}
                            <div className="min-h-[350px]">
                                <ChartAreaInteractive />
                            </div>

                            {/* Terminal Widget */}
                            {/* <div className="min-h-[350px]">
                                <TerminalWidget
                                    isAuthorized={terminalAuthorized}
                                    onAuthorize={() => setTerminalAuthorized(true)}
                                />
                            </div> */}
                        </div>

                        {/* Recent Activity / System Logs */}
                        <div className="bg-background rounded-xl border border-border pb-10 mx-4 lg:mx-6">
                            <div className="p-6 border-b border-border mb-4">
                                <h3 className="text-lg font-semibold">Project Insights</h3>
                                <p className="text-sm text-muted-foreground">AI-powered recommendations and code quality analysis.</p>
                            </div>
                            <div className="px-0">
                                <DataTable data={sampleData} />
                            </div>
                        </div>
                    </div>
                );
            case 'Console':
                return (
                    <div className="flex-1 h-full min-h-0">
                        <TerminalWidget
                            isAuthorized={terminalAuthorized}
                            onAuthorize={() => setTerminalAuthorized(true)}
                        />
                    </div>
                );
            case 'Insights':
                return (
                    <div className="flex-1 h-full min-h-0">
                        <InsightsPanel />
                    </div>
                );
            default:
                return (
                    <div className="flex-1 flex items-center justify-center border border-dashed rounded-xl bg-muted/5">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold mb-2">{activeTab} Section</h2>
                            <p className="text-muted-foreground">This module is currently under development.</p>
                        </div>
                    </div>
                );
        }
    };

    // Render Login screen if on auth route or forced
    if ((isAuthRoute || showLogin) && !isLoggedIn) {
        return (
            <Login
                onLogin={handleLogin}
                defaultMode={isSignupRoute ? "signup" : "login"}
            />
        );
    }

    return (
        <div className="flex bg-background h-screen w-full overflow-hidden text-foreground">
            <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />

            <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-muted/10">
                <header className="flex justify-between items-center bg-background/50 p-4 border rounded-xl border-border">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">
                                {activeTab === 'Dashboard' ? 'System Metrics' : activeTab}
                            </h1>
                            <p className="text-muted-foreground text-xs">
                                {activeTab === 'Dashboard' ? 'Real-time automation monitoring' : `Viewing ${activeTab.toLowerCase()} data`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="relative w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search console..."
                                className="pl-9 h-9 bg-background/50 border-border"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-lg">
                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg">
                                <Bell className="h-4 w-4" />
                            </Button>

                            {isLoggedIn ? (
                                <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button variant="ghost" size="icon" onClick={handleProfileClick} className="h-9 w-9 rounded-lg">
                                    <User className="h-4 w-4" />
                                </Button>
                            )}

                            <Badge variant="outline" className="gap-2 px-3 py-1.5 font-mono text-[10px] border-emerald-500/20 bg-emerald-500/5 text-black dark:text-white ml-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                ONLINE
                            </Badge>
                        </div>
                    </div>
                </header>

                {renderContent()}
            </main>
        </div>
    );
}
