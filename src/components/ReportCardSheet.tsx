import React, { useState, useMemo } from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Trophy,
  Award,
  TrendingUp,
  User,
  Compass,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  Student,
  ExamInfo,
  Grade,
  StudentCalculatedResult,
  SubjectStats,
  GradeExamSubjectMap,
  StudentExamScores,
} from '../types';
import {
  getAchievementColor,
  getStudentExamTrendsWithComparisons,
} from '../utils/gradeCalculations';

interface ReportCardSheetProps {
  student: Student;
  result: StudentCalculatedResult;
  allResults: StudentCalculatedResult[];
  allStudentsInGrade: Student[];
  grade: Grade;
  currentExam: ExamInfo;
  currentSubjects: string[];
  subjectStats: SubjectStats[];
  subjectConfigs: GradeExamSubjectMap;
  scores: StudentExamScores;
  isBatchPrint?: boolean;
}

export const ReportCardSheet: React.FC<ReportCardSheetProps> = ({
  student,
  result,
  allResults,
  allStudentsInGrade,
  grade,
  currentExam,
  currentSubjects,
  subjectStats,
  subjectConfigs,
  scores,
}) => {
  const [selectedTrendSubject, setSelectedTrendSubject] = useState<string>('all');

  // Radar Chart Data: Student Score vs Grade Average
  const radarData = useMemo(() => {
    return currentSubjects.map((subj) => {
      const studentScore = result.scores[subj] ?? 0;
      const stat = subjectStats.find((s) => s.subject === subj);
      const gradeAvg = stat ? stat.average : 0;

      return {
        subject: subj,
        학생점수: studentScore,
        학년평균: gradeAvg,
        fullMark: 100,
      };
    });
  }, [result, currentSubjects, subjectStats]);

  // Exam Trend Line Data across the 4 exams
  const comparisonTrends = useMemo(() => {
    return getStudentExamTrendsWithComparisons(
      student,
      allStudentsInGrade,
      subjectConfigs,
      scores
    );
  }, [student, allStudentsInGrade, subjectConfigs, scores]);

  // Prepared data for the line chart based on selectedTrendSubject
  const chartTrendData = useMemo(() => {
    return comparisonTrends.map((ct) => {
      let myScore: number | null = null;
      let gradeAverage: number | null = null;
      let top10Average: number | null = null;

      if (selectedTrendSubject === 'all') {
        myScore = ct.myAverage;
        gradeAverage = ct.gradeAverage;
        top10Average = ct.top10Average;
      } else {
        const subjData = ct.subjects[selectedTrendSubject];
        if (subjData) {
          myScore = subjData.myScore;
          gradeAverage = subjData.gradeAverage;
          top10Average = subjData.top10Average;
        }
      }

      return {
        examId: ct.examId,
        examName: ct.examName,
        shortName: ct.shortName,
        '내 점수': myScore,
        '전체 평균': gradeAverage,
        '상위(10명) 평균': top10Average,
      };
    });
  }, [comparisonTrends, selectedTrendSubject]);

  // Automated Feedback generation
  const feedback = useMemo(() => {
    const strongSubjects: string[] = [];
    const weakSubjects: string[] = [];

    currentSubjects.forEach((subj) => {
      const score = result.scores[subj];
      const stat = subjectStats.find((s) => s.subject === subj);
      if (typeof score === 'number' && stat) {
        if (score >= 90 || score >= stat.average + 10) {
          strongSubjects.push(subj);
        } else if (score < 60 || score < stat.average - 10) {
          weakSubjects.push(subj);
        }
      }
    });

    let overallRemark = '';
    if (result.percentile <= 15) {
      overallRemark =
        '전체 학년 상위권의 탁월한 학업 성취도를 유지하고 있습니다. 현재의 학습 습관을 지속하여 심화 학습에 도전하는 것을 권장합니다.';
    } else if (result.percentile <= 40) {
      overallRemark =
        '대부분의 과목에서 양호하고 안정적인 성취를 보이고 있습니다. 취약 과목을 보완하면 상위권 도약이 충분히 가능합니다.';
    } else if (result.percentile <= 70) {
      overallRemark =
        '기초적인 학습 역량은 갖추고 있으나 시험 과목별 편차가 다소 존재합니다. 개념 복습과 오답 정리를 체계화하면 성적 향상이 기대됩니다.';
    } else {
      overallRemark =
        '핵심 기본 개념에 대한 단계별 학습과 보충 지도가 필요합니다. 자신감 있는 과목부터 학습 성공 경험을 쌓아가는 것이 효과적입니다.';
    }

    return {
      strongSubjects,
      weakSubjects,
      overallRemark,
    };
  }, [result, currentSubjects, subjectStats]);

  return (
    <div className="report-page-break bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-4">
      {/* Report Card Title Header */}
      <div className="border-b-2 border-slate-800 pb-4 report-section-block">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <span className="text-xs font-extrabold tracking-widest text-blue-600 uppercase">
            Middle School Academic Report Card
          </span>
          <span className="text-xs text-slate-500 font-medium">
            평가 기준일: 2026학년도 {currentExam.name}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight text-center py-1">
          개 인 별 성 적 분 석 표
        </h2>
        <p className="text-xs text-slate-500 text-center font-medium">
          ( {grade}학년 {currentExam.name} 지필평가 분석 결과 통지서 )
        </p>
      </div>

      {/* Student Profile & Quick Rank Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 report-section-block print:bg-slate-50 print:border-slate-300">
        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4 flex flex-col justify-center">
          <div className="text-xs text-slate-500 font-semibold mb-1">학생 기본정보</div>
          <div className="text-xl font-black text-slate-900 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600 print:text-slate-800" />
            <span>{student.name}</span>
          </div>
          <div className="text-xs text-slate-700 mt-1 font-bold">
            {grade}학년 {student.classNum}반 {student.studentNum}번
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 print:border print:border-amber-200">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">전체 석차 (전교)</div>
            <div className="text-xl font-black text-slate-900">
              {result.gradeRank}
              <span className="text-xs text-slate-500 font-normal ml-1">
                / {result.totalInGrade}명
              </span>
            </div>
            <div className="text-[11px] text-amber-700 font-bold">
              상위 {result.percentile}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 print:border print:border-indigo-200">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">반별 등수 (학급)</div>
            <div className="text-xl font-black text-slate-900">
              {result.classRank}
              <span className="text-xs text-slate-500 font-normal ml-1">
                / {result.totalInClass}명
              </span>
            </div>
            <div className="text-[11px] text-indigo-700 font-bold">
              {student.classNum}반 내 등수
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 print:border print:border-blue-200">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">총점 및 평균</div>
            <div className="text-xl font-black text-blue-700">
              {result.average.toFixed(1)}
              <span className="text-xs font-normal text-slate-500 ml-1">점</span>
            </div>
            <div className="text-[11px] text-slate-500">
              총점 {result.total}점 ({result.validSubjectCount}과목)
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Subject Score Table */}
      <div className="space-y-2 report-section-block">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-blue-600 print:hidden" />
          과목별 세부 성적 및 석차 내역
        </h3>

        <div className="overflow-x-auto rounded-xl border border-slate-200 print:border-slate-300">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold print:bg-slate-100 print:border-slate-300">
                <th className="py-2.5 px-4 text-center">과목명</th>
                <th className="py-2.5 px-3 text-center text-blue-800 font-black">내 점수</th>
                <th className="py-2.5 px-3 text-center text-slate-600">학년 평균</th>
                <th className="py-2.5 px-3 text-center text-slate-600">반 평균</th>
                <th className="py-2.5 px-3 text-center text-slate-600">최고점</th>
                <th className="py-2.5 px-3 text-center">성취도</th>
                <th className="py-2.5 px-3 text-center text-amber-900 font-bold">
                  과목 전체 석차
                </th>
                <th className="py-2.5 px-3 text-center text-indigo-900 font-bold">
                  과목 반별 등수
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 print:divide-slate-300">
              {currentSubjects.map((subj) => {
                const score = result.scores[subj];
                const info = result.subjectAchievements[subj];
                const stat = subjectStats.find((s) => s.subject === subj);

                // Calculate class average
                const classStudents = allResults.filter(
                  (r) => r.student.classNum === student.classNum
                );
                let classSum = 0;
                let classCnt = 0;
                classStudents.forEach((cs) => {
                  const sc = cs.scores[subj];
                  if (typeof sc === 'number' && !isNaN(sc)) {
                    classSum += sc;
                    classCnt++;
                  }
                });
                const classAvg = classCnt > 0 ? (classSum / classCnt).toFixed(1) : '-';
                const achStyle = getAchievementColor(info?.achievement || '-');

                return (
                  <tr key={subj} className="hover:bg-slate-50/70">
                    <td className="py-2 px-4 font-bold text-slate-900 text-center">
                      {subj}
                    </td>
                    <td className="py-2 px-3 text-center font-black text-sm text-blue-700 bg-blue-50/30 print:bg-slate-50">
                      {score !== null ? `${score}점` : '미응시'}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600">
                      {stat ? `${stat.average.toFixed(1)}점` : '-'}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600">
                      {classAvg !== '-' ? `${classAvg}점` : '-'}
                    </td>
                    <td className="py-2 px-3 text-center text-slate-600 font-semibold">
                      {stat ? `${stat.max}점` : '-'}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-black ${achStyle.bg} border ${achStyle.border}`}
                      >
                        {info?.achievement || '-'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-amber-900">
                      {info && info.gradeRank > 0 ? (
                        <span>
                          {info.gradeRank}
                          <span className="text-[10px] font-normal text-slate-400">
                            /{result.totalInGrade}
                          </span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-2 px-3 text-center font-bold text-indigo-900">
                      {info && info.classRank > 0 ? (
                        <span>
                          {info.classRank}
                          <span className="text-[10px] font-normal text-slate-400">
                            /{result.totalInClass}
                          </span>
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Charts: Radar Chart & Exam Progression */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1 report-section-block">
        {/* Radar Chart */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 print:bg-white print:border-slate-300">
          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
            <span>과목별 성취 균형도 (내 점수 vs 학년 평균)</span>
            <span className="text-[11px] text-blue-600 font-medium print:hidden">방사형 다이어그램</span>
          </h4>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius={78}>
                <PolarGrid stroke="#cbd5e1" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 700 }}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 9 }}
                />
                <Radar
                  name="내 점수"
                  dataKey="학생점수"
                  stroke="#2563eb"
                  fill="#3b82f6"
                  fillOpacity={0.45}
                />
                <Radar
                  name="학년 평균"
                  dataKey="학년평균"
                  stroke="#94a3b8"
                  fill="#94a3b8"
                  fillOpacity={0.2}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Tooltip
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Exam Trend across 4 exams */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-2.5 print:bg-white print:border-slate-300">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600 print:hidden" />
                <span>시험별 평균 성적 추이 (1·2학기)</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                내 점수, 학년 전체 평균, 상위 10명 평균 비교
              </p>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-0.5 print:hidden">
              <button
                type="button"
                onClick={() => setSelectedTrendSubject('all')}
                className={`px-2 py-0.5 text-[11px] font-bold rounded-md transition-all ${
                  selectedTrendSubject === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                전과목 평균
              </button>
              {currentSubjects.map((subj) => (
                <button
                  key={subj}
                  type="button"
                  onClick={() => setSelectedTrendSubject(subj)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded-md whitespace-nowrap transition-all ${
                    selectedTrendSubject === subj
                      ? 'bg-blue-600 text-white shadow-2xs font-bold'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {subj}
                </button>
              ))}
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartTrendData}
                margin={{ top: 10, right: 15, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="shortName"
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                />
                <YAxis domain={[30, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any, name: string) => [
                    val !== null ? `${val}점` : '미응시',
                    name,
                  ]}
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '2px' }} />
                <Line
                  type="monotone"
                  dataKey="내 점수"
                  name={
                    selectedTrendSubject === 'all'
                      ? '내 평균 점수'
                      : `내 ${selectedTrendSubject} 점수`
                  }
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#2563eb' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="전체 평균"
                  name={
                    selectedTrendSubject === 'all'
                      ? '전체 평균 (학년)'
                      : `${selectedTrendSubject} 전체 평균`
                  }
                  stroke="#64748b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#64748b' }}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="상위(10명) 평균"
                  name={
                    selectedTrendSubject === 'all'
                      ? '상위 10명 평균'
                      : `${selectedTrendSubject} 상위 10명 평균`
                  }
                  stroke="#d97706"
                  strokeWidth={2}
                  dot={{ r: 3.5, fill: '#d97706' }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Numerical summary comparison cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
            {chartTrendData.map((item) => {
              const diffWithAvg =
                item['내 점수'] !== null && item['전체 평균'] !== null
                  ? Math.round((item['내 점수'] - item['전체 평균']) * 10) / 10
                  : null;

              return (
                <div
                  key={item.examId}
                  className="p-2 rounded-lg bg-white border border-slate-200 text-xs space-y-0.5 print:border-slate-300"
                >
                  <div className="font-bold text-slate-800 text-[11px] border-b border-slate-100 pb-0.5">
                    {item.shortName}
                  </div>
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-500">내 점수:</span>
                    <span className="font-black text-blue-700">
                      {item['내 점수'] !== null ? `${item['내 점수']}점` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-500">전체 평균:</span>
                    <span className="text-slate-700 font-semibold">
                      {item['전체 평균'] !== null ? `${item['전체 평균']}점` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-500">상위 10명:</span>
                    <span className="text-amber-700 font-bold">
                      {item['상위(10명) 평균'] !== null
                        ? `${item['상위(10명) 평균']}점`
                        : '-'}
                    </span>
                  </div>
                  {diffWithAvg !== null && (
                    <div className="text-[9.5px] text-right font-bold pt-0.5 border-t border-slate-100">
                      평균 대비{' '}
                      <span
                        className={
                          diffWithAvg >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }
                      >
                        {diffWithAvg >= 0 ? `+${diffWithAvg}` : diffWithAvg}점
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Qualitative Teacher Analysis & Feedback */}
      {feedback && (
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-2.5 report-section-block print:bg-white print:border-slate-300">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span>📌 담임 교사 종합 소견 및 학업 진단</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start gap-2 print:border-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 print:hidden" />
              <div>
                <div className="font-bold text-emerald-900 mb-0.5">
                  우수 과목 (강점 영역)
                </div>
                <div className="text-slate-600">
                  {feedback.strongSubjects.length > 0
                    ? `${feedback.strongSubjects.join(', ')} 과목에서 높은 성취를 나타내고 있습니다.`
                    : '전반적으로 고른 성취를 유지하고 있습니다.'}
                </div>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex items-start gap-2 print:border-slate-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 print:hidden" />
              <div>
                <div className="font-bold text-amber-900 mb-0.5">
                  보완 권장 과목 (발전 영역)
                </div>
                <div className="text-slate-600">
                  {feedback.weakSubjects.length > 0
                    ? `${feedback.weakSubjects.join(', ')} 과목의 기본 개념 복습 및 보충이 권장됩니다.`
                    : '특별한 취약 과목 없이 균형 있게 성취하고 있습니다.'}
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200 print:border-slate-300">
            {feedback.overallRemark}
          </p>
        </div>
      )}

      {/* School Stamp Sign Area */}
      <div className="pt-3 border-t-2 border-slate-800 flex items-center justify-center text-xs text-slate-600 report-section-block">
        <div className="font-black text-sm text-slate-900 tracking-widest text-center">
          상지여자중학교
        </div>
      </div>
    </div>
  );
};
