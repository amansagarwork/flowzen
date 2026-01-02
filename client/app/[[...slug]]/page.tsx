"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import TerminalWidget from '../components/TerminalWidget';
import InsightsPanel from '../components/InsightsPanel';
import Login from '../components/Login';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Bell, User, LogOut, Circle } from 'lucide-react';
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

const ContrastIcon = ({ className }: { className?: string }) => (
    <svg 
        className={className} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
    >
        <path d="M0 0h24v24H0z" fill="none" stroke="none"/>
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 3l0 18"/>
        <path d="M12 9l4.65 -4.65"/>
        <path d="M12 14.3l7.37 -7.37"/>
        <path d="M12 19.6l8.85 -8.85"/>
    </svg>
);

const CollapseIcon = ({ className }: { className?: string }) => (
    <svg 
        className={className} 
        viewBox="0 0 24 24" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="12" y1="3" x2="12" y2="21"></line>
    </svg>
);

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
    const [mounted, setMounted] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const { theme, setTheme } = useTheme();

    // Handle client-side mount
    useEffect(() => {
        setMounted(true);
        // Check localStorage on client-side mount
        const savedAuth = localStorage.getItem('flowzen-auth');
        if (savedAuth === 'true') {
            setIsLoggedIn(true);
        }
    }, []);

    // Save auth state to localStorage whenever it changes (only on client)
    useEffect(() => {
        if (mounted) {
            localStorage.setItem('flowzen-auth', isLoggedIn.toString());
        }
    }, [isLoggedIn, mounted]);

    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
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
        // Clear auth from localStorage (only on client)
        if (mounted) {
            localStorage.removeItem('flowzen-auth');
        }
        router.push('/');
    };

    const handleProfileClick = () => {
        if (!isLoggedIn) {
            router.push('/login');
        } else {
            router.push('/profile');
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

                        <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch gap-6 px-4 lg:px-6">
                            {/* Main Performance Chart */}
                            <div className="h-[380px] md:h-[420px] overflow-hidden">
                                <ChartAreaInteractive />
                            </div>

                            {/* Terminal Widget */}
                            <div className="h-[380px] md:h-[420px] overflow-hidden">
                                <TerminalWidget />
                            </div>
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
                        <TerminalWidget />
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

    // Render Login screen if on auth route or forced (only after mounted)
    if (mounted && (isAuthRoute || showLogin) && !isLoggedIn) {
        return (
            <Login
                onLogin={handleLogin}
                defaultMode={isSignupRoute ? "signup" : "login"}
            />
        );
    }

    return (
        <div className="flex bg-background h-screen w-full overflow-hidden text-foreground">
            {!isSidebarCollapsed && <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />}

            <main className={`flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-muted/10 ${isSidebarCollapsed ? 'ml-0' : ''}`}>
                <header className="flex justify-between items-center bg-background/50 p-4 border rounded-xl border-border">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={toggleSidebar} 
                            className="h-8 w-8 rounded-lg cursor-pointer"
                            title="Toggle sidebar"
                        >
                            <CollapseIcon className="h-4 w-4" />
                        </Button>
                        <div className="h-8 w-px bg-border"></div>
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
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-lg cursor-pointer">
                                        <ContrastIcon className="h-[1.2rem] w-[1.2rem]" />
                                        <span className="sr-only">Toggle theme</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="bg-background border-border text-foreground">
                                    <p>Toggle theme</p>
                                </TooltipContent>
                            </Tooltip>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg cursor-pointer">
                                <Bell className="h-4 w-4" />
                            </Button>

                            {!mounted ? (
                                <div className="h-9 w-9 rounded-lg animate-pulse bg-muted/50"></div>
                            ) : isLoggedIn ? (
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={handleProfileClick} className="h-9 w-9 rounded-lg cursor-pointer">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src="" alt="Profile" />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                                        TU
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-background border-border text-foreground">
                                            <div className="space-y-1 font-medium">
                                                <p className="font-semibold">Test User</p>
                                                <p className="text-xs text-muted-foreground">test@gmail.com</p>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer">
                                                <LogOut className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-background border-border text-foreground">
                                            <p>Logout</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </>
                            ) : (
                                <Button variant="ghost" size="icon" onClick={handleProfileClick} className="h-9 w-9 rounded-lg cursor-pointer">
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
