import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  Box,
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp,
  Percent,
  Hash,
  Sparkles,
  Table as TableIcon,
} from 'lucide-react';
import { StudentCalculatedResult, ExamInfo, Grade } from '../types';
import {
  calculateBoxPlotStats,
  generateHistogramData,
  HistogramBinType,
  BoxPlotStat,
} from '../utils/distributionCalculations';
import { BoxPlotChart } from './BoxPlotChart';

interface ScoreDistributionVisualizerProps {
  grade: Grade;
  currentExam: ExamInfo;
  currentSubjects: string[];
  results: StudentCalculatedResult[];
  selectedClassFilter?: number | 'all';
}

const CLASS_COLORS: Record<number | string, string> = {
  total: '#1e293b', // Overall grade
  1: '#2563eb', // Blue
  2: '#7c3aed', // Purple
  3: '#059669', // Emerald
  4: '#d97706', // Amber
  5: '#e11d48', // Rose
  6: '#0891b2', // Cyan
  7: '#4f46e5', // Indigo
  8: '#c026d3', // Fuchsia
};

const SUBJECT_COLORS = [
  '#2563eb',
  '#dc2626',
  '#16a34a',
  '#d97706',
  '#7c3aed',
  '#0891b2',
  '#ea580c',
  '#db2777',
  '#4f46e5',
  '#059669',
];

