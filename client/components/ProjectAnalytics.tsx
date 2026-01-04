"use client"

import * as React from "react"
import {
    Area,
    AreaChart,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    XAxis,
    YAxis,
} from "recharts"
import {
    Activity,
    ArrowUpRight,
    Clock,
    Globe,
    Zap,
    AlertCircle,
    Server,
    Monitor,
    Tablet,
    ChevronRight,
    RefreshCw,
    Search,
    Filter,
    Shield,
    Play,
    Settings,
    Save,
    Lock
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"

const chartConfig = {
    requests: {
        label: "Total Requests",
        color: "var(--primary)",
    },
    errors: {
        label: "Errors",
        color: "var(--destructive)",
    },
} satisfies ChartConfig;

interface AnalyticsSummary {
    totalRequests: number;
    errors: number;
    avgLatency: number;
}

interface CodeQualityReport {
    id: string;
    score: number;
    rating: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    coverage: number;
    duplications: number;
    gateStatus: "PASSED" | "FAILED";
    codeSmells: number;
    vulnerabilities: number;
}

interface AnalyticsData {
    timeSeries: any[];
    summary: AnalyticsSummary;
    raw: any[];
}

export function ProjectAnalytics({ projectName, version, projectId }: { projectName: string, version: string, projectId: string }) {
    const [data, setData] = React.useState<AnalyticsData | null>(null);
    const [qualityReport, setQualityReport] = React.useState<CodeQualityReport | null>(null);
    const [isLive, setIsLive] = React.useState(true);
    const [loading, setLoading] = React.useState(true);
    const [scanning, setScanning] = React.useState(false);

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [jenkinsConfig, setJenkinsConfig] = React.useState({
        jenkinsUrl: "",
        jenkinsJob: "",
        jenkinsUser: "",
        jenkinsToken: "",
        scanMode: "JENKINS"
    });
    const [savingSettings, setSavingSettings] = React.useState(false);

    const fetchData = React.useCallback(async () => {
        if (!projectId) return;
        try {
            // Fetch Analytics
            const res = await fetch(`http://localhost:5000/api/analytics/${projectId}`);
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }

            // Fetch Latest Quality Report
            const qRes = await fetch(`http://localhost:5000/api/quality/${projectId}`);
            if (qRes.ok) {
                const qJson = await qRes.json();
                if (qJson) setQualityReport(qJson);
            }

            // Fetch Project Settings (for pre-filling UI)
            const pRes = await fetch(`http://localhost:5000/api/projects/${projectId}`);
            if (pRes.ok) {
                const project = await pRes.json();
                setJenkinsConfig(prev => ({
                    ...prev,
                    jenkinsUrl: project.jenkinsUrl || "",
                    jenkinsJob: project.jenkinsJob || "",
                    jenkinsUser: project.jenkinsUser || "",
                    jenkinsToken: project.jenkinsToken || "",
                    scanMode: project.scanMode || "JENKINS"
                }));
            }

        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    const runQualityScan = async () => {
        setScanning(true);
        try {
            const res = await fetch('http://localhost:5000/api/quality/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId })
            });
            if (res.ok) {
                const report = await res.json();
                setQualityReport(report);
            }
        } catch (error) {
            console.error("Scan failed", error);
        } finally {
            setScanning(false);
        }
    };

    const [testingConnection, setTestingConnection] = React.useState(false);
    const [connectionStatus, setConnectionStatus] = React.useState<{ success: boolean; message: string } | null>(null);

    const checkConnection = async () => {
        setTestingConnection(true);
        setConnectionStatus(null);
        try {
            const res = await fetch('http://localhost:5000/api/projects/test-jenkins', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jenkinsConfig)
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setConnectionStatus({ success: true, message: data.message });
            } else {
                setConnectionStatus({ success: false, message: data.error || "Connection failed" });
            }
        } catch (error) {
            setConnectionStatus({ success: false, message: "Network error" });
        } finally {
            setTestingConnection(false);
        }
    };

    const saveSettings = async () => {
        setSavingSettings(true);
        try {
            const res = await fetch(`http://localhost:5000/api/projects/${projectId}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jenkinsConfig)
            });
            if (res.ok) {
                setIsSettingsOpen(false);
            }
        } catch (error) {
            console.error("Failed to save settings", error);
        } finally {
            setSavingSettings(false);
        }
    };

    // Initial Fetch
    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Live Sync
    React.useEffect(() => {
        if (!isLive) return;
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [isLive, fetchData]);

    // SIMULATION DRIVER: Generates traffic when dashboard is open
    React.useEffect(() => {
        if (!isLive || !projectId) return;

        const simulateTraffic = async () => {
            if (Math.random() > 0.7) return; // 30% chance to send a batch request

            try {
                const endpoints = ["/api/v1/users", "/api/auth/login", "/dashboard", "/settings", "/api/data"];
                const methods = ["GET", "POST", "PUT"];
                const statuses = [200, 200, 200, 201, 400, 500, 200];

                const payload = {
                    projectId,
                    path: endpoints[Math.floor(Math.random() * endpoints.length)],
                    method: methods[Math.floor(Math.random() * methods.length)],
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    latency: Math.floor(Math.random() * 200) + 20,
                    region: ["US", "DE", "IN", "GB", "JP", "FR"][Math.floor(Math.random() * 6)],
                    userAgent: "Mozilla/5.0..."
                };

                await fetch('http://localhost:5000/api/analytics/ingest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } catch (e) {
                // Silent fail for simulation
            }
        };

        const interval = setInterval(simulateTraffic, 2000);
        return () => clearInterval(interval);
    }, [isLive, projectId]);

    const displayData = data?.timeSeries || [];
    const summary = data?.summary || { totalRequests: 0, errors: 0, avgLatency: 0 };
    const logs = data?.raw || [];

    return (
        <div className="flex-1 flex flex-col gap-8 overflow-auto custom-scrollbar pb-12 animate-in fade-in duration-500">
            {/* Header with breadcrumbs and live toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <span>Projects</span>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-foreground font-medium">{projectName}</span>
                        <ChevronRight className="w-3 h-3" />
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 h-5 px-1.5 font-mono">
                            {version}
                        </Badge>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Real-time Analytics</h2>
                    <p className="text-muted-foreground">Monitoring infrastructure performance and traffic patterns.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-9 gap-2">
                        <Filter className="w-3.5 h-3.5" />
                        Filters
                    </Button>
                    <Button
                        variant={isLive ? "default" : "outline"}
                        size="sm"
                        className={cn("h-9 gap-2", isLive && "bg-emerald-500 hover:bg-emerald-600 border-none shadow-lg shadow-emerald-500/20")}
                        onClick={() => setIsLive(!isLive)}
                    >
                        <RefreshCw className={cn("w-3.5 h-3.5", isLive && "animate-spin")} />
                        {isLive ? "Live Syncing" : "Go Live"}
                    </Button>
                </div>
            </div>

            {/* KPI Overviews */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Requests", value: summary.totalRequests.toLocaleString(), sub: "Live count", icon: Activity, color: "text-blue-500" },
                    { label: "Average Latency", value: `${summary.avgLatency}ms`, sub: "Real-time avg", icon: Zap, color: "text-amber-500" },
                    { label: "P95 Latency", value: `${Math.round(summary.avgLatency * 1.5)}ms`, sub: "Estimated", icon: Clock, color: "text-indigo-500" },
                    { label: "Error Rate", value: summary.totalRequests ? ((summary.errors / summary.totalRequests) * 100).toFixed(2) + "%" : "0%", sub: `${summary.errors} errors`, icon: AlertCircle, color: "text-destructive" },
                ].map((kpi, i) => (
                    <Card key={i} className="border-border/40 bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-2 rounded-lg bg-background border border-border/50", kpi.color)}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-bold uppercase">
                                    Healthy
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-2xl font-bold">{kpi.value}</h3>
                                    <span className="text-[10px] font-medium text-emerald-500 flex items-center gap-0.5">
                                        <ArrowUpRight className="w-3 h-3" />
                                        {kpi.sub}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Code Quality & Security */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-1 md:col-span-2 border-border/40 bg-card/30 backdrop-blur-xl">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-500" />
                                Code Quality & Security
                            </CardTitle>
                            <CardDescription>
                                {jenkinsConfig.scanMode === 'JENKINS'
                                    ? "Static analysis results from Jenkins Pipeline"
                                    : "Real-time analysis via Native JS Scanner"}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Settings className="w-4 h-4" />
                                        Configure
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                        <DialogTitle>CI/CD Configuration</DialogTitle>
                                        <DialogDescription>
                                            {jenkinsConfig.scanMode === 'JENKINS'
                                                ? "The leading open source automation server, Jenkins provides hundreds of plugins to support building, deploying and automating any project."
                                                : "Native JS Scanner uses ESLint and jscpd to analyze your code quality directly within FlowZen, with no external server required."}
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="flex p-1 bg-muted/30 rounded-lg mb-2">
                                        <button
                                            onClick={() => setJenkinsConfig({ ...jenkinsConfig, scanMode: 'JENKINS' })}
                                            className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                                                jenkinsConfig.scanMode === 'JENKINS' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                        >
                                            Jenkins CI
                                        </button>
                                        <button
                                            onClick={() => setJenkinsConfig({ ...jenkinsConfig, scanMode: 'NATIVE' })}
                                            className={cn("flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                                                jenkinsConfig.scanMode === 'NATIVE' ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                        >
                                            Native Scanner
                                        </button>
                                    </div>

                                    <div className="grid gap-4 py-4">
                                        {jenkinsConfig.scanMode === 'JENKINS' ? (
                                            <>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="url">Jenkins URL</Label>
                                                    <Input
                                                        id="url"
                                                        placeholder="http://jenkins.example.com:8080"
                                                        value={jenkinsConfig.jenkinsUrl}
                                                        onChange={(e) => setJenkinsConfig({ ...jenkinsConfig, jenkinsUrl: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label htmlFor="job">Job Name</Label>
                                                    <Input
                                                        id="job"
                                                        placeholder="my-project-pipeline"
                                                        value={jenkinsConfig.jenkinsJob}
                                                        onChange={(e) => setJenkinsConfig({ ...jenkinsConfig, jenkinsJob: e.target.value })}
                                                    />
                                                </div>
                                                <div className="grid grid-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="user">Username</Label>
                                                        <Input
                                                            id="user"
                                                            value={jenkinsConfig.jenkinsUser}
                                                            onChange={(e) => setJenkinsConfig({ ...jenkinsConfig, jenkinsUser: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="token">API Token</Label>
                                                        <div className="relative">
                                                            <Input
                                                                id="token"
                                                                type="password"
                                                                value={jenkinsConfig.jenkinsToken}
                                                                onChange={(e) => setJenkinsConfig({ ...jenkinsConfig, jenkinsToken: e.target.value })}
                                                            />
                                                            <Lock className="w-4 h-4 absolute right-3 top-3 text-muted-foreground opacity-50" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="py-8 text-center flex flex-col items-center gap-3">
                                                <div className="p-3 rounded-full bg-indigo-500/10 text-indigo-500">
                                                    <Activity className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="font-bold">Native Scanner Ready</p>
                                                    <p className="text-xs text-muted-foreground max-w-[250px] mx-auto mt-1">
                                                        Analysis will be performed using ESLint and JS Copy-Paste Detector.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {connectionStatus && (
                                        <div className={cn("text-xs font-medium px-4 py-2 rounded-md mb-4 flex items-center gap-2",
                                            connectionStatus.success ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive")}>
                                            {connectionStatus.success ? <Shield className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                            {connectionStatus.message}
                                        </div>
                                    )}
                                    <DialogFooter className="gap-2 sm:gap-0">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={checkConnection}
                                            disabled={testingConnection || jenkinsConfig.scanMode === 'NATIVE'}
                                        >
                                            {testingConnection ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
                                            Test Connection
                                        </Button>
                                        <Button
                                            onClick={saveSettings}
                                            disabled={savingSettings}
                                        >
                                            {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                            Save Configuration
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={scanning}
                                onClick={runQualityScan}
                                className="gap-2"
                            >
                                {scanning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                                {scanning ? "Running Analysis..." : "Run Analysis"}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {qualityReport ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-red-500">{qualityReport.critical}</span>
                                    <span className="text-xs uppercase font-bold text-red-500/80 mt-1">Blocked</span>
                                </div>
                                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-orange-500">{qualityReport.high}</span>
                                    <span className="text-xs uppercase font-bold text-orange-500/80 mt-1">High</span>
                                </div>
                                <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-yellow-500">{qualityReport.medium}</span>
                                    <span className="text-xs uppercase font-bold text-yellow-500/80 mt-1">Medium</span>
                                </div>
                                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-bold text-blue-500">{qualityReport.low}</span>
                                    <span className="text-xs uppercase font-bold text-blue-500/80 mt-1">Low</span>
                                </div>
                            </div>
                        ) : (
                            <div className="h-32 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
                                No quality report available. Run a scan to analyze.
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/40 bg-card/30 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle className="text-lg">SonarQube Metrics</CardTitle>
                        <CardDescription>Quality Gate Status</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {qualityReport ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-muted-foreground">Rating</span>
                                        <span className={cn(
                                            "text-4xl font-bold",
                                            qualityReport.rating === 'A' ? "text-emerald-500" :
                                                qualityReport.rating === 'B' ? "text-blue-500" : "text-amber-500"
                                        )}>{qualityReport.rating}</span>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className={cn(
                                            "px-3 py-1 text-sm font-bold uppercase",
                                            qualityReport.gateStatus === 'PASSED' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-destructive/10 text-destructive border-destructive/20"
                                        )}>
                                            {qualityReport.gateStatus}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>Coverage</span>
                                            <span className="font-mono">{qualityReport.coverage}%</span>
                                        </div>
                                        <Progress value={qualityReport.coverage} className="h-1.5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs">
                                            <span>Duplications</span>
                                            <span className="font-mono">{qualityReport.duplications}%</span>
                                        </div>
                                        <Progress value={qualityReport.duplications} className="h-1.5 bg-muted/20" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2">
                                        <div className="p-2 rounded bg-muted/20 text-center">
                                            <div className="text-lg font-bold">{qualityReport.codeSmells}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground">Code Smells</div>
                                        </div>
                                        <div className="p-2 rounded bg-muted/20 text-center">
                                            <div className="text-lg font-bold">{qualityReport.vulnerabilities}</div>
                                            <div className="text-[10px] uppercase text-muted-foreground">Vulnerabilities</div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground opacity-50">
                                <Shield className="w-8 h-8" />
                                <span className="text-sm">Not Analyzed</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Request Throughput Chart */}
                <Card className="lg:col-span-2 border-border/40 bg-card/30 backdrop-blur-xl h-[450px] flex flex-col">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>Request Throughput</CardTitle>
                                <CardDescription>Live monitoring of incoming traffic (req/min)</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded-md">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    Requests
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2 py-1 rounded-md">
                                    <div className="w-2 h-2 rounded-full bg-destructive" />
                                    Errors
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-0 pt-4">
                        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                            <AreaChart data={displayData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-requests)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--color-requests)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
                                <XAxis
                                    dataKey="time"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                    tickMargin={12}
                                    minTickGap={20}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Area
                                    type="monotone"
                                    dataKey="requests"
                                    stroke="var(--color-requests)"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRequests)"
                                    animationDuration={1000}
                                />
                            </AreaChart>
                        </ChartContainer>
                    </CardContent>
                </Card>

                {/* Global Distribution */}
                <Card className="border-border/40 bg-card/30 backdrop-blur-xl flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="w-4 h-4 text-primary" />
                            Global Distribution
                        </CardTitle>
                        <CardDescription>Traffic by geographic region</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                        <div className="space-y-6 pt-2">
                            {[
                                { name: "United States", value: 65 },
                                { name: "Europe", value: 25 },
                                { name: "Asia", value: 10 },
                            ].map((country, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-3">
                                            <span className="font-medium">{country.name}</span>
                                        </div>
                                        <span className="text-muted-foreground font-mono">{country.value}%</span>
                                    </div>
                                    <Progress value={country.value} className="h-1.5" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logs */}
            <Card className="border-border/40 bg-card/30 backdrop-blur-xl flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Server className="w-4 h-4" />
                            Infrastructure Logs
                        </CardTitle>
                        <CardDescription>Streaming logs from node-cluster-01</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="h-[300px] overflow-auto p-6 font-mono text-[11px] space-y-2 custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="text-muted-foreground text-center pt-20">Waiting for verified traffic...</div>
                    ) : (
                        logs.map((log: any, i: number) => (
                            <div key={i} className="flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
                                <span className="text-muted-foreground shrink-0 select-none">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                                <span className={cn("shrink-0 font-bold uppercase", log.status >= 400 ? "text-red-500" : "text-emerald-500")}>
                                    {log.method}
                                </span>
                                <span className="text-foreground leading-relaxed">
                                    {log.path} - {log.status} ({log.latency}ms)
                                </span>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
