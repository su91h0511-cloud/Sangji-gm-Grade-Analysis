import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Sparkles,
  BarChart2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Student,
  SemesterComprehensiveResult,
  GradeExamSubjectMap,
  StudentExamScores,
} from '../types';
import { getAchievementColor } from '../utils/gradeCalculations';

interface StudentSemesterComparisonPanelProps {
  student: Student;
  allStudents: Student[];
  onSelectStudent: (student: Student) => void;
  sem1Result: SemesterComprehensiveResult | undefined;
  sem2Result: SemesterComprehensiveResult | undefined;
  onOpenReportCard?: (student: Student) => void;
  subjectConfigs: GradeExamSubjectMap;
  scores: StudentExamScores;
}

export const StudentSemesterComparisonPanel: React.FC<StudentSemesterComparisonPanelProps> = ({
  student,
  allStudents,
  onSelectStudent,
  sem1Result,
  sem2Result,
  onOpenReportCard,
}) => {
  // Navigation indices
  const currentIndex = useMemo(() => {
    return allStudents.findIndex((s) => s.id === student.id);
  }, [allStudents, student]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectStudent(allStudents[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < allStudents.length - 1) {
      onSelectStudent(allStudents[currentIndex + 1]);
    }
  };

  // 1학기 vs 2학기 Metrics
  const sem1Avg = sem1Result ? sem1Result.combinedAverage : null;
  const sem2Avg = sem2Result ? sem2Result.combinedAverage : null;
  const avgDiff =
    sem1Avg !== null && sem2Avg !== null
      ? Math.round((sem2Avg - sem1Avg) * 10) / 10
      : null;

  const sem1Rank = sem1Result ? sem1Result.gradeRank : null;
  const sem2Rank = sem2Result ? sem2Result.gradeRank : null;
  const rankDiff =
    sem1Rank !== null && sem2Rank !== null ? sem1Rank - sem2Rank : null;

  const sem1ClassRank = sem1Result ? sem1Result.classRank : null;
  const sem2ClassRank = sem2Result ? sem2Result.classRank : null;
  const classRankDiff =
    sem1ClassRank !== null && sem2ClassRank !== null
      ? sem1ClassRank - sem2ClassRank
      : null;

  const sem1Total = sem1Result ? sem1Result.combinedTotal : null;
  const sem2Total = sem2Result ? sem2Result.combinedTotal : null;
  const totalDiff =
    sem1Total !== null && sem2Total !== null
      ? Math.round((sem2Total - sem1Total) * 10) / 10
      : null;

  // Subjects union across both semesters
  const allSubjects = useMemo(() => {
    const subjects = new Set<string>();
    if (sem1Result?.subjectCombined) {
      Object.keys(sem1Result.subjectCombined).forEach((s) => subjects.add(s));
    }
    if (sem2Result?.subjectCombined) {
      Object.keys(sem2Result.subjectCombined).forEach((s) => subjects.add(s));
    }
    return Array.from(subjects);
  }, [sem1Result, sem2Result]);

  // Subject-by-subject comparison rows
  const subjectRows = useMemo(() => {
    return allSubjects.map((subj) => {
      const s1Info = sem1Result?.subjectCombined[subj];
      const s2Info = sem2Result?.subjectCombined[subj];

      const s1AvgVal = s1Info?.average ?? null;
      const s2AvgVal = s2Info?.average ?? null;

      const diff =
        s1AvgVal !== null && s2AvgVal !== null
          ? Math.round((s2AvgVal - s1AvgVal) * 10) / 10
          : null;

      return {
        subject: subj,
        sem1Score1: s1Info?.score1 ?? null,
        sem1Score2: s1Info?.score2 ?? null,
        sem1Avg: s1AvgVal,
        sem1Ach: s1Info?.achievement ?? '-',
        sem2Score1: s2Info?.score1 ?? null,
        sem2Score2: s2Info?.score2 ?? null,
        sem2Avg: s2AvgVal,
        sem2Ach: s2Info?.achievement ?? '-',
        diff,
      };
    });
  }, [allSubjects, sem1Result, sem2Result]);

  // Top gained & lost subjects
  const { topGained, topLost } = useMemo(() => {
    const validDiffs = subjectRows.filter((r) => r.diff !== null) as Array<
      (typeof subjectRows)[0] & { diff: number }
    >;

    if (validDiffs.length === 0) {
      return { topGained: null, topLost: null };
    }

    const sortedGains = [...validDiffs].sort((a, b) => b.diff - a.diff);
    const topG = sortedGains[0].diff > 0 ? sortedGains[0] : null;

    const sortedLosses = [...validDiffs].sort((a, b) => a.diff - b.diff);
    const topL = sortedLosses[0].diff < 0 ? sortedLosses[0] : null;

    return { topGained: topG, topLost: topL };
  }, [subjectRows]);

  // Chart data for comparing Sem1 vs Sem2 by subject
  const chartData = useMemo(() => {
    return subjectRows
      .filter((r) => r.sem1Avg !== null || r.sem2Avg !== null)
      .map((r) => ({
        subject: r.subject,
        '1학기 종합': r.sem1Avg ?? 0,
        '2학기 종합': r.sem2Avg ?? 0,
        등락폭: r.diff ?? 0,
      }));
  }, [subjectRows]);

  return (
    <div className="bg-white rounded-2xl border-2 border-blue-200/80 shadow-md p-5 sm:p-6 space-y-5">
      {/* Top Header & Student Selector Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-600 text-white flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              학기 간(1학기 ↔ 2학기) 성적 등락 분석
            </span>
            <span className="text-xs text-slate-500 font-medium">
              선택 학생 심층 비교
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>{student.name} 학생 학기 간 학업 성취도 변화</span>
            <span className="text-sm font-semibold text-slate-500">
              ({student.grade}학년 {student.classNum}반 {student.studentNum}번)
            </span>
          </h3>
        </div>

        {/* Student Switcher Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrev}
              disabled={currentIndex <= 0}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="이전 학생"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={student.id}
              onChange={(e) => {
                const target = allStudents.find((s) => s.id === e.target.value);
                if (target) onSelectStudent(target);
              }}
              className="px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none"
            >
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.classNum}반 {s.studentNum}번 {s.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleNext}
              disabled={currentIndex >= allStudents.length - 1}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
              title="다음 학생"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onOpenReportCard && (
            <button
              onClick={() => onOpenReportCard(student)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
            >
              <span>개인 성적표</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* KPI Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Combined Average Change */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-500">
            학기 종합 평균 등락폭
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 mr-1">1학기:</span>
              <span className="text-base font-black text-slate-700">
                {sem1Avg !== null ? `${sem1Avg.toFixed(1)}점` : '-'}
              </span>
              <span className="text-xs text-slate-400 mx-1.5">➔</span>
              <span className="text-xs text-slate-400 mr-1">2학기:</span>
              <span className="text-base font-black text-blue-700">
                {sem2Avg !== null ? `${sem2Avg.toFixed(1)}점` : '-'}
              </span>
            </div>
          </div>

          {avgDiff !== null ? (
            <div
              className={`px-3 py-1.5 rounded-lg flex items-center justify-between border ${
                avgDiff > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : avgDiff < 0
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1 font-black text-sm">
                {avgDiff > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>+{avgDiff.toFixed(1)}점</span>
                  </>
                ) : avgDiff < 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>{avgDiff.toFixed(1)}점</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 text-slate-500" />
                    <span>0.0점</span>
                  </>
                )}
              </div>
              <span className="text-xs font-bold">
                {avgDiff > 0
                  ? '상승 ▲'
                  : avgDiff < 0
                  ? '하락 ▼'
                  : '변동 없음'}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400">데이터 불충분</div>
          )}
        </div>

        {/* 2. Grade Rank Change */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>전교 석차(학년 등수) 변동</span>
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 mr-1">1학기:</span>
              <span className="text-base font-black text-slate-700">
                {sem1Rank !== null ? `${sem1Rank}위` : '-'}
              </span>
              <span className="text-xs text-slate-400 mx-1.5">➔</span>
              <span className="text-xs text-slate-400 mr-1">2학기:</span>
              <span className="text-base font-black text-amber-700">
                {sem2Rank !== null ? `${sem2Rank}위` : '-'}
              </span>
            </div>
          </div>

          {rankDiff !== null ? (
            <div
              className={`px-3 py-1.5 rounded-lg flex items-center justify-between border ${
                rankDiff > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : rankDiff < 0
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1 font-black text-sm">
                {rankDiff > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>▲ {rankDiff}계단</span>
                  </>
                ) : rankDiff < 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>▼ {Math.abs(rankDiff)}계단</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 text-slate-500" />
                    <span>변동 없음</span>
                  </>
                )}
              </div>
              <span className="text-xs font-bold">
                {rankDiff > 0
                  ? '석차 상승'
                  : rankDiff < 0
                  ? '석차 하락'
                  : '석차 유지'}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400">데이터 불충분</div>
          )}
        </div>

        {/* 3. Class Rank Change */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-500 flex items-center justify-between">
            <span>반별 등수({student.classNum}반) 변동</span>
            <Award className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 mr-1">1학기:</span>
              <span className="text-base font-black text-slate-700">
                {sem1ClassRank !== null ? `${sem1ClassRank}위` : '-'}
              </span>
              <span className="text-xs text-slate-400 mx-1.5">➔</span>
              <span className="text-xs text-slate-400 mr-1">2학기:</span>
              <span className="text-base font-black text-indigo-700">
                {sem2ClassRank !== null ? `${sem2ClassRank}위` : '-'}
              </span>
            </div>
          </div>

          {classRankDiff !== null ? (
            <div
              className={`px-3 py-1.5 rounded-lg flex items-center justify-between border ${
                classRankDiff > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : classRankDiff < 0
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <div className="flex items-center gap-1 font-black text-sm">
                {classRankDiff > 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>▲ {classRankDiff}계단</span>
                  </>
                ) : classRankDiff < 0 ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span>▼ {Math.abs(classRankDiff)}계단</span>
                  </>
                ) : (
                  <>
                    <Minus className="w-4 h-4 text-slate-500" />
                    <span>변동 없음</span>
                  </>
                )}
              </div>
              <span className="text-xs font-bold">
                {classRankDiff > 0
                  ? '반 등수 상승'
                  : classRankDiff < 0
                  ? '반 등수 하락'
                  : '유지'}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400">데이터 불충분</div>
          )}
        </div>

        {/* 4. Total Score Change */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
          <div className="text-xs font-bold text-slate-500">
            학기 종합 총점 등락
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 mr-1">1학기:</span>
              <span className="text-base font-black text-slate-700">
                {sem1Total !== null ? `${sem1Total}점` : '-'}
              </span>
              <span className="text-xs text-slate-400 mx-1.5">➔</span>
              <span className="text-xs text-slate-400 mr-1">2학기:</span>
              <span className="text-base font-black text-slate-900">
                {sem2Total !== null ? `${sem2Total}점` : '-'}
              </span>
            </div>
          </div>

          {totalDiff !== null ? (
            <div
              className={`px-3 py-1.5 rounded-lg flex items-center justify-between border ${
                totalDiff > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : totalDiff < 0
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span className="font-black text-sm">
                {totalDiff > 0 ? `+${totalDiff}점` : `${totalDiff}점`}
              </span>
              <span className="text-xs font-bold">
                {totalDiff >= 0 ? '누적 총점 증가' : '누적 총점 감소'}
              </span>
            </div>
          ) : (
            <div className="text-xs text-slate-400">데이터 불충분</div>
          )}
        </div>
      </div>

      {/* Main Comparison Section: Subject Table + Side Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Subject-by-Subject Table */}
        <div className="lg:col-span-7 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>과목별 학기 간(1학기 ↔ 2학기) 성적 등락 상세 내역</span>
            </h4>
            <span className="text-[11px] text-slate-500">
              * 1차+2차 합산 평균 기준
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2 px-3 text-center">과목명</th>
                  <th className="py-2 px-3 text-center bg-slate-100/90 border-l border-slate-200">
                    1학기 종합
                  </th>
                  <th className="py-2 px-3 text-center bg-blue-50/50 border-l border-slate-200">
                    2학기 종합
                  </th>
                  <th className="py-2 px-3 text-center bg-amber-50/40 border-l border-slate-200 text-amber-950 font-black">
                    등락폭 (화살표/수치)
                  </th>
                  <th className="py-2 px-3 text-center border-l border-slate-200">
                    성취도 변화
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subjectRows.map((r) => {
                  const s1AchStyle = getAchievementColor(r.sem1Ach);
                  const s2AchStyle = getAchievementColor(r.sem2Ach);

                  return (
                    <tr key={r.subject} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-900 text-center">
                        {r.subject}
                      </td>

                      <td className="py-2 px-3 text-center border-l border-slate-200">
                        {r.sem1Avg !== null ? (
                          <div>
                            <span className="font-bold text-slate-800">
                              {r.sem1Avg.toFixed(1)}점
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({r.sem1Score1 ?? '-'}/{r.sem1Score2 ?? '-'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-center border-l border-slate-200 bg-blue-50/20">
                        {r.sem2Avg !== null ? (
                          <div>
                            <span className="font-bold text-blue-700">
                              {r.sem2Avg.toFixed(1)}점
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              ({r.sem2Score1 ?? '-'}/{r.sem2Score2 ?? '-'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-center border-l border-slate-200">
                        {r.diff !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border ${
                              r.diff > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : r.diff < 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {r.diff > 0 ? (
                              <>
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>+{r.diff.toFixed(1)}점 ▲</span>
                              </>
                            ) : r.diff < 0 ? (
                              <>
                                <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>{r.diff.toFixed(1)}점 ▼</span>
                              </>
                            ) : (
                              <>
                                <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>0.0점 -</span>
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-center border-l border-slate-200">
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${s1AchStyle.bg} border ${s1AchStyle.border}`}
                          >
                            {r.sem1Ach}
                          </span>
                          <span className="text-slate-400 text-[10px]">➔</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-black ${s2AchStyle.bg} border ${s2AchStyle.border}`}
                          >
                            {r.sem2Ach}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Chart: 1학기 vs 2학기 Bar Comparison */}
        <div className="lg:col-span-5 space-y-2">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <BarChart2 className="w-4 h-4 text-blue-600" />
            <span>과목별 학기 간 성적 비교 차트</span>
          </h4>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="subject"
                    tick={{ fill: '#334155', fontSize: 10, fontWeight: 700 }}
                  />
                  <YAxis domain={[30, 100]} tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Tooltip
                    contentStyle={{
                      fontSize: '11px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                    }}
                    formatter={(val: any) => [`${val}점`]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '2px' }} />
                  <Bar
                    dataKey="1학기 종합"
                    fill="#94a3b8"
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="2학기 종합"
                    fill="#2563eb"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Qualitative Growth Insight Box */}
      <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-200/80 space-y-2.5">
        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>💡 {student.name} 학생의 학기 간 성장 진단 분석</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Top Gained */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-emerald-900 mb-0.5">
                최대 성적 상승 과목
              </div>
              <div className="text-slate-600">
                {topGained ? (
                  <span>
                    <strong className="text-slate-900 font-bold">
                      {topGained.subject}
                    </strong>{' '}
                    과목이 1학기 {topGained.sem1Avg?.toFixed(1)}점에서 2학기{' '}
                    {topGained.sem2Avg?.toFixed(1)}점으로{' '}
                    <strong className="text-emerald-700 font-black">
                      +{topGained.diff.toFixed(1)}점 (▲)
                    </strong>{' '}
                    가장 크게 성장했습니다.
                  </span>
                ) : (
                  '학기 간 점수가 상승한 과목이 없습니다.'
                )}
              </div>
            </div>
          </div>

          {/* Top Lost */}
          <div className="bg-white p-3 rounded-lg border border-slate-200 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900 mb-0.5">
                보완 권장(하락) 과목
              </div>
              <div className="text-slate-600">
                {topLost ? (
                  <span>
                    <strong className="text-slate-900 font-bold">
                      {topLost.subject}
                    </strong>{' '}
                    과목이 1학기 대비{' '}
                    <strong className="text-rose-700 font-black">
                      {topLost.diff.toFixed(1)}점 (▼)
                    </strong>{' '}
                    하락하여 기본 개념 복습 및 추가 지도가 권장됩니다.
                  </span>
                ) : (
                  '점수가 하락한 과목 없이 전반적으로 우수한 성취를 유지하고 있습니다.'
                )}
              </div>
            </div>
          </div>
        </div>

        {avgDiff !== null && (
          <p className="text-xs text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
            {avgDiff > 0 ? (
              <span>
                {student.name} 학생은 1학기 대비 2학기 전과목 종합 평균이{' '}
                <strong className="text-emerald-700 font-bold">
                  +{avgDiff.toFixed(1)}점 상승
                </strong>
                하였으며, 전교 석차 또한{' '}
                {rankDiff && rankDiff > 0 ? (
                  <strong className="text-emerald-700 font-bold">
                    {rankDiff}계단 향상
                  </strong>
                ) : (
                  '안정적으로 유지'
                )}
                되어 학업 역량이 꾸준히 발전하고 있습니다.
              </span>
            ) : avgDiff < 0 ? (
              <span>
                {student.name} 학생은 1학기 대비 2학기 종합 평균이{' '}
                <strong className="text-rose-700 font-bold">
                  {avgDiff.toFixed(1)}점 다소 하락
                </strong>
                하였습니다. 취약 과목 중심의 오답 분석과 자기주도 학습 습관
                보완을 통한 성적 회복이 기대됩니다.
              </span>
            ) : (
              <span>
                {student.name} 학생은 1학기와 2학기 종합 평균이 동일하여 매우
                안정적인 학업 성취도를 유지하고 있습니다.
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
};
