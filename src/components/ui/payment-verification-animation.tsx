
'use client';

import { Loader2, ShieldCheck, Globe, Database, Cpu } from 'lucide-react';

export function PaymentVerificationAnimation() {
  return (
    <div className="w-full flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-xl border border-blue-50 overflow-hidden relative min-h-[400px]">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      {/* Animation Core */}
      <div className="relative w-48 h-48 mb-8">
        {/* Rotating Outer Ring */}
        <div className="absolute inset-0 border-4 border-dashed border-blue-200 rounded-full animate-[spin_10s_linear_infinite]"></div>
        
        {/* Pulsing Scan Radar */}
        <div className="absolute inset-4 border-2 border-blue-400/20 rounded-full animate-pulse"></div>
        
        {/* Floating Connection Nodes */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        </div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.7s' }}></div>
        </div>

        {/* Central Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 animate-[pulse_2s_ease-in-out_infinite]">
              <ShieldCheck className="text-white w-12 h-12" />
            </div>
            {/* Orbiting Particles */}
            <div className="absolute -inset-4 border border-blue-500/10 rounded-full animate-[spin_3s_linear_infinite]">
              <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="space-y-6 w-full max-w-sm">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h3>
          <p className="text-blue-600 font-medium text-sm tracking-wide animate-pulse">SCANNING NETWORK FOR TRANSACTION...</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <Globe className="w-5 h-5 text-blue-500 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Blockchain</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <Database className="w-5 h-5 text-blue-500 animate-bounce" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Ledger</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <Cpu className="w-5 h-5 text-blue-500 animate-pulse" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Nodes</span>
          </div>
        </div>

        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-center">
          <p className="text-xs text-gray-600 leading-relaxed italic">
            "Your transaction is currently undergoing automated network confirmation. This process continues until an administrator verifies the receipt."
          </p>
        </div>
      </div>

      {/* Floating Code Snippets (Visual only) */}
      <div className="absolute bottom-4 left-4 font-mono text-[10px] text-blue-300 opacity-40 hidden md:block">
        HEX: 0x71C765...<br />
        SYNC: 98.4%
      </div>
      <div className="absolute top-4 right-4 font-mono text-[10px] text-blue-300 opacity-40 hidden md:block text-right">
        CONF: 0/3<br />
        NET: Mainnet
      </div>
    </div>
  );
}
