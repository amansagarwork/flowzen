"use client";
import React from 'react';
import Sidebar from './components/Sidebar';
import TerminalWidget from './components/TerminalWidget';
import InsightsPanel from './components/InsightsPanel';

export default function Home() {
  return (
    <div className="flex bg-slate-950 h-screen w-full relative">
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-950 z-0 pointer-events-none"></div>

      <div className="z-10 flex w-full h-full">
        <Sidebar />

        <main className="flex-1 flex flex-col p-8 gap-8 overflow-hidden">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">FlowZen</h1>
              <p className="text-slate-400">Intelligent Automation Dashboard</p>
            </div>
            <div className="flex gap-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                System Online
              </span>
            </div>
          </header>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-0">
            <div className="h-full min-h-0 flex flex-col">
              <TerminalWidget />
            </div>
            <div className="h-full min-h-0 overflow-y-auto">
              <InsightsPanel />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
