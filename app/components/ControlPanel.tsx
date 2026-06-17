'use client';

import { useRaahStore, SimSpeed, SIM_INTERVALS } from '../utils/store';
import { PeakHour } from '../data/nodes';
import { PEAK_PROFILES } from '../ml/predictor';

const SPEEDS: SimSpeed[] = ['slow', 'normal', 'fast'];

function Btn({
  onClick, icon, label, shortLabel, accent, active, disabled, title,
}: {
  onClick: () => void; icon: string; label: string; shortLabel: string;
  accent: string; active?: boolean; disabled?: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '7px 12px', borderRadius: 9, cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12, fontWeight: 700, transition: 'all 0.18s', flexShrink: 0,
        background: active  ? `${accent}28` : 'rgba(255,255,255,0.05)',
        border:    `1px solid ${active ? `${accent}66` : 'rgba(255,255,255,0.09)'}`,
        color:     active  ? accent : disabled ? '#334155' : '#cbd5e1',
        boxShadow: active  ? `0 0 14px ${accent}44` : 'none',
        opacity:   disabled ? 0.45 : 1,
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span className="btn-full">{label}</span>
      <span className="btn-short">{shortLabel}</span>
      {active && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: accent, animation: 'blink 1.2s infinite' }} />
      )}
    </button>
  );
}

export default function ControlPanel({ onMenuClick }: { onMenuClick?: () => void }) {
  const {
    isSimulating, startSimulation, stopSimulation,
    tick_step, reset, simSpeed, setSimSpeed,
    peakHour, applyPeak, tick, showHeatmap, toggleHeatmap,
    showPredictions, togglePredictions, runPrediction,
  } = useRaahStore();

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap',
      padding: '9px 12px', overflowX: 'auto',
      background: 'rgba(8,10,18,0.98)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)', minHeight: 52,
    }}>

      {/* Hamburger (mobile only) */}
      <button
        onClick={onMenuClick}
        className="menu-btn"
        style={{
          display: 'none', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 8, flexShrink: 0,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#94a3b8', cursor: 'pointer', fontSize: 17,
        }}
      >☰</button>

      {/* Brand (mobile only) */}
      <span className="brand-m" style={{
        display: 'none', fontSize: 11, fontWeight: 800, color: '#818cf8',
        background: 'rgba(99,102,241,0.15)', border: '1px solid #4f46e530',
        borderRadius: 20, padding: '3px 9px', flexShrink: 0,
      }}>RAAH</span>

      {/* Divider */}
      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Simulation controls */}
      <Btn onClick={isSimulating ? stopSimulation : startSimulation}
        icon={isSimulating ? '⏹' : '▶️'}
        label={isSimulating ? 'Stop' : 'Auto Run'}
        shortLabel={isSimulating ? '⏹' : '▶️'}
        accent="#22c55e" active={isSimulating}
        title="Continuous tick simulation" />

      <Btn onClick={tick_step} icon="⏭" label="Step" shortLabel="⏭"
        accent="#818cf8" title="Single simulation tick" />

      <Btn onClick={reset} icon="↺" label="Reset" shortLabel="↺"
        accent="#64748b" title="Restore initial state" />

      {/* Speed selector */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 3,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 9, padding: '3px 5px', flexShrink: 0,
      }}>
        {SPEEDS.map((s) => (
          <button key={s} onClick={() => setSimSpeed(s)} style={{
            padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: simSpeed === s ? 'rgba(99,102,241,0.25)' : 'transparent',
            color: simSpeed === s ? '#a5b4fc' : '#475569',
            border: simSpeed === s ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
          }}>
            {s === 'slow' ? `${SIM_INTERVALS.slow/1000}s` : s === 'normal' ? `${SIM_INTERVALS.normal/1000}s` : `${SIM_INTERVALS.fast/1000}s`}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* Peak hour */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 3,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 9, padding: '3px 5px', flexShrink: 0,
      }}>
        {(Object.entries(PEAK_PROFILES) as [PeakHour, typeof PEAK_PROFILES[PeakHour]][]).map(([key, p]) => (
          <button key={key} onClick={() => applyPeak(key)} title={p.description} style={{
            padding: '3px 7px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            background: peakHour === key ? 'rgba(245,158,11,0.22)' : 'transparent',
            color: peakHour === key ? '#fbbf24' : '#475569',
            border: peakHour === key ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
          }}>
            {p.icon}
          </button>
        ))}
      </div>

      <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />

      {/* ML toggles */}
      <Btn onClick={toggleHeatmap} icon="🌡️" label="Heatmap" shortLabel="🌡️"
        accent="#f43f5e" active={showHeatmap} title="Toggle congestion heatmap" />
      <Btn onClick={() => { runPrediction(); }} icon="🤖" label="Predict" shortLabel="🤖"
        accent="#a78bfa" active={showPredictions} title="ML traffic prediction" />

      {/* Tick counter — pushed right */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace' }}>
          TICK <span style={{ color: '#94a3b8', fontWeight: 800 }}>{String(tick).padStart(4, '0')}</span>
        </span>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', transition: 'all 0.3s',
          background: isSimulating ? '#22c55e' : '#1e293b',
          boxShadow: isSimulating ? '0 0 8px #22c55e' : 'none',
        }} />
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @media(max-width:1023px){
          .menu-btn{display:flex!important}
          .brand-m{display:inline-block!important}
          .btn-full{display:none!important}
          .btn-short{display:inline!important}
        }
        @media(min-width:1024px){
          .menu-btn{display:none!important}
          .brand-m{display:none!important}
          .btn-full{display:inline!important}
          .btn-short{display:none!important}
        }
        .btn-short{display:none}
      `}</style>
    </div>
  );
}
