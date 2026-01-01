"use client";
import React from 'react';
import { Home, Terminal, BarChart2, Settings, Activity } from 'lucide-react';

const Sidebar = () => {
    const menuItems = [
        { icon: Home, label: 'Dashboard', active: true },
        { icon: Terminal, label: 'Console' },
        { icon: Activity, label: 'Activity' },
        { icon: BarChart2, label: 'Insights' },
        { icon: Settings, label: 'Settings' },
    ];

    return (
        <div className="h-screen w-20 flex flex-col items-center py-8 glass border-r border-slate-700/50 z-50 relative">
            <div className="mb-10 p-2 bg-indigo-500/20 rounded-xl">
                <Activity className="w-8 h-8 text-indigo-400" />
            </div>

            <div className="flex flex-col gap-6 w-full">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        className={`w-full flex justify-center py-3 relative group transition-all duration-300 ${item.active ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-100'
                            }`}
                    >
                        <item.icon className={`w-6 h-6 ${item.active ? 'drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : ''}`} />
                        {item.active && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-l-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                        )}

                        {/* Tooltip */}
                        <span className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-slate-700">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
