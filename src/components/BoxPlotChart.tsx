import React, { useState } from 'react';
import { BoxPlotStat } from '../utils/distributionCalculations';
import { Info } from 'lucide-react';

interface BoxPlotChartProps {
  data: BoxPlotStat[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export const BoxPlotChart: React.FC<BoxPlotChartProps> = ({
  data,
  title,
  subtitle,
  height = 360,
}) => {
  const [hoveredItem, setHoveredItem] = useState<BoxPlotStat | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
        <Info className="w-8 h-8 mb-2 text-slate-300" />
        <p className="text-sm font-medium">표시할 성적 데이터가 없습니다.</p>
      </div>
    );
  }

  // Chart layout dimensions
  const svgWidth = 800;
  const svgHeight = height;
  const padding = { top: 30, right: 30, bottom: 50, left: 55 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Y-Scale: 0 to 100 points
  const yScale = (score: number) => {
    const clamped = Math.max(0, Math.min(100, score));
    return padding.top + plotHeight - (clamped / 100) * plotHeight;
  };

  const yTicks = [0, 20, 40, 60, 80, 100];

  // X-Scale: distribute items evenly
  const itemCount = data.length;
  const colWidth = plotWidth / itemCount;
  const boxWidth = Math.min(54, Math.max(26, colWidth * 0.55));

  return (
    <div className="relative w-full bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
      {/* Header Info & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          {title && <h4 className="text-sm font-bold text-slate-900">{title}</h4>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-[11px] font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs border border-blue-600 bg-blue-100 inline-block" />
            <span>상자 (Q1~Q3, 사분위범위)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-slate-900 inline-block" />
            <span>중앙값 (Median)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500 rotate-45 inline-block" />
            <span>평균 (Mean ♦)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-slate-400 inline-block" />
            <span>수염 (최소~최대)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>이상치 (Outlier)</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto select-none"
          style={{ minWidth: itemCount > 6 ? `${itemCount * 80}px` : '100%' }}
        >
          {/* Horizontal Grid lines and Y-axis labels */}
          {yTicks.map((tick) => {
            const y = yScale(tick);
            return (
              <g key={tick} className="text-slate-400">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke={tick === 0 || tick === 60 ? '#cbd5e1' : '#f1f5f9'}
                  strokeWidth={tick === 0 || tick === 60 ? '1.5' : '1'}
                  strokeDasharray={tick === 60 ? '3 3' : undefined}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#64748b"
                  fontWeight="600"
                >
                  {tick}점
                </text>
              </g>
            );
          })}

          {/* Reference line notice for 60 points (D/E cutoff) */}
          <text
            x={svgWidth - padding.right - 5}
            y={yScale(60) - 4}
            textAnchor="end"
            fontSize="9"
            fill="#94a3b8"
            fontStyle="italic"
          >
            60점 (성취도 D/E 경계)
          </text>

          {/* Render each box plot item */}
          {data.map((item, idx) => {
            const cx = padding.left + idx * colWidth + colWidth / 2;
            const isHovered = hoveredItem?.id === item.id;

            // Coordinates
            const yMin = yScale(item.min);
            const yQ1 = yScale(item.q1);
            const yMedian = yScale(item.median);
            const yQ3 = yScale(item.q3);
            const yMax = yScale(item.max);
            const yMean = yScale(item.mean);

            const boxHeight = Math.max(2, yQ1 - yQ3);

            return (
              <g
                key={item.id}
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {/* Column highlight background on hover */}
                {isHovered && (
                  <rect
                    x={cx - colWidth / 2 + 4}
                    y={padding.top}
                    width={colWidth - 8}
                    height={plotHeight}
                    fill="#f8fafc"
                    rx={6}
                  />
                )}

                {/* Whisker Line: Bottom (Min to Q1) */}
                <line
                  x1={cx}
                  y1={yMin}
                  x2={cx}
                  y2={yQ1}
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />

                {/* Whisker Line: Top (Q3 to Max) */}
                <line
                  x1={cx}
                  y1={yQ3}
                  x2={cx}
                  y2={yMax}
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />

                {/* Min Cap */}
                <line
                  x1={cx - boxWidth * 0.3}
                  y1={yMin}
                  x2={cx + boxWidth * 0.3}
                  y2={yMin}
                  stroke="#334155"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Max Cap */}
                <line
                  x1={cx - boxWidth * 0.3}
                  y1={yMax}
                  x2={cx + boxWidth * 0.3}
                  y2={yMax}
                  stroke="#334155"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Box (Q1 to Q3) */}
                <rect
                  x={cx - boxWidth / 2}
                  y={yQ3}
                  width={boxWidth}
                  height={boxHeight}
                  fill={item.color || '#3b82f6'}
                  fillOpacity={isHovered ? 0.45 : 0.28}
                  stroke={item.color || '#2563eb'}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  rx={3}
                />

                {/* Median Line */}
                <line
                  x1={cx - boxWidth / 2}
                  y1={yMedian}
                  x2={cx + boxWidth / 2}
                  y2={yMedian}
                  stroke="#0f172a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Mean Diamond Marker (♦) */}
                <polygon
                  points={`
                    ${cx},${yMean - 4.5} 
                    ${cx + 4.5},${yMean} 
                    ${cx},${yMean + 4.5} 
                    ${cx - 4.5},${yMean}
                  `}
                  fill="#f59e0b"
                  stroke="#b45309"
                  strokeWidth="1.2"
                />

                {/* Outliers */}
                {item.outliers.map((outlierScore, oIdx) => (
                  <circle
                    key={oIdx}
                    cx={cx}
                    cy={yScale(outlierScore)}
                    r="3.5"
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                ))}

                {/* X-axis Category Label */}
                <text
                  x={cx}
                  y={svgHeight - padding.bottom + 18}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight={isHovered ? '800' : '600'}
                  fill={isHovered ? '#1d4ed8' : '#334155'}
                >
                  {item.label}
                </text>

                {/* Sub-label (e.g. N=25명) */}
                <text
                  x={cx}
                  y={svgHeight - padding.bottom + 32}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                >
                  N={item.count}
                </text>

                {/* Quick mean badge on top if hovered */}
                {isHovered && (
                  <g>
                    <rect
                      x={cx - 28}
                      y={yMax - 26}
                      width={56}
                      height={18}
                      rx={4}
                      fill="#1e293b"
                    />
                    <text
                      x={cx}
                      y={yMax - 13}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="bold"
                      fill="#ffffff"
                    >
                      평균 {item.mean}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Floating Detailed Tooltip */}
      {hoveredItem && (
        <div className="mt-3 p-3.5 bg-slate-900 text-white rounded-xl text-xs shadow-lg animate-in fade-in duration-150 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: hoveredItem.color }}
              />
              <span className="font-extrabold text-sm text-slate-100">
                {hoveredItem.label}
              </span>
              {hoveredItem.subLabel && (
                <span className="text-slate-400 text-[11px]">({hoveredItem.subLabel})</span>
              )}
            </div>
            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium">
              응시 인원: {hoveredItem.count}명
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">최고점 (Max)</div>
              <div className="text-sm font-bold text-emerald-400">{hoveredItem.max}점</div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">상위 25% (Q3)</div>
              <div className="text-sm font-bold text-blue-300">{hoveredItem.q3}점</div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded-lg border border-indigo-500/40">
              <div className="text-[10px] text-indigo-300 font-semibold">중앙값 (Median)</div>
              <div className="text-sm font-extrabold text-white">{hoveredItem.median}점</div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded-lg border border-amber-500/40">
              <div className="text-[10px] text-amber-300 font-semibold">평균 (Mean ♦)</div>
              <div className="text-sm font-extrabold text-amber-400">{hoveredItem.mean}점</div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">하위 25% (Q1)</div>
              <div className="text-sm font-bold text-slate-300">{hoveredItem.q1}점</div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">최저점 (Min)</div>
              <div className="text-sm font-bold text-rose-400">{hoveredItem.min}점</div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">사분위범위 (IQR)</div>
              <div className="text-sm font-bold text-purple-300">{hoveredItem.iqr}점</div>
            </div>

            <div className="bg-slate-800/60 p-2 rounded-lg">
              <div className="text-[10px] text-slate-400">표준편차 (σ)</div>
              <div className="text-sm font-bold text-cyan-300">±{hoveredItem.stdDev}</div>
            </div>
          </div>

          {hoveredItem.outliers.length > 0 && (
            <div className="mt-2 text-[11px] text-rose-300 flex items-center gap-1.5 bg-rose-950/40 px-2.5 py-1.5 rounded-md border border-rose-900/50">
              <span className="font-bold">⚠️ 이상치(Outlier) 감지:</span>
              <span>
                {hoveredItem.outliers.join('점, ')}점 (통계적 사분위수 범위를 크게 벗어난 점수)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
