"use client";
import React from 'react';
import { Download, CheckCircle, AlertOctagon, Zap, ArrowUpRight } from 'lucide-react';

const InsightsPanel = () => {
    const stats = [
        { label: 'Code Health', value: '98%', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
        { label: 'Open Issues', value: '3', icon: AlertOctagon, color: 'text-rose-400', bg: 'bg-rose-500/10' },
        { label: 'Velocity', value: 'High', icon: Zap, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    ];

    const handleExport = () => {
        const report = {
            timestamp: new Date().toISOString(),
            stats: stats.map(s => ({ label: s.label, value: s.value })),
            insights: ['Refactor suggested in auth.ts', 'Dependencies outdated: 2 found', 'Test coverage improved by +5%']
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `flowzen-report-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className="card glass flex flex-col items-start gap-2 relative overflow-hidden group">
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} mb-2`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <span className="text-slate-400 text-sm">{stat.label}</span>
                        <span className="text-2xl font-bold text-white">{stat.value}</span>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="w-4 h-4 text-slate-500" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="card glass flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center pb-4 border-b border-slate-700/50">
                    <h3 className="font-semibold text-lg">Project Insights</h3>
                    <button onClick={handleExport} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white transition text-sm font-medium border border-indigo-500/30">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Mock insight items */}
                    {['Refactor suggested in auth.ts', 'Dependencies outdated: 2 found', 'Test coverage improved by +5%'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded bg-slate-800/50 border border-slate-700 hover:border-indigo-500/50 transition cursor-pointer">
                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                            <span className="text-slate-300 text-sm">{item}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default InsightsPanel;
