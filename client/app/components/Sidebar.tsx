"use client";
import React from 'react';
import { Home, Terminal, BarChart2, Settings, Activity, Zap, Folder } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const Sidebar = ({ activeTab, onTabChange }: SidebarProps) => {
    const menuItems = [
        { icon: Home, label: 'Dashboard' },
        { icon: Folder, label: 'Projects' },
        { icon: Terminal, label: 'Console' },
        { icon: Activity, label: 'Activity' },
        { icon: BarChart2, label: 'Insights' },
        { icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="flex flex-col p-4 h-full w-64 shrink-0">
            <div className="flex items-center gap-2 px-2 mb-8">
                <div className="bg-primary/20 p-2 rounded-lg">
                    <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="font-bold text-xl tracking-tight">FlowZen</span>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item, index) => (
                    <Button
                        key={index}
                        variant={activeTab === item.label ? "secondary" : "ghost"}
                        onClick={() => onTabChange(item.label)}
                        className={cn(
                            "w-full justify-start gap-3 px-3",
                            activeTab === item.label ? "font-medium" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.label}
                    </Button>
                ))}
            </nav>



            <div className="mt-auto pt-4 border-t border-border space-y-2">
                <div className="px-3">
                    <Badge variant="outline" className="gap-2 px-3 py-1.5 font-mono text-[10px] border-emerald-500/20 bg-emerald-500/5 text-black dark:text-white w-fit">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        ONLINE
                    </Badge>
                </div>
                <Button
                    variant={activeTab === 'Support' ? "secondary" : "ghost"}
                    onClick={() => onTabChange('Support')}
                    className="w-full justify-start gap-3 px-3 text-muted-foreground"
                >
                    <Settings className="w-4 h-4" />
                    Support
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;

