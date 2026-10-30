import React from 'react';
import Dashboard from './pages/Dashboard';
import {
  ShieldCheck,
  Lock,
  Terminal,
  Database,
  Key,
  Cpu
} from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col cyber-vault-bg relative selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Glowing Ambient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-purple-600/15 blur-[150px]" />
        <div className="absolute top-1/3 -right-36 w-[480px] h-[480px] rounded-full bg-emerald-500/12 blur-[160px]" />
        <div className="absolute -bottom-40 left-1/3 w-[560px] h-[560px] rounded-full bg-cyan-600/10 blur-[170px]" />
      </div>

      {/* Main Application Shell Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="relative p-2.5 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-slate-900 to-cyan-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]">
              <ShieldCheck className="w-7 h-7" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>Zero-Knowledge Cryptographic Vault</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                  <Lock className="w-3 h-3" /> MVP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:flex items-center gap-2 mt-0.5">
                <span>AES-256-GCM Vaulting</span>
                <span className="text-slate-600">•</span>
                <span>SHA-256 Integrity Verification</span>
                <span className="text-slate-600">•</span>
                <span>Ed25519 Signatures</span>
              </p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-mono">
            {/* Vite Port Indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Vite:</span>
              <span className="text-cyan-300 font-semibold">Port 5173</span>
            </div>

            {/* API Target Indicator */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">API Target:</span>
              <span className="text-emerald-300 font-semibold">Port 8000</span>
            </div>

            {/* Zero-Knowledge Mode Active */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <Key className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold text-[11px] uppercase tracking-wide">
                Zero-Knowledge Mode: Active
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content View */}
      <main className="flex-1">
        <Dashboard />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900/90 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500/70" />
            <span>Securathon High-Assurance Cryptographic Engine</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <span>Member 1: UI / Frontend Security Engineer</span>
            <span>•</span>
            <span>Member 2: WebCrypto & API Subsystems</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
