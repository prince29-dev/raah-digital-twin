'use client';

import { useRaahStore } from '../utils/store';

type ControlPanelProps = {
  onMenuClick?: () => void;
};

type ButtonProps = {
  onClick: () => void;
  label: string;
  icon: string;
  accent: string;
  active?: boolean;
  title?: string;
};

function ControlButton({ onClick, label, icon, accent, active, title }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95"
      style={{
        background: active ? accent + '33' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${active ? accent + '66' : 'rgba(255,255,255,0.1)'}`,
        color: active ? accent : '#e2e8f0',
        boxShadow: active ? `0 0 12px ${accent}44` : 'none',
      }}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      {active && (
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: accent }}
        />
      )}
    </button>
  );
}

export default function ControlPanel({ onMenuClick }: ControlPanelProps) {
  const {
    simulate,
    propagate,
    reset,
    autoSimulate,
    isSimulating,
    simulationStep,
  } = useRaahStore();

  return (
    <div
      className="flex items-center justify-between flex-wrap gap-2 px-3 py-2 sm:px-4 sm:py-3"
      style={{
        background: 'rgba(10,12,20,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* 🔥 LEFT SIDE */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-white text-lg px-2"
          onClick={onMenuClick}
        >
          ☰
        </button>

        <ControlButton
          onClick={simulate}
          label="Simulate"
          icon="🚦"
          accent="#818cf8"
        />

        <ControlButton
          onClick={propagate}
          label="Propagate"
          icon="🔥"
          accent="#f59e0b"
        />

        <ControlButton
          onClick={autoSimulate}
          label={isSimulating ? 'Stop' : 'Auto'}
          icon={isSimulating ? '⏹' : '▶️'}
          accent="#22c55e"
          active={isSimulating}
        />

        <ControlButton
          onClick={reset}
          label="Reset"
          icon="↺"
          accent="#64748b"
        />
      </div>

      {/* 🔥 RIGHT SIDE (Step Counter) */}
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <span className="text-gray-500 font-mono">
          Step{' '}
          <span className="text-gray-300 font-bold">
            {simulationStep.toString().padStart(3, '0')}
          </span>
        </span>

        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: isSimulating ? '#22c55e' : '#334155',
            boxShadow: isSimulating ? '0 0 6px #22c55e' : 'none',
          }}
        />
      </div>
    </div>
  );
}