export const ScoreDistributionVisualizer: React.FC<ScoreDistributionVisualizerProps> = ({
  grade,
  currentExam,
  currentSubjects,
  results,
}) => {
  // Main view state
  const [chartType, setChartType] = useState<'histogram' | 'boxplot'>('histogram');
  const [dimension, setDimension] = useState<'class' | 'subject'>('class');

  // Selected filters for dimension
  const [targetSubject, setTargetSubject] = useState<string>('all_avg');
  const [targetClass, setTargetClass] = useState<number | 'all'>('all');

  // Histogram-specific options
  const [binType, setBinType] = useState<HistogramBinType>('10-points');
  const [histUnit, setHistUnit] = useState<'count' | 'percent'>('count');

  // UI accordion/toggle
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [showStatsTable, setShowStatsTable] = useState<boolean>(true);

  // Available classes
  const availableClasses = useMemo(() => {
    const set = new Set<number>();
    results.forEach((r) => set.add(r.student.classNum));
    return Array.from(set).sort((a, b) => a - b);
  }, [results]);

  // Ensure targetSubject is valid if subjects change
  const activeSubjectName = useMemo(() => {
    if (targetSubject === 'all_avg') return '전과목 종합 평균';
    if (currentSubjects.includes(targetSubject)) return targetSubject;
    return currentSubjects[0] || '전과목 종합 평균';
  }, [targetSubject, currentSubjects]);

  // 1. Box Plot Calculations
  const boxPlotData: BoxPlotStat[] = useMemo(() => {
    if (results.length === 0) return [];

    if (dimension === 'class') {
      const statsList: BoxPlotStat[] = [];

      // Grade Overall
      const gradeValues = results
        .map((r) =>
          activeSubjectName === '전과목 종합 평균'
            ? r.average
            : r.scores[activeSubjectName]
        )
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));

      statsList.push(
        calculateBoxPlotStats(
          'grade_total',
          '학년 전체',
          gradeValues,
          CLASS_COLORS['total'],
          `${grade}학년 총 ${gradeValues.length}명`
        )
      );

      // Each Class
      availableClasses.forEach((cNum) => {
        const classStudents = results.filter((r) => r.student.classNum === cNum);
        const classValues = classStudents
          .map((r) =>
            activeSubjectName === '전과목 종합 평균'
              ? r.average
              : r.scores[activeSubjectName]
          )
          .filter((v): v is number => typeof v === 'number' && !isNaN(v));

        statsList.push(
          calculateBoxPlotStats(
            `class_${cNum}`,
            `${cNum}반`,
            classValues,
            CLASS_COLORS[cNum] || '#64748b',
            `${cNum}반 ${classValues.length}명`
          )
        );
      });

      return statsList;
    } else {
      const filteredResults =
        targetClass === 'all'
          ? results
          : results.filter((r) => r.student.classNum === targetClass);

      const statsList: BoxPlotStat[] = [];

      // Overall average first
      const avgValues = filteredResults
        .map((r) => r.average)
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));

      statsList.push(
        calculateBoxPlotStats(
          'subject_total_avg',
          '종합 평균',
          avgValues,
          '#0f172a',
          targetClass === 'all' ? '전체' : `${targetClass}반`
        )
      );

      // Each subject
      currentSubjects.forEach((subj, idx) => {
        const subjValues = filteredResults
          .map((r) => r.scores[subj])
          .filter((v): v is number => typeof v === 'number' && !isNaN(v));

        statsList.push(
          calculateBoxPlotStats(
            `subj_${subj}`,
            subj,
            subjValues,
            SUBJECT_COLORS[idx % SUBJECT_COLORS.length],
            `${subjValues.length}명 응시`
          )
        );
      });

      return statsList;
    }
  }, [dimension, results, activeSubjectName, availableClasses, targetClass, currentSubjects, grade]);

  // 2. Histogram Calculations
  const { histogramData, histogramSeries } = useMemo(() => {
    if (results.length === 0) return { histogramData: [], histogramSeries: [] };

    if (dimension === 'class') {
      const seriesList = [
        {
          key: 'grade_total',
          name: '학년 전체',
          color: CLASS_COLORS['total'],
          values: results
            .map((r) =>
              activeSubjectName === '전과목 종합 평균'
                ? r.average
                : r.scores[activeSubjectName]
            )
            .filter((v): v is number => typeof v === 'number' && !isNaN(v)),
        },
        ...availableClasses.map((cNum) => ({
          key: `class_${cNum}`,
          name: `${cNum}반`,
          color: CLASS_COLORS[cNum] || '#64748b',
          values: results
            .filter((r) => r.student.classNum === cNum)
            .map((r) =>
              activeSubjectName === '전과목 종합 평균'
                ? r.average
                : r.scores[activeSubjectName]
            )
            .filter((v): v is number => typeof v === 'number' && !isNaN(v)),
        })),
      ];

      const { bins } = generateHistogramData(seriesList, binType, histUnit);
      return { histogramData: bins, histogramSeries: seriesList };
    } else {
      const filteredResults =
        targetClass === 'all'
          ? results
          : results.filter((r) => r.student.classNum === targetClass);

      const seriesList = [
        {
          key: 'subj_avg',
          name: '종합 평균',
          color: '#0f172a',
          values: filteredResults
            .map((r) => r.average)
            .filter((v): v is number => typeof v === 'number' && !isNaN(v)),
        },
        ...currentSubjects.map((subj, idx) => ({
          key: `subj_${subj}`,
          name: subj,
          color: SUBJECT_COLORS[idx % SUBJECT_COLORS.length],
          values: filteredResults
            .map((r) => r.scores[subj])
            .filter((v): v is number => typeof v === 'number' && !isNaN(v)),
        })),
      ];

      const { bins } = generateHistogramData(seriesList, binType, histUnit);
      return { histogramData: bins, histogramSeries: seriesList };
    }
  }, [
    dimension,
    results,
    activeSubjectName,
    availableClasses,
    targetClass,
    currentSubjects,
    binType,
    histUnit,
  ]);

  // Quick stats summary
  const summaryNotice = useMemo(() => {
    if (boxPlotData.length === 0) return null;
    const base = boxPlotData[0];
    return {
      label: base.label,
      mean: base.mean,
      median: base.median,
      iqr: base.iqr,
      count: base.count,
    };
  }, [boxPlotData]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all duration-200">
      {/* Visualizer Top Bar */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-xs">
            {chartType === 'histogram' ? (
              <BarChart3 className="w-5 h-5 text-blue-400" />
            ) : (
              <Box className="w-5 h-5 text-indigo-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                {grade}학년 학급별·과목별 성적 분포 분석
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {currentExam.name}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              학급 간 학력 격차 및 과목별 점수대 분포를 히스토그램과 박스 플롯(상자수염도)으로 정밀 비교합니다.
            </p>
          </div>
        </div>

        {/* Top Controls: Mode Switcher & Collapse */}
        <div className="flex items-center gap-2">
          {/* Chart Type Selector */}
          <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs font-bold">
            <button
              onClick={() => setChartType('histogram')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                chartType === 'histogram'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>히스토그램</span>
            </button>
            <button
              onClick={() => setChartType('boxplot')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                chartType === 'boxplot'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>박스 플롯</span>
            </button>
          </div>

          {/* Toggle Accordion */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title={isExpanded ? '분포 차트 접기' : '분포 차트 펼치기'}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content Area */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Filter & Configuration Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            {/* Dimension Selection */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-600">분석 기준:</span>
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
                <button
                  onClick={() => setDimension('class')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                    dimension === 'class'
                      ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>학급별 비교 (반별)</span>
                </button>
                <button
                  onClick={() => setDimension('subject')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                    dimension === 'subject'
                      ? 'bg-blue-50 text-blue-700 shadow-2xs border border-blue-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>과목별 비교 (교과별)</span>
                </button>
              </div>

              {/* Target Selector depending on Dimension */}
              {dimension === 'class' ? (
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="font-semibold text-slate-500">비교 과목:</span>
                  <select
                    value={targetSubject}
                    onChange={(e) => setTargetSubject(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all_avg">⭐ 전과목 종합 평균</option>
                    {currentSubjects.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 ml-1">
                  <span className="font-semibold text-slate-500">대상 학급:</span>
                  <select
                    value={targetClass}
                    onChange={(e) =>
                      setTargetClass(e.target.value === 'all' ? 'all' : Number(e.target.value))
                    }
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="all">전체 학년</option>
                    {availableClasses.map((c) => (
                      <option key={c} value={c}>
                        {c}반
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Histogram Specific Toggles (Only when chartType === 'histogram') */}
            {chartType === 'histogram' && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setBinType('10-points')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      binType === '10-points'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    10점 단위 구간
                  </button>
                  <button
                    onClick={() => setBinType('achievement')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      binType === 'achievement'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    성취도 5단계 (A~E)
                  </button>
                </div>

                <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setHistUnit('count')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                      histUnit === 'count'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="학생 수(명)로 표시"
                  >
                    <Hash className="w-3 h-3" />
                    <span>인원(명)</span>
                  </button>
                  <button
                    onClick={() => setHistUnit('percent')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all ${
                      histUnit === 'percent'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="비율(%)로 표시"
                  >
                    <Percent className="w-3 h-3" />
                    <span>비율(%)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Toggle Summary Table Button */}
            <button
              onClick={() => setShowStatsTable(!showStatsTable)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border transition-all ${
                showStatsTable
                  ? 'bg-slate-200/80 text-slate-800 border-slate-300 font-bold'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>통계 요약표 {showStatsTable ? '숨기기' : '보기'}</span>
            </button>
          </div>

          {/* Quick Stat Headline */}
          {summaryNotice && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>{summaryNotice.label}</strong> 기준 통계 요약: 응시자{' '}
                  <strong className="text-blue-700">{summaryNotice.count}명</strong> | 평균{' '}
                  <strong className="text-blue-700">{summaryNotice.mean}점</strong> | 중앙값{' '}
                  <strong className="text-blue-700">{summaryNotice.median}점</strong> |
                  사분위범위(IQR){' '}
                  <strong className="text-blue-700">{summaryNotice.iqr}점</strong>
                </span>
              </div>
              <span className="text-[11px] text-blue-700 font-medium">
                {dimension === 'class'
                  ? `비교 대상 과목: ${activeSubjectName}`
                  : `비교 대상 학급: ${targetClass === 'all' ? '전체 학년' : `${targetClass}반`}`}
              </span>
            </div>
          )}

          {/* Main Visualizer Chart: Histogram OR Box Plot */}
          {chartType === 'histogram' ? (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>
                      {dimension === 'class'
                        ? `[${activeSubjectName}] 학급별 점수대 도수분포 히스토그램`
                        : `[${targetClass === 'all' ? '전체 학년' : `${targetClass}반`}] 과목별 점수대 도수분포 히스토그램`}
                    </span>
                    <span className="text-xs font-normal text-slate-500">
                      ({histUnit === 'count' ? '인원수: 명' : '비율: %'})
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {binType === '10-points'
                      ? '10점 단위로 구간을 나누어 각 집단의 점수 분포 밀도를 비교합니다.'
                      : '성취평가제 기준(A: 90이상, B: 80~89, C: 70~79, D: 60~69, E: 60미만) 등급별 분포를 비교합니다.'}
                  </p>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={histogramData}
                    margin={{ top: 15, right: 25, left: 0, bottom: 25 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                      unit={histUnit === 'percent' ? '%' : '명'}
                    />
                    <RechartsTooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        return (
                          <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs max-w-xs">
                            <div className="font-extrabold text-blue-300 border-b border-slate-700 pb-1.5 mb-2">
                              구간: {label}
                            </div>
                            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                              {payload.map((entry: any, i: number) => {
                                const countVal = entry.payload[`${entry.dataKey}_count`] ?? entry.value;
                                const percentVal = entry.payload[`${entry.dataKey}_percent`] ?? entry.value;
                                return (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between gap-3 text-[11px]"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span
                                        className="w-2.5 h-2.5 rounded-xs shrink-0"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-slate-200 font-medium">
                                        {entry.name}
                                      </span>
                                    </div>
                                    <div className="font-bold text-slate-100">
                                      {countVal}명{' '}
                                      <span className="text-slate-400 font-normal">
                                        ({percentVal}%)
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 10, fontSize: '11px', fontWeight: 'bold' }}
                    />
                    {histogramSeries.map((series) => (
                      <Bar
                        key={series.key}
                        dataKey={series.key}
                        name={series.name}
                        fill={series.color}
                        radius={[4, 4, 0, 0]}
                        maxBarSize={44}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <BoxPlotChart
              data={boxPlotData}
              title={
                dimension === 'class'
                  ? `[${activeSubjectName}] 학급별 5수치 요약 및 분산도 박스 플롯 (상자수염도)`
                  : `[${targetClass === 'all' ? '전체 학년' : `${targetClass}반`}] 과목별 5수치 요약 및 분산도 박스 플롯`
              }
              subtitle="최소값, 1사분위수(Q1, 25%), 중앙값(50%), 평균(♦), 3사분위수(Q3, 75%), 최대값 및 이상치를 한눈에 파악합니다."
              height={380}
            />
          )}

          {/* Detailed Statistics Summary Table */}
          {showStatsTable && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <TableIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    {dimension === 'class'
                      ? `[${activeSubjectName}] 학급별 5수치 요약 및 통계 지표표`
                      : `[${targetClass === 'all' ? '전체 학년' : `${targetClass}반`}] 과목별 5수치 요약 및 통계 지표표`}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  IQR(사분위범위) = Q3 - Q1 (점수 집중도 및 편차 지표)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">구분</th>
                      <th className="py-2.5 px-3 text-center">응시 인원</th>
                      <th className="py-2.5 px-3 text-center text-blue-700 font-black">평균(Mean)</th>
                      <th className="py-2.5 px-3 text-center text-slate-900 font-black">중앙값(Median)</th>
                      <th className="py-2.5 px-3 text-center">표준편차(σ)</th>
                      <th className="py-2.5 px-3 text-center text-emerald-700">최고점(Max)</th>
                      <th className="py-2.5 px-3 text-center text-blue-600">상위 25%(Q3)</th>
                      <th className="py-2.5 px-3 text-center text-slate-500">하위 25%(Q1)</th>
                      <th className="py-2.5 px-3 text-center text-rose-600">최저점(Min)</th>
                      <th className="py-2.5 px-3 text-center text-purple-700 font-semibold">사분위범위(IQR)</th>
                      <th className="py-2.5 px-3 text-center">이상치 건수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {boxPlotData.map((stat, idx) => (
                      <tr
                        key={stat.id}
                        className={`hover:bg-blue-50/40 transition-colors ${
                          idx === 0 ? 'bg-slate-50/60 font-bold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-xs shrink-0"
                              style={{ backgroundColor: stat.color }}
                            />
                            <span className="font-bold text-slate-900">{stat.label}</span>
                            {stat.subLabel && (
                              <span className="text-[10px] text-slate-400">({stat.subLabel})</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-medium text-slate-700">
                          {stat.count}명
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-blue-700 bg-blue-50/30">
                          {stat.mean.toFixed(1)}점
                        </td>
                        <td className="py-2.5 px-3 text-center font-black text-slate-900 bg-slate-100/30">
                          {stat.median.toFixed(1)}점
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600">
                          ±{stat.stdDev.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                          {stat.max.toFixed(1)}점
                        </td>
                        <td className="py-2.5 px-3 text-center text-blue-600 font-medium">
                          {stat.q3.toFixed(1)}점
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                          {stat.q1.toFixed(1)}점
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                          {stat.min.toFixed(1)}점
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-purple-700">
                          {stat.iqr.toFixed(1)}점
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {stat.outliers.length > 0 ? (
                            <span className="inline-block px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                              {stat.outliers.length}건
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
