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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Bell, User, LogOut, Circle, Folder, Heart, CheckCircle2, Clock, FolderPlus, ChevronLeft, Github, GitBranch, Trash2, AlertTriangle } from 'lucide-react';
import { AppleSpinner } from '@/components/ui/apple-spinner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { cn } from "@/lib/utils";
import { FlowZenMetrics } from '@/components/flowzen-metrics';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable, schema } from '@/components/data-table';
import { z } from 'zod';
import { useSession } from '../../contexts/SessionContext';
import { OnboardingFlow } from '../../components/OnboardingFlow';
import { CreateProjectModal } from "../../components/CreateProjectModal";
import { toast } from '@/lib/toast';
import { useAppDispatch, useAppSelector } from '@/lib/store/hooks';
import { setActiveProject } from '@/lib/store/projectSlice';

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
        <path d="M0 0h24v24H0z" fill="none" stroke="none" />
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3l0 18" />
        <path d="M12 9l4.65 -4.65" />
        <path d="M12 14.3l7.37 -7.37" />
        <path d="M12 19.6l8.85 -8.85" />
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
    const dispatch = useAppDispatch();
    const activeProject = useAppSelector((state) => state.project.activeProject);
    const {
        isLoggedIn,
        currentUser,
        terminalAuthorized,
        isLoading,
        login,
        logout,
        checkSession,
        completeOnboarding,
        skipOnboarding
    } = useSession();

    // Derive activeTab from URL slug
    const slugArray = params?.slug as string[] | undefined;
    const slug = slugArray?.[0] || 'dashboard';

    // Format slug for display and state mapping
    const activeTab = slug.charAt(0).toUpperCase() + slug.slice(1);

    const [mounted, setMounted] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
    const [userProjects, setUserProjects] = useState<any[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [isGitHubConnecting, setIsGitHubConnecting] = useState(false);
    const [githubRepos, setGithubRepos] = useState<any[]>([]);
    const [isReposLoading, setIsReposLoading] = useState(false);
    const [isRepoSelectorOpen, setIsRepoSelectorOpen] = useState(false);
    const [repoSearch, setRepoSearch] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState<any>(null);
    const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const { theme, setTheme } = useTheme();

    // Fetch projects when tab changes to Projects
    useEffect(() => {
        if (mounted && activeTab === 'Projects' && isLoggedIn) {
            fetchProjects();
        }
    }, [mounted, activeTab, isLoggedIn]);

    // Handle Deep Link / Page Refresh / Version Redirects for Projects
    useEffect(() => {
        const isProjectBase = slugArray && slugArray.length === 2 && slugArray[0] === 'projects';
        const isProjectWorkbench = slugArray && slugArray.length > 2 && slugArray[0] === 'projects';
        const projectName = slugArray?.[1];

        if (mounted && (isProjectWorkbench || isProjectBase) && projectName && isLoggedIn) {
            // Only fetch if we don't have the active project OR if we need to redirect from base
            if (!activeProject || isProjectBase) {
                fetchProjectByName(projectName, isProjectBase);
            }
        }
    }, [mounted, slugArray, activeProject?.id, isLoggedIn]);

    // Automatic Check-in when project is active
    useEffect(() => {
        const isProjectWorkbench = slugArray && slugArray.length > 2;
        const projectVersion = slugArray?.[2];

        if (mounted && isProjectWorkbench && activeProject && projectVersion && isLoggedIn) {
            // Only check-in if version or project changed
            checkInProject(activeProject.id, projectVersion);
        }
    }, [mounted, slugArray, activeProject?.id, isLoggedIn]);

    // Handle GitHub OAuth Callback
    useEffect(() => {
        const isGithubCallback = slugArray && slugArray[0] === 'github' && slugArray[1] === 'callback';
        const hasToken = typeof window !== 'undefined' && !!localStorage.getItem("flowzen_token");

        if (mounted && isGithubCallback) {
            console.log("🐙 GitHub Callback route detected. Token:", hasToken);
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');

            if (code && hasToken) {
                console.log("🐙 Triggering handleGithubCallback with code:", code.substring(0, 5) + "...");
                handleGithubCallback(code);
            } else if (!hasToken) {
                console.warn("⚠️ GitHub Callback detected but no FlowZen token found.");
                toast.error("Please log in to connect your GitHub account");
                router.push("/login");
            }
        }
    }, [mounted, slugArray, router]);

    const handleGithubCallback = async (code: string) => {
        const token = localStorage.getItem("flowzen_token");
        console.log("🐙 Starting handleGithubCallback. Code:", code);
        try {
            const response = await fetch("http://localhost:5000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation ConnectGithubAccount($code: String!) {
                            connectGithubAccount(code: $code) {
                                id
                                username
                                email
                                onboardingCompleted
                                githubUsername
                                githubConnected
                            }
                        }
                    `,
                    variables: { code }
                }),
            });

            const responseText = await response.text();
            console.log("🐙 Server Raw Response:", responseText);

            if (!responseText) {
                throw new Error("Empty response from server. Check server logs.");
            }

            const data = JSON.parse(responseText);
            if (data.errors) {
                console.error("🐙 GraphQL Errors:", data.errors);
                throw new Error(data.errors[0].message);
            }

            console.log("🐙 Success Data:", data.data.connectGithubAccount);
            toast.success(`Connected to GitHub as ${data.data.connectGithubAccount.githubUsername}`);

            // Update local storage session
            const currentUserData = JSON.parse(localStorage.getItem("flowzen_user") || "{}");
            const updatedUserData = { ...currentUserData, ...data.data.connectGithubAccount };
            localStorage.setItem("flowzen_user", JSON.stringify(updatedUserData));

            // Redirect to projects
            console.log("🐙 Redirecting to /projects...");
            window.location.href = "/projects";
        } catch (error: any) {
            console.error("🐙 handleGithubCallback Error:", error);
            toast.error(error.message || "Failed to connect GitHub account");
            // Stay here for a few seconds so user can see logs, then redirect if needed
            // window.location.href = "/projects";
        }
    };

    const fetchProjects = async () => {
        setProjectsLoading(true);
        try {
            const token = localStorage.getItem("flowzen_token");
            const response = await fetch("http://localhost:5000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
                        query {
                            projects {
                                id
                                name
                                description
                                status
                                health
                                updatedAt
                                currentVersion
                                lastAccessedAt
                                githubRepo
                                githubConnected
                            }
                        }
                    `
                })
            });
            const result = await response.json();
            if (result.data?.projects) {
                setUserProjects(result.data.projects);
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setProjectsLoading(false);
        }
    };

    const fetchProjectByName = async (name: string, shouldRedirect: boolean = false) => {
        try {
            const token = localStorage.getItem("flowzen_token");
            const response = await fetch("http://localhost:5000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
                        query GetProjectByName($name: String!) {
                            projectByName(name: $name) {
                                id
                                name
                                description
                                status
                                health
                                updatedAt
                                currentVersion
                                lastAccessedAt
                                githubRepo
                                githubConnected
                            }
                        }
                    `,
                    variables: { name }
                })
            });
            const result = await response.json();
            if (result.data?.projectByName) {
                const project = result.data.projectByName;
                dispatch(setActiveProject(project));

                // If we land on /projects/name, redirect to /projects/name/vX
                if (shouldRedirect) {
                    const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
                    const version = project.currentVersion || 'v1';
                    router.replace(`/projects/${projectSlug}/${version}`);
                }
            }
        } catch (error) {
            console.error("Failed to fetch project by name:", error);
        }
    };

    const checkInProject = async (id: string, version: string) => {
        try {
            const token = localStorage.getItem("flowzen_token");
            await fetch("http://localhost:5000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation CheckIn($id: ID!, $version: String!) {
                            checkInProject(id: $id, version: $version) {
                                id
                                lastAccessedAt
                                currentVersion
                            }
                        }
                    `,
                    variables: { id, version }
                })
            });
            // Quiet update, no need to refresh state unless we want to show lastAccessedAt live
        } catch (error) {
            console.error("Failed to check-in project:", error);
        }
    };

    const handleConnectGithub = async () => {
        setIsGitHubConnecting(true);
        try {
            const token = localStorage.getItem("flowzen_token");
            const response = await fetch("http://localhost:5000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `query { githubAuthUrl }`,
                }),
            });
            const data = await response.json();
            if (data.data?.githubAuthUrl) {
                window.location.href = data.data.githubAuthUrl;
                // Don't set state to false here to prevent flicker before redirect
                return;
            }
        } catch (error) {
            toast.error("Failed to initiate GitHub connection");
            setIsGitHubConnecting(false);
        }
    };

    const fetchGithubRepos = async () => {
        setIsReposLoading(true);
        try {
            const token = localStorage.getItem("flowzen_token");
            const response = await fetch("http://localhost:5000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
                        query { 
                            githubRepositories { 
                                id name fullName description url updatedAt 
                            } 
                        }
                    `,
                }),
            });
            const data = await response.json();
            if (data.data?.githubRepositories) {
                setGithubRepos(data.data.githubRepositories);
            }
        } catch (error) {
            toast.error("Failed to fetch repositories");
        } finally {
            setIsReposLoading(false);
        }
    };

    const handleLinkRepo = async (repoFullName: string) => {
        if (!activeProject) {
            console.error("🐙 No active project found for linking");
            return;
        }
        console.log(`🐙 Linking project ${activeProject.id} to repo ${repoFullName}`);
        try {
            const token = localStorage.getItem("flowzen_token");
            const response = await fetch("http://localhost:5000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation LinkProjectToGithub($projectId: ID!, $repoFullName: String!) {
                            linkProjectToGithub(projectId: $projectId, repoFullName: $repoFullName) {
                                id
                                githubRepo
                                githubConnected
                            }
                        }
                    `,
                    variables: { projectId: activeProject.id, repoFullName }
                }),
            });
            const data = await response.json();
            console.log("🐙 Link repo response:", data);

            if (data.errors) {
                console.error("🐙 Link repo GraphQL errors:", data.errors);
                throw new Error(data.errors[0].message);
            }

            if (data.data?.linkProjectToGithub) {
                const updated = data.data.linkProjectToGithub;
                console.log("🐙 Project linked successfully in backend:", updated);
                dispatch(setActiveProject({
                    ...activeProject,
                    githubRepo: updated.githubRepo,
                    githubConnected: updated.githubConnected
                }));
                toast.success("Repository linked successfully");
                setIsRepoSelectorOpen(false);
            }
        } catch (error: any) {
            console.error("🐙 Link repo Error:", error);
            toast.error(error.message || "Failed to link repository");
        }
    };

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem("flowzen_token");
            const response = await fetch("http://localhost:5000/graphql", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    query: `
                        mutation DeleteProject($id: ID!) {
                            deleteProject(id: $id)
                        }
                    `,
                    variables: { id: projectToDelete.id }
                }),
            });
            const data = await response.json();

            if (data.errors) throw new Error(data.errors[0].message);

            if (data.data?.deleteProject) {
                toast.success("Project deleted successfully");
                setUserProjects(userProjects.filter(p => p.id !== projectToDelete.id));
                setIsDeleteModalOpen(false);
                setProjectToDelete(null);
                setDeleteConfirmationInput("");

                // Redirect back to projects grid since we are likely in workbench
                router.push("/projects");
            }
        } catch (error: any) {
            console.error("🐙 Delete project Error:", error);
            toast.error(error.message || "Failed to delete project");
        } finally {
            setIsDeleting(false);
        }
    };

    // Handle client-side mount
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        setShouldShowOnboarding(localStorage.getItem('flowzen_pending_onboarding') === 'true');
    }, [mounted]);

    // Helper function to get user initials
    const getUserInitials = (name: string | null | undefined): string => {
        if (!name) return 'TU';
        return name.split(' ').map((word: string) => word[0]).join('').toUpperCase();
    };

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

    // If user is already logged in, never stay on auth routes
    useEffect(() => {
        if (mounted && isAuthRoute && isLoggedIn && !shouldShowOnboarding) {
            router.replace('/');
        }
    }, [mounted, isAuthRoute, isLoggedIn, shouldShowOnboarding, router]);

    const handleOnboardingComplete = async (username: string, projectInterests: string[]) => {
        try {
            await completeOnboarding(username, projectInterests);
            localStorage.removeItem('flowzen_pending_onboarding');
            setShouldShowOnboarding(false);
        } catch (error) {
            console.error('Onboarding failed:', error);
        }
    };

    const handleOnboardingSkip = () => {
        // User skipped onboarding, mark as completed locally so it doesn't re-open
        skipOnboarding();
        localStorage.removeItem('flowzen_pending_onboarding');
        setShouldShowOnboarding(false);
        router.push('/');
    };

    const handleLogin = (userData: { id: string; username: string | null; email: string; createdAt: string; onboardingCompleted: boolean; projectInterests: string[] }, token: string) => {
        login(userData, token);
        setShowLogin(false);

        // If we were on an auth route, go to dashboard
        if (isAuthRoute) {
            router.push('/');
        }
    };

    const handleProfileClick = () => {
        if (!isLoggedIn) {
            router.push('/login');
        } else {
            router.push('/profile');
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Redirect root to /dashboard
    useEffect(() => {
        if (mounted && !slugArray) {
            router.replace('/dashboard');
        }
    }, [mounted, slugArray, router]);

    const handleTabChange = (tab: string) => {
        const newSlug = `/${tab.toLowerCase()}`;
        router.push(newSlug);
    };

    const renderContent = () => {
        if (slugArray && slugArray[0] === 'github' && slugArray[1] === 'callback') {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-12 h-full">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
                        <AppleSpinner size="lg" className="text-primary relative z-10" />
                    </div>
                    <h2 className="text-xl font-bold mt-8 tracking-tight">Finalizing GitHub Connection</h2>
                    <p className="text-muted-foreground text-sm animate-pulse mt-2 max-w-[250px] text-center">
                        Securely syncing your account and repositories. This will only take a moment.
                    </p>
                </div>
            );
        }

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
                                <TerminalWidget autoFetch={false} />
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
            case 'Projects':
                // Check if we are in a sub-route (e.g., projects/my-project/v1)
                const isProjectBase = slugArray && slugArray.length === 2 && slugArray[0] === 'projects';
                const isProjectWorkbench = slugArray && slugArray.length > 2 && slugArray[0] === 'projects';
                const projectSlug = slugArray?.[1];
                const projectVersion = slugArray?.[2];

                // Show loading state while redirecting from base URL to latest version
                if (isProjectBase) {
                    return (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 h-full">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
                                <AppleSpinner size="lg" className="text-primary relative z-10" />
                            </div>
                            <h3 className="text-lg font-semibold mt-6 tracking-tight">Accessing Project</h3>
                            <p className="text-muted-foreground text-sm animate-pulse mt-1">Redirecting to your last updated version...</p>
                        </div>
                    );
                }

                if (isProjectWorkbench) {
                    return (
                        <div className="flex-1 flex flex-col gap-6 overflow-auto pr-2 custom-scrollbar pb-12 px-6">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.push('/projects')}
                                    className="h-8 w-8 rounded-lg"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-2xl font-bold tracking-tight">{activeProject?.name || projectSlug}</h2>
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                            {projectVersion}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground text-sm">
                                        {activeProject?.description || "Project workbench and version tracking."}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <Card className="border-border/40 bg-card/30 p-8">
                                        <h3 className="text-lg font-semibold mb-4">Version History</h3>
                                        <div className="space-y-4">
                                            {[
                                                { v: 'v1', status: 'Confirmed', date: 'Jan 3, 2026', note: 'Initial project setup and configuration.' },
                                                { v: 'v0.9-beta', status: 'Archived', date: 'Dec 28, 2025', note: 'Early testing and environment setup.' }
                                            ].map((history, i) => (
                                                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-muted/10 border border-border/20">
                                                    <div className="flex items-center gap-4">
                                                        <div className="font-mono text-sm font-bold text-primary">{history.v}</div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground">{history.date}</div>
                                                            <div className="text-sm">{history.note}</div>
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary" className="text-[10px] uppercase">
                                                        {history.status}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>

                                    <Card className="border-border/40 bg-card/30 p-8">
                                        <h3 className="text-lg font-semibold mb-4">Project Workbench</h3>
                                        <div className="flex flex-col items-center justify-center h-48 border border-dashed rounded-xl bg-muted/5">
                                            <p className="text-muted-foreground">Version {projectVersion} is currently active and tracked.</p>
                                            <Button variant="outline" className="mt-4" onClick={() => toast.info("Version confirmed. No upgrade needed.")}>
                                                Confirm Current Version
                                            </Button>
                                        </div>
                                    </Card>
                                </div>

                                <div className="space-y-6">
                                    <Card className="border-border/40 bg-card/30 p-6">
                                        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                            <Heart className="w-4 h-4 text-emerald-500" />
                                            System Health
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Status</span>
                                                <span className="text-emerald-500 font-medium">{activeProject?.health || 'Healthy'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Last Sync</span>
                                                <span>Just now</span>
                                            </div>
                                        </div>
                                    </Card>

                                    <Card className="border-border/40 bg-card/30 p-6">
                                        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                            <Github className="w-4 h-4" />
                                            GitHub Integration
                                        </h4>
                                        {activeProject?.githubConnected ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                                    <GitBranch className="w-3 h-3" />
                                                    <span className="truncate">{activeProject.githubRepo}</span>
                                                </div>
                                                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 space-y-3">
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-muted-foreground">Pipeline Status</span>
                                                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Passing</Badge>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-muted-foreground">Recent Commits</span>
                                                        <span className="font-mono text-[10px] bg-zinc-500/10 px-1.5 py-0.5 rounded">12 new</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-muted-foreground">Health Check</span>
                                                        <span className="text-emerald-500 font-medium text-[10px]">98% Accurate</span>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-muted-foreground">Active Bugs</span>
                                                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-500 border-amber-500/20">2 Pending</Badge>
                                                    </div>
                                                </div>
                                                <div className="pt-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full text-[11px] h-8 hover:bg-primary/5 hover:text-primary transition-colors"
                                                        onClick={() => {
                                                            const projectSlug = activeProject?.name.toLowerCase().replace(/\s+/g, '-') || slugArray?.[1];
                                                            router.push(`/projects/${projectSlug}/${projectVersion || 'v1'}/analytics`);
                                                        }}
                                                    >
                                                        Access Analytics Dashboard
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <p className="text-xs text-muted-foreground mb-4">
                                                    Connect your repository to enable code health monitoring and pipeline tracking.
                                                </p>

                                                {!currentUser?.githubConnected && !currentUser?.githubUsername ? (
                                                    <Button
                                                        size="sm"
                                                        className="w-full text-xs bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-zinc-800"
                                                        onClick={handleConnectGithub}
                                                        disabled={isGitHubConnecting}
                                                    >
                                                        {isGitHubConnecting ? (
                                                            <>
                                                                <AppleSpinner size="sm" className="mr-2" />
                                                                Initiating...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Github className="w-3 h-3 mr-2" />
                                                                Connect GitHub Account
                                                            </>
                                                        )}
                                                    </Button>
                                                ) : (
                                                    <Dialog open={isRepoSelectorOpen} onOpenChange={(open) => {
                                                        setIsRepoSelectorOpen(open);
                                                        if (open) fetchGithubRepos();
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                className="w-full text-xs bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white hover:bg-zinc-800"
                                                            >
                                                                <GitBranch className="w-3 h-3 mr-2" />
                                                                Select Repository
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/40">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                                                                    <Github className="w-5 h-5" />
                                                                    Link Repository
                                                                </DialogTitle>
                                                                <DialogDescription className="text-xs text-muted-foreground">
                                                                    Link your "{activeProject?.name}" project to a GitHub repository to start monitoring.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <div className="space-y-4 py-2">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                                                    <Input
                                                                        placeholder="Search repositories..."
                                                                        className="pl-8 h-9 text-sm bg-muted/20 border-border/40"
                                                                        value={repoSearch}
                                                                        onChange={(e) => setRepoSearch(e.target.value)}
                                                                    />
                                                                </div>
                                                                <ScrollArea className="h-64 rounded-md border border-border/40 bg-muted/5 p-2">
                                                                    {isReposLoading ? (
                                                                        <div className="h-full flex flex-col items-center justify-center gap-3">
                                                                            <AppleSpinner size="md" />
                                                                            <span className="text-xs text-muted-foreground animate-pulse">Fetching your repositories...</span>
                                                                        </div>
                                                                    ) : githubRepos.filter(r => r.fullName.toLowerCase().includes(repoSearch.toLowerCase())).length > 0 ? (
                                                                        <div className="space-y-1">
                                                                            {githubRepos
                                                                                .filter(r => r.fullName.toLowerCase().includes(repoSearch.toLowerCase()))
                                                                                .map((repo) => (
                                                                                    <div
                                                                                        key={repo.id}
                                                                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/5 group cursor-pointer transition-all border border-transparent hover:border-primary/10"
                                                                                        onClick={() => handleLinkRepo(repo.fullName)}
                                                                                    >
                                                                                        <div className="flex flex-col min-w-0">
                                                                                            <span className="text-sm font-medium truncate group-hover:text-primary transition-colors">{repo.name}</span>
                                                                                            <span className="text-[10px] text-muted-foreground truncate">{repo.fullName}</span>
                                                                                        </div>
                                                                                        <Button size="sm" variant="ghost" className="h-7 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                            Link
                                                                                        </Button>
                                                                                    </div>
                                                                                ))}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                                                            <Circle className="w-8 h-8 text-muted-foreground/20 mb-2" />
                                                                            <p className="text-sm font-medium text-muted-foreground">No repositories found</p>
                                                                            <p className="text-xs text-muted-foreground/60">Try searching for a different name.</p>
                                                                        </div>
                                                                    )}
                                                                </ScrollArea>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                )}
                                            </div>
                                        )}
                                    </Card>

                                    <Card className="border-border/40 bg-card/30 p-6">
                                        <h4 className="text-sm font-semibold mb-4">Active Modules</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="secondary">Analyzer</Badge>
                                            <Badge variant="secondary">Scanner</Badge>
                                            <Badge variant="secondary">Monitor</Badge>
                                        </div>
                                    </Card>

                                    <Card className="border-destructive/20 bg-destructive/5 p-6 mt-6">
                                        <div className="flex items-center gap-2 text-destructive mb-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            <h4 className="text-sm font-semibold">Danger Zone</h4>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Delete this project</p>
                                                <p className="text-[10px] text-muted-foreground/60">Once you delete a project, there is no going back. Please be certain.</p>
                                            </div>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-8 text-xs shrink-0"
                                                onClick={() => {
                                                    setProjectToDelete(activeProject);
                                                    setIsDeleteModalOpen(true);
                                                }}
                                            >
                                                Delete project
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div className="flex-1 flex flex-col gap-6 overflow-auto pr-2 custom-scrollbar pb-12 px-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">Active Projects</h2>
                                <p className="text-muted-foreground text-sm">Monitor health and status across all your repositories.</p>
                            </div>
                            <Button onClick={() => setIsCreateProjectOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                                <FolderPlus className="w-4 h-4" />
                                Create New Project
                            </Button>
                        </div>

                        {projectsLoading ? (
                            <div className="flex-1 flex items-center justify-center h-64">
                                <AppleSpinner size="lg" className="text-primary" />
                            </div>
                        ) : userProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {userProjects.map((project) => (
                                    <Card
                                        key={project.id}
                                        onClick={() => {
                                            dispatch(setActiveProject(project));
                                            const projectSlug = project.name.toLowerCase().replace(/\s+/g, '-');
                                            router.push(`/projects/${projectSlug}/v1`);
                                        }}
                                        className="border-border/40 bg-card/30 hover:bg-card/50 transition-all group cursor-pointer overflow-hidden border p-8 flex flex-col justify-between min-h-[220px]"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-1">
                                                    <Folder className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors leading-none">{project.name}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px] leading-relaxed">
                                                        {project.description || "No description provided"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <Badge variant="outline" className={cn(
                                                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5",
                                                    project.health === 'Healthy' ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500" :
                                                        project.health === 'At Risk' ? "border-amber-500/20 bg-amber-500/10 text-amber-500" :
                                                            "border-red-500/20 bg-red-500/10 text-red-500"
                                                )}>
                                                    {project.health}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-6">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                                                <Clock className="w-4 h-4" />
                                                <span>Updated {new Date(parseInt(project.updatedAt)).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
                                                <span className="font-medium">{project.status}</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/5 p-12 text-center h-64">
                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <Folder className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">No projects found</h3>
                                <p className="text-muted-foreground max-w-xs mx-auto mb-6">Start tracking your project's health and bugs by creating your first project.</p>
                                <Button onClick={() => setIsCreateProjectOpen(true)} variant="outline">Create Your First Project</Button>
                            </div>
                        )}

                        <CreateProjectModal
                            open={isCreateProjectOpen}
                            onOpenChange={setIsCreateProjectOpen}
                            onSuccess={fetchProjects}
                        />
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

    // Show loading spinner while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center flex flex-col items-center">
                    <AppleSpinner size="lg" className="text-primary" />
                    <p className="mt-4 text-muted-foreground font-medium">Verifying session...</p>
                </div>
            </div>
        );
    }

    // Don't render main content until authentication is checked
    if (!mounted || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center flex flex-col items-center">
                    <AppleSpinner size="lg" className="text-primary" />
                    <p className="mt-4 text-muted-foreground font-medium">Loading application...</p>
                </div>
            </div>
        );
    }

    // Render Login screen if on auth route or forced (only after mounted)
    if ((isAuthRoute || showLogin) && !isLoggedIn) {
        return (
            <Login
                onLogin={handleLogin}
                defaultMode={isSignupRoute ? "signup" : "login"}
            />
        );
    }

    // If logged in user is on auth route, wait for redirect
    if (isAuthRoute && isLoggedIn) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center flex flex-col items-center">
                    <AppleSpinner size="lg" className="text-primary" />
                    <p className="mt-4 text-muted-foreground font-medium">Redirecting...</p>
                </div>
            </div>
        );
    }

    // Show onboarding only right after signup (pending flag)
    if (shouldShowOnboarding && isLoggedIn && currentUser) {
        return (
            <OnboardingFlow
                onComplete={handleOnboardingComplete}
                onSkip={handleOnboardingSkip}
            />
        );
    }

    return (
        <div className="flex bg-background h-screen w-full overflow-hidden text-foreground">
            <div className={cn(
                "transition-all duration-300 ease-in-out overflow-hidden border-r border-border bg-background/50 backdrop-blur-sm",
                isSidebarCollapsed ? "w-0 opacity-0" : "w-64 opacity-100"
            )}>
                <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            <main className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-muted/10 relative">
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
                                {activeTab === 'Dashboard' ? 'Dashboard' : activeTab}
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
                                            <Button variant="ghost" size="icon" onClick={handleProfileClick} className="h-8 w-8 rounded-full cursor-pointer p-0">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={currentUser?.avatarUrl || ""} alt={currentUser?.username || "Profile"} />
                                                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                                        {currentUser?.username ? getUserInitials(currentUser.username) : 'TU'}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-background border-border text-foreground">
                                            <div className="space-y-1 font-medium">
                                                <p className="font-semibold">{currentUser?.username || 'Test User'}</p>
                                                <p className="text-xs text-muted-foreground">{currentUser?.email || 'test@gmail.com'}</p>
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


                        </div>
                    </div>
                </header>

                {renderContent()}

                {/* Delete Project Confirmation Dialog - Available globally */}
                <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
                    setIsDeleteModalOpen(open);
                    if (!open) {
                        setDeleteConfirmationInput("");
                        setProjectToDelete(null);
                    }
                }}>
                    <DialogContent className="sm:max-w-[400px] border-border/40 bg-background/95 backdrop-blur-xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-destructive">
                                <AlertTriangle className="h-5 w-5" />
                                Delete Project
                            </DialogTitle>
                            <DialogDescription className="pt-2 text-xs">
                                This action <span className="font-bold">cannot</span> be undone. This will permanently delete the
                                <span className="font-bold text-foreground mx-1">"{projectToDelete?.name}"</span> project and all its data.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-3 py-4">
                            <p className="text-[11px] text-muted-foreground uppercase font-bold tracking-wider">
                                Please type <span className="text-foreground">"{projectToDelete?.name}"</span> to confirm.
                            </p>
                            <Input
                                placeholder="Type project name here"
                                value={deleteConfirmationInput}
                                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                                className="h-9 text-sm bg-muted/20 border-border/40"
                                autoFocus
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsDeleteModalOpen(false)}
                                disabled={isDeleting}
                                className="h-9 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDeleteProject}
                                disabled={isDeleting || deleteConfirmationInput !== projectToDelete?.name}
                                className="h-9 text-xs gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <AppleSpinner size="sm" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Delete Project
                                    </>
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
