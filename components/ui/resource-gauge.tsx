"use client";

import { Gauge, GaugeArc, GaugeText, GaugeTrack } from "@/components/gauge";

type ResourceGaugeProps = {
  current: number;
  maximum: number;
  label: string;
  className?: string;
};

/** A visual meter only: all game-state edits remain in the existing form/API. */
export function ResourceGauge({ current, maximum, label, className = "size-[66px]" }: ResourceGaugeProps) {
  const max = Number.isFinite(maximum) && maximum > 0 ? maximum : 1;
  const value = Number.isFinite(current) ? Math.min(max, Math.max(0, current)) : 0;
  const ratio = maximum > 0 ? value / max : 0;
  const color = ratio <= 0.25 ? "var(--mdm-red)" : ratio <= 0.5 ? "var(--mdm-warning)" : "var(--mdm-green)";
  const pct = Math.round(ratio * 100);

  return (
    <Gauge
      value={value}
      min={0}
      max={max}
      startAngle={30}
      endAngle={330}
      className={className}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={`${current} de ${maximum} pontos`}
    >
      <GaugeTrack width={13} color="var(--mdm-border-strong)" opacity={0.45} />
      <GaugeArc width={13} color={color} />
      <GaugeText fontSize={24} weight="bold" color="var(--mdm-text)">{pct}%</GaugeText>
    </Gauge>
  );
}
