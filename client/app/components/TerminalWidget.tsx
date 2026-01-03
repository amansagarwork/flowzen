"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Terminal as TerminalIcon,
  Play,
  RefreshCw,
  Trash2,
  ArrowDown,
  ExternalLink,
  Shield,
  ShieldOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

/* ---------------- TYPES ---------------- */

interface Log {
  timestamp: string;
  level: "INFO" | "ERROR" | "CMD" | "WARN";
  message: string;
}

/* ---------------- COMPONENT ---------------- */

export default function TerminalWidget({
  autoFetch = true,
  pollIntervalMs = 8000,
  focusedPollIntervalMs = 2000,
  pauseWhenHidden = true,
}: {
  autoFetch?: boolean;
  pollIntervalMs?: number;
  focusedPollIntervalMs?: number;
  pauseWhenHidden?: boolean;
}) {
  const router = useRouter();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const lastLogTimeRef = useRef<number>(0);
  const isFetchingRef = useRef(false);

  const [logs, setLogs] = useState<Log[]>([]);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [allowSystemInfo, setAllowSystemInfo] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Load security setting from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('flowzen-allow-system-info');
    if (saved === 'true') {
      setAllowSystemInfo(true);
    }
  }, []);

  // Save security setting to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('flowzen-allow-system-info', allowSystemInfo.toString());
  }, [allowSystemInfo]);

  useEffect(() => {
    if (!pauseWhenHidden) return;

    const onVisibilityChange = () => {
      setIsPageVisible(document.visibilityState === 'visible');
    };

    onVisibilityChange();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [pauseWhenHidden]);

  const handleSecurityToggle = () => {
    // Show confirmation dialog for both enabling and disabling
    setShowSecurityDialog(true);
  };

  /* ---------------- INIT SCROLL ---------------- */

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    ) as HTMLDivElement | null;

    if (!viewport) return;
    viewportRef.current = viewport;

    const onScroll = () => {
      const distance =
        viewport.scrollHeight -
        viewport.scrollTop -
        viewport.clientHeight;
      setIsAtBottom(distance < 8);
    };

    viewport.addEventListener("scroll", onScroll);
    return () => viewport.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "auto") => {
    viewportRef.current?.scrollTo({
      top: viewportRef.current.scrollHeight,
      behavior,
    });
  };

  /* ---------------- FETCH LOGS (NO CMD DUPLICATES) ---------------- */

  const fetchLogs = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    const res = await fetch("http://localhost:5000/api/logs");
    if (!res.ok) {
      isFetchingRef.current = false;
      return;
    }

    const serverLogs: Log[] = await res.json();

    const newLogs = serverLogs.filter((log) => {
      const time = new Date(log.timestamp).getTime();

      // 🚫 DROP backend CMD logs (frontend already echoes CMD)
      if (log.level === "CMD") return false;

      // 🚫 DROP error logs that match the last command (to avoid duplicates)
      if (log.level === "ERROR" && log.message.includes("is not recognized as an internal or external command")) {
        // Check if this error matches a command we recently executed
        const recentCmd = logs.slice(-3).find(l => l.level === "CMD");
        if (recentCmd) {
          const cmdText = recentCmd.message.replace("> ", "").trim();
          if (log.message.includes(`'${cmdText}'`)) {
            return false;
          }
        }
      }

      return time > lastLogTimeRef.current;
    });

    if (!newLogs.length) {
      isFetchingRef.current = false;
      return;
    }

    lastLogTimeRef.current = Math.max(
      ...newLogs.map((l) => new Date(l.timestamp).getTime())
    );

    setLogs((prev) => [...prev, ...newLogs]);

    isFetchingRef.current = false;
  };

  useEffect(() => {
    if (!autoFetch) return;
    if (pauseWhenHidden && !isPageVisible) return;

    fetchLogs();

    // Poll less frequently when input isn't focused
    let interval: NodeJS.Timeout | null = null;

    const intervalMs = isInputFocused ? focusedPollIntervalMs : pollIntervalMs;
    interval = setInterval(fetchLogs, intervalMs);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoFetch, isInputFocused, pollIntervalMs, focusedPollIntervalMs, pauseWhenHidden, isPageVisible]);

  useEffect(() => {
    if (isAtBottom) scrollToBottom("auto");
  }, [logs]);

  /* ---------------- RUN COMMAND ---------------- */

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    const cmd = command.toLowerCase().trim();

    // Check for sensitive system information commands
    const sensitiveCommands = [
      'systeminfo', 'sysinfo', 'info', 'config', 'configuration',
      'ipconfig', 'ifconfig', 'netstat', 'tasklist', 'ps',
      'wmic', 'reg', 'powershell', 'cmd', 'whoami', 'hostname',
      'env', 'set', 'dir', 'ls', 'cat /etc/', 'cat /proc/', 'cat /sys/'
    ];

    const isSensitive = sensitiveCommands.some(sensitive =>
      cmd.includes(sensitive) || cmd.startsWith(sensitive)
    );

    if (isSensitive && !allowSystemInfo) {
      // Add warning log instead of executing
      const warningLog: Log = {
        timestamp: new Date().toISOString(),
        level: "WARN",
        message: `Command '${command}' blocked - Enable "Allow PC Info" to run system information commands`
      };

      setLogs(prev => [...prev, warningLog]);
      setCommand("");
      requestAnimationFrame(() => scrollToBottom("auto"));
      return;
    }

    // Debug log to show state
    console.log(`Command: ${command}, isSensitive: ${isSensitive}, allowSystemInfo: ${allowSystemInfo}`);

    setCommand("");

    // ✅ OPTIMISTIC CMD ECHO (ONLY ONCE)
    setLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toISOString(),
        level: "CMD",
        message: `> ${command}`,
      },
    ]);

    requestAnimationFrame(() => scrollToBottom("auto"));

    setLoading(true);
    try {
      await fetch("http://localhost:5000/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: command }),
      });
    } finally {
      setLoading(false);
      await fetchLogs();
      scrollToBottom("smooth");
    }
  };

  /* ---------------- KILL TERMINAL ---------------- */

  const handleKill = async () => {
    await fetch("http://localhost:5000/api/logs/clear", { method: "POST" });

    // Add a log entry indicating the terminal was cleared
    const clearLog: Log = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      message: "Terminal logs cleared by user."
    };

    setLogs([clearLog]);
    lastLogTimeRef.current = Date.now();
  };

  /* ---------------- UI ---------------- */

  return (
    <Card className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* HEADER */}
      <CardHeader className="py-0 px-4 border-b flex justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm">FlowZen Terminal</CardTitle>
        </div>

        <div className="flex gap-1">
          <AlertDialog open={showSecurityDialog} onOpenChange={setShowSecurityDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSecurityToggle}
                className={cn(
                  "h-8 w-8",
                  allowSystemInfo
                    ? "text-green-600 hover:text-green-700 hover:bg-green-600/10"
                    : "text-red-600 hover:text-red-700 hover:bg-red-600/10"
                )}
                title={allowSystemInfo ? "Revoke PC Info Access" : "Allow PC Info Access"}
              >
                {allowSystemInfo ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {allowSystemInfo ? "Revoke PC Information Access?" : "Allow PC Information Access?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {allowSystemInfo
                    ? "Are you sure you want to disable PC information access? You will no longer be able to run system commands."
                    : "This will allow the terminal to run commands that access sensitive PC information such as system configuration, network details, and hardware specifications. Only enable this if you trust the source and understand the security implications."
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setAllowSystemInfo(!allowSystemInfo);
                    setShowSecurityDialog(false);
                  }}
                  className={cn(
                    allowSystemInfo
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-green-600 hover:bg-green-700 text-white"
                  )}
                >
                  {allowSystemInfo ? "Revoke Access" : "Allow PC Info Access"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="ghost" size="icon" onClick={() => router.push("/console")} title="Open Full Console">
            <ExternalLink className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="icon" onClick={fetchLogs} title="Refresh Logs">
            <RefreshCw className="w-4 h-4" />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="text-destructive" title="Clear Terminal Logs">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Kill Terminal?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all logs for the current session.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleKill}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Kill Terminal
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>

      {/* LOGS */}
      <CardContent className="flex-1 p-0 relative min-h-0">
        <ScrollArea ref={scrollAreaRef} className="h-full font-mono text-xs overflow-hidden">
          <div className="px-4 py-3 space-y-1.5">
            {logs.map((log, i) => (
              <div key={i} className="flex gap-3 px-2 py-0.5">
                <span className="text-muted-foreground/60">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>

                <Badge
                  variant={
                    log.level === "ERROR"
                      ? "destructive"
                      : log.level === "CMD"
                        ? "default"
                        : "secondary"
                  }
                  className={cn(
                    "h-6 text-xs font-bold px-3 py-1",
                    log.level === "CMD" && "bg-primary text-primary-foreground border-primary/20",
                    log.level === "ERROR" && "bg-destructive text-destructive-foreground border-destructive/20",
                    log.level === "WARN" && "bg-amber-500 text-white border-amber-600/20"
                  )}
                >
                  {log.level}
                </Badge>

                <span
                  className={cn(
                    "font-medium text-sm",
                    log.level === "CMD" && "text-primary font-bold text-base bg-primary/10 px-2 py-1 rounded",
                    log.level === "ERROR" && "text-red-400",
                    log.level === "WARN" && "text-amber-400"
                  )}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>

        {!isAtBottom && (
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-3 right-3 h-8 w-8"
            onClick={() => scrollToBottom("smooth")}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        )}
      </CardContent>

      {/* INPUT */}
      <CardFooter className="border-t p-3 sticky bottom-0 bg-background z-10">
        <form onSubmit={handleCommand} className="flex gap-2 w-full">
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="Type a command..."
            className="font-mono"
            autoFocus
          />
          <Button
            type="submit"
            disabled={loading}
            size="sm"
            className="px-3 bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 font-mono font-semibold"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-0.5" />
                Run
              </>
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
