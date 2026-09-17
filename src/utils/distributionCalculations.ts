export type HistogramBinType = '10-points' | 'achievement';

export interface BoxPlotStat {
  id: string;
  label: string;
  count: number;
  min: number;
  q1: number;
  median: number;
  mean: number;
  q3: number;
  max: number;
  iqr: number;
  stdDev: number;
  outliers: number[];
  color?: string;
  subLabel?: string;
}

// Percentile helper using linear interpolation between closest ranks
function getPercentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) return sorted[lower];
  return Math.round((sorted[lower] * (1 - weight) + sorted[upper] * weight) * 10) / 10;
}

export function calculateBoxPlotStats(
  id: string,
  label: string,
  values: number[],
  color?: string,
  subLabel?: string
): BoxPlotStat {
  const cleanValues = values.filter((v) => typeof v === 'number' && !isNaN(v));
  const count = cleanValues.length;

  if (count === 0) {
    return {
      id,
      label,
      count: 0,
      min: 0,
      q1: 0,
      median: 0,
      mean: 0,
      q3: 0,
      max: 0,
      iqr: 0,
      stdDev: 0,
      outliers: [],
      color,
      subLabel,
    };
  }

  const sorted = [...cleanValues].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = Math.round((sum / count) * 10) / 10;

  const median = getPercentile(sorted, 0.5);
  const q1 = getPercentile(sorted, 0.25);
  const q3 = getPercentile(sorted, 0.75);
  const iqr = Math.round((q3 - q1) * 10) / 10;

  // Standard deviation
  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / count;
  const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

  // Tukey's fences for outliers: < Q1 - 1.5*IQR or > Q3 + 1.5*IQR
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const outliers = sorted.filter((v) => v < lowerFence || v > upperFence);

  return {
    id,
    label,
    count,
    min,
    q1,
    median,
    mean,
    q3,
    max,
    iqr,
    stdDev,
    outliers,
    color,
    subLabel,
  };
}

export interface HistogramSeriesInput {
  key: string;
  name: string;
  color: string;
  values: number[];
}

export function generateHistogramData(
  seriesList: HistogramSeriesInput[],
  binType: HistogramBinType,
  histUnit: 'count' | 'percent'
): { bins: any[] } {
  type BinDef = { label: string; min: number; max: number; includeMax?: boolean };

  let binDefs: BinDef[] = [];

  if (binType === '10-points') {
    binDefs = [
      { label: '0~9점', min: 0, max: 9.99 },
      { label: '10~19점', min: 10, max: 19.99 },
      { label: '20~29점', min: 20, max: 29.99 },
      { label: '30~39점', min: 30, max: 39.99 },
      { label: '40~49점', min: 40, max: 49.99 },
      { label: '50~59점', min: 50, max: 59.99 },
      { label: '60~69점', min: 60, max: 69.99 },
      { label: '70~79점', min: 70, max: 79.99 },
      { label: '80~89점', min: 80, max: 89.99 },
      { label: '90~100점', min: 90, max: 100, includeMax: true },
    ];
  } else {
    // 5-level achievement scale
    binDefs = [
      { label: 'E (0~59점)', min: 0, max: 59.99 },
      { label: 'D (60~69점)', min: 60, max: 69.99 },
      { label: 'C (70~79점)', min: 70, max: 79.99 },
      { label: 'B (80~89점)', min: 80, max: 89.99 },
      { label: 'A (90~100점)', min: 90, max: 100, includeMax: true },
    ];
  }

  const bins = binDefs.map((def) => {
    const row: Record<string, any> = {
      label: def.label,
    };

    seriesList.forEach((series) => {
      const valid = series.values.filter((v) => typeof v === 'number' && !isNaN(v));
      const totalCount = valid.length;

      const inBin = valid.filter((v) => {
        if (def.includeMax) {
          return v >= def.min && v <= def.max;
        }
        return v >= def.min && v <= def.max;
      });

      const count = inBin.length;
      const percent = totalCount > 0 ? Math.round((count / totalCount) * 1000) / 10 : 0;

      row[`${series.key}_count`] = count;
      row[`${series.key}_percent`] = percent;
      row[series.key] = histUnit === 'percent' ? percent : count;
    });

    return row;
  });

  return { bins };
}
