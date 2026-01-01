"use client";
import React, { useEffect, useState, useRef } from 'react';
import { Terminal as TerminalIcon, Play, RefreshCw, XCircle } from 'lucide-react';

interface Log {
    timestamp: string;
    level: string;
    message: string;
}

const TerminalWidget = () => {
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
        fetchLogs();
        const interval = setInterval(fetchLogs, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!command.trim()) return;

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
        <div className="flex flex-col h-full card glass overflow-hidden border-slate-700/50">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-900/50 border-b border-slate-700/50">
                <div className="flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-300">FlowZen Terminal</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchLogs} className="p-1 hover:bg-slate-700 rounded transition">
                        <RefreshCw className="w-3 h-3 text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2 bg-slate-950/80" ref={scrollRef}>
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-slate-500 text-xs shrink-0 pt-0.5">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`shrink-0 text-xs font-bold px-1.5 rounded py-0.5 self-start ${log.level === 'WARN' ? 'bg-yellow-500/10 text-yellow-500' :
                                log.level === 'ERROR' ? 'bg-red-500/10 text-red-500' :
                                    'bg-blue-500/10 text-blue-500'
                            }`}>
                            {log.level}
                        </span>
                        <span className="text-slate-300 break-all">{log.message}</span>
                    </div>
                ))}
                {logs.length === 0 && (
                    <div className="text-slate-600 italic">No logs available...</div>
                )}
            </div>

            <form onSubmit={handleCommand} className="p-2 bg-slate-900/50 border-t border-slate-700/50 flex gap-2">
                <span className="text-indigo-400 font-bold font-mono pl-2 py-2">{'>'}</span>
                <input
                    type="text"
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    placeholder="Enter command (e.g., 'run tests')"
                    className="flex-1 bg-transparent border-none outline-none text-slate-200 font-mono text-sm placeholder:text-slate-600"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition disabled:opacity-50"
                >
                    <Play className="w-4 h-4" />
                </button>
            </form>
        </div>
    );
};

export default TerminalWidget;
