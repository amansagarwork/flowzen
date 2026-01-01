"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Terminal as TerminalIcon, Play, RefreshCw, Trash2, Lock, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Log {
    timestamp: string;
    level: string;
    message: string;
}

interface TerminalWidgetProps {
    isAuthorized?: boolean;
    onAuthorize?: () => void;
}

const TerminalWidget = ({ isAuthorized = false, onAuthorize }: TerminalWidgetProps) => {
    const [isMounted, setIsMounted] = useState(false);
    const [logs, setLogs] = useState<Log[]>([]);
    const [command, setCommand] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const fetchLogs = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/logs');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } catch (e) {
            console.error("Failed to fetch logs", e);
        }
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleKill = async () => {
        try {
            await fetch('http://localhost:5000/api/logs/clear', { method: 'POST' });
            fetchLogs();
        } catch (e) {
            console.error("Failed to clear logs", e);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim() || !isAuthorized) return;

        setLoading(true);
        try {
            await fetch('http://localhost:5000/api/action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ action: command })
            });
            setCommand('');
            fetchLogs();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="flex flex-col min-h-[600px] overflow-hidden border-border bg-card/50 relative">
            {/* Privacy Overlay - Only shows if mounted, NOT authorized, AND there are logs to protect */}
            {isMounted && !isAuthorized && logs.length > 0 && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/20 backdrop-blur-md rounded-xl border border-dashed border-primary/30 m-1">
                    <Card className="w-80 shadow-2xl border-primary/20 bg-card/90">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
                                <Lock className="w-6 h-6 text-primary" />
                            </div>
                            <CardTitle className="text-lg">Authorization Required</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center space-y-4">
                            <p className="text-xs text-muted-foreground">
                                Accessing the system terminal reveals sensitive PC information. Please authorize to execute commands and view logs.
                            </p>
                            <Button
                                onClick={onAuthorize}
                                className="w-full gap-2 font-semibold"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Unlock System Terminal
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}

            <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-medium">FlowZen Terminal</CardTitle>
                </div>

                <div className="flex items-center gap-1">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                title="Kill Terminal (Clear Logs)"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure you want to kill the terminal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently clear all logs from the terminal screen for the current session.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleKill} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                    Kill Terminal
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button variant="ghost" size="icon" onClick={fetchLogs} className="h-8 w-8" title="Refresh Logs">
                        <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className={cn("flex-1 p-0 overflow-hidden transition-all duration-500", !isAuthorized && "filter blur-sm pointer-events-none opacity-40")}>
                <ScrollArea className="h-[400px] font-mono text-xs p-4 overflow-auto">
                    <div className="space-y-1.5" ref={scrollRef}>
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-3 leading-relaxed group hover:bg-muted/30 px-2 py-0.5 rounded transition-colors whitespace-pre-wrap">
                                <span className="text-muted-foreground/50 shrink-0 select-none">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <Badge
                                    variant={log.level === 'ERROR' ? 'destructive' : log.level === 'CMD' ? 'outline' : log.level === 'WARN' ? 'secondary' : 'secondary'}
                                    className="px-1.5 py-0 h-4 text-[10px] font-bold uppercase tracking-wider"
                                >
                                    {log.level}
                                </Badge>
                                <span className={cn(
                                    "font-medium",
                                    log.level === 'ERROR' ? 'text-rose-400' :
                                        log.level === 'CMD' ? 'text-primary' :
                                            log.level === 'WARN' ? 'text-amber-400' :
                                                'text-muted-foreground'
                                )}>
                                    {log.message}
                                </span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>

            <CardFooter className={cn("p-3 border-t bg-muted/20 transition-all duration-500", !isAuthorized && "filter blur-sm pointer-events-none opacity-40")}>
                <form onSubmit={handleCommand} className="flex gap-2 w-full">
                    <div className="relative flex-1 group">
                        <TerminalIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Type a command..."
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            disabled={loading || !isAuthorized}
                            className="pl-8 bg-background/50 border-border focus:border-primary/50 h-9 text-sm"
                        />
                    </div>
                    <Button type="submit" size="sm" disabled={loading || !isAuthorized} className="h-9 px-4 font-semibold shadow-lg shadow-primary/10">
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
};

export default TerminalWidget;

