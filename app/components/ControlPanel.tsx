'use client';

import { useRaahStore } from '../utils/store';

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
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95"
      style={{
        background: active ? accent + '33' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${active ? accent + '66' : 'rgba(255,255,255,0.1)'}`,
        color: active ? accent : '#e2e8f0',
        boxShadow: active ? `0 0 16px ${accent}44` : 'none',
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {active && (
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: accent }}
        />
      )}
    </button>
  );
}

export default function ControlPanel() {
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
      className="flex items-center gap-3 flex-wrap"
      style={{
        padding: '12px 20px',
        background: 'rgba(10,12,20,0.95)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <ControlButton
        onClick={simulate}
        label="Simulate Traffic"
        icon="🚦"
        accent="#818cf8"
        title="Randomise traffic across all nodes"
      />
      <ControlButton
        onClick={propagate}
        label="Propagate"
        icon="🔥"
        accent="#f59e0b"
        title="Spread congestion to neighbouring nodes"
      />
      <ControlButton
        onClick={autoSimulate}
        label={isSimulating ? 'Stop Auto' : 'Auto-Simulate'}
        icon={isSimulating ? '⏹' : '▶️'}
        accent="#22c55e"
        active={isSimulating}
        title="Run continuous propagation simulation"
      />
      <ControlButton
        onClick={reset}
        label="Reset"
        icon="↺"
        accent="#64748b"
        title="Restore initial traffic state"
      />

      {/* Step counter */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-gray-500 font-mono">
          Step{' '}
          <span className="text-gray-300 font-bold">{simulationStep.toString().padStart(3, '0')}</span>
        </span>
        <span
          className="w-2 h-2 rounded-full"
          style={{
            background: isSimulating ? '#22c55e' : '#334155',
            boxShadow: isSimulating ? '0 0 8px #22c55e' : 'none',
            transition: 'all 0.3s',
          }}
        />
      </div>
    </div>
  );
}
