import type { SkillDimension } from "@/lib/learning/speaking-report";

type SkillRadarChartProps = {
  dimensions: SkillDimension[];
  size?: number;
};

export function SkillRadarChart({ dimensions, size = 240 }: SkillRadarChartProps) {
  if (dimensions.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const count = dimensions.length;

  const pointAt = (index: number, ratio: number) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return [cx + Math.cos(angle) * radius * ratio, cy + Math.sin(angle) * radius * ratio] as const;
  };

  const dataPoints = dimensions.map((dimension, index) => {
    const ratio = Math.min(Math.max(dimension.score / 100, 0), 1);
    return pointAt(index, ratio);
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Radar skill speaking">
      {gridLevels.map((level) => {
        const gridPoints = dimensions.map((_, index) => pointAt(index, level));
        return (
          <polygon
            key={level}
            points={gridPoints.map((point) => point.join(",")).join(" ")}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1"
          />
        );
      })}

      {dimensions.map((dimension, index) => {
        const [x, y] = pointAt(index, 1);
        const [lx, ly] = pointAt(index, 1.18);
        return (
          <g key={dimension.key}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="#64748b"
            >
              {dimension.labelId.split(" ")[0]}
            </text>
          </g>
        );
      })}

      <polygon
        points={dataPoints.map((point) => point.join(",")).join(" ")}
        fill="rgba(13,98,255,0.22)"
        stroke="#0d62ff"
        strokeWidth="2"
      />

      {dataPoints.map((point, index) => (
        <circle key={dimensions[index].key} cx={point[0]} cy={point[1]} r="4" fill="#0d62ff" />
      ))}
    </svg>
  );
}
