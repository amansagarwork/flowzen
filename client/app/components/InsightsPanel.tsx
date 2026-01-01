"use client";
import React from 'react';
import { Download, CheckCircle, AlertOctagon, Zap, ArrowUpRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
        <div className="flex flex-col gap-6 relative h-full">
            <div className="flex flex-col gap-6 transition-all duration-500">
                <div className="grid grid-cols-3 gap-4">
                    {stats.map((stat, i) => (
                        <Card key={i} className="relative overflow-hidden group border-border bg-card/30">
                            <CardContent className="p-4 flex flex-col items-start gap-1">
                                <div className={`p-2 rounded-lg ${stat.bg} ${stat.color} mb-1`}>
                                    <stat.icon className="w-4 h-4" />
                                </div>
                                <span className="text-muted-foreground text-xs font-medium">{stat.label}</span>
                                <span className="text-xl font-bold tracking-tight">{stat.value}</span>

                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="flex-1 flex flex-col border-border bg-card/30 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
                        <CardTitle className="text-lg">Project Insights</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 h-8 text-xs font-medium">
                            <Download className="w-3.5 h-3.5" />
                            Export Report
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                        {['Refactor suggested in auth.ts', 'Dependencies outdated: 2 found', 'Test coverage improved by +5%'].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-colors cursor-pointer group text-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 opacity-70 group-hover:opacity-100" />
                                <span className="text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default InsightsPanel;
