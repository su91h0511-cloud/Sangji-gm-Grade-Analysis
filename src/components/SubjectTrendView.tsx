import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { TrendingUp, BarChart3, PieChart, Activity } from 'lucide-react';
import {
  Grade,
  ExamInfo,
  ExamId,
  Student,
  SubjectStats,
  StudentExamScores,
  GradeExamSubjectMap,
  EXAMS,
} from '../types';
import {
  getSubjectTrendsAcrossExams,
  calculateExamResults,
  calculateSubjectStats,
} from '../utils/gradeCalculations';

interface SubjectTrendViewProps {
  grade: Grade;
  currentExam: ExamInfo;
  currentSubjects: string[];
  students: Student[];
  subjectConfigs: GradeExamSubjectMap;
  scores: StudentExamScores;
  subjectStats: SubjectStats[];
}

const COLOR_PALETTE = [
  '#2563eb', // Blue
  '#dc2626', // Red
  '#16a34a', // Green
  '#d97706', // Amber
  '#9333ea', // Purple
  '#0891b2', // Cyan
  '#db2777', // Pink
  '#ea580c', // Orange
  '#4f46e5', // Indigo
  '#059669', // Emerald
];

export const SubjectTrendView: React.FC<SubjectTrendViewProps> = ({
  grade,
  currentExam,
  students,
  subjectConfigs,
  scores,
}) => {
  // Collect all unique subjects across the 4 exams for this grade
  const allGradeSubjects = useMemo(() => {
    const list = new Set<string>();
    EXAMS.forEach((exam) => {
      const subjs = subjectConfigs[`${grade}_${exam.id}`] || [];
      subjs.forEach((s) => list.add(s));
    });
    return Array.from(list);
  }, [grade, subjectConfigs]);

  const [selectedTrendSubjects, setSelectedTrendSubjects] = useState<string[]>([]);

  React.useEffect(() => {
    if (allGradeSubjects.length > 0) {
      setSelectedTrendSubjects(allGradeSubjects.slice(0, 4));
    }
  }, [grade, allGradeSubjects]);

  const toggleTrendSubject = (subj: string) => {
    if (selectedTrendSubjects.includes(subj)) {
      if (selectedTrendSubjects.length > 1) {
        setSelectedTrendSubjects(selectedTrendSubjects.filter((s) => s !== subj));
      }
    } else {
      setSelectedTrendSubjects([...selectedTrendSubjects, subj]);
    }
  };

  // Trend Data for 4 exams
  const trendDataAcrossExams = useMemo(() => {
    const rawTrends = getSubjectTrendsAcrossExams(
      grade,
      students,
      subjectConfigs,
      scores
    );

    return rawTrends.map((t) => {
      const dataPoint: Record<string, any> = {
        name: t.shortLabel,
        fullName: t.examName,
      };
      allGradeSubjects.forEach((subj) => {
        dataPoint[subj] = t.averages[subj] ?? null;
      });
      return dataPoint;
    });
  }, [grade, students, subjectConfigs, scores, allGradeSubjects]);

  const [inspectExamId, setInspectExamId] = useState<ExamId>(currentExam.id);

  React.useEffect(() => {
    setInspectExamId(currentExam.id);
  }, [currentExam.id]);

  const activeInspectExam = useMemo(() => {
    return EXAMS.find((e) => e.id === inspectExamId) || currentExam;
  }, [inspectExamId, currentExam]);

  const inspectSubjects = useMemo(() => {
    return subjectConfigs[`${grade}_${inspectExamId}`] || [];
  }, [grade, inspectExamId, subjectConfigs]);

  const inspectStats = useMemo(() => {
    const studentsInGrade = students.filter((s) => s.grade === grade);
    const results = calculateExamResults(
      studentsInGrade,
      inspectSubjects,
      scores,
      inspectExamId
    );
    return calculateSubjectStats(inspectSubjects, results);
  }, [grade, inspectExamId, inspectSubjects, students, scores]);

  // Class comparison for selected exam
  const classComparisonData = useMemo(() => {
    const classSet = new Set<number>();
    students.filter((s) => s.grade === grade).forEach((s) => classSet.add(s.classNum));
    const classes = Array.from(classSet).sort((a, b) => a - b);

    return inspectSubjects.map((subj) => {
      const row: Record<string, any> = { subject: subj };

      const gradeStat = inspectStats.find((s) => s.subject === subj);
      row['전체평균'] = gradeStat ? gradeStat.average : 0;

      classes.forEach((cNum) => {
        const classStudents = students.filter(
          (s) => s.grade === grade && s.classNum === cNum
        );
        let sum = 0;
        let count = 0;
        classStudents.forEach((st) => {
          const key = `${st.id}_${inspectExamId}`;
          const val = scores[key]?.[subj];
          if (typeof val === 'number' && !isNaN(val)) {
            sum += val;
            count++;
          }
        });
        row[`${cNum}반`] = count > 0 ? Math.round((sum / count) * 10) / 10 : 0;
      });

      return row;
    });
  }, [grade, inspectExamId, inspectSubjects, students, scores, inspectStats]);

  const classList = useMemo(() => {
    const classSet = new Set<number>();
    students.filter((s) => s.grade === grade).forEach((s) => classSet.add(s.classNum));
    return Array.from(classSet).sort((a, b) => a - b);
  }, [students, grade]);

  // Distribution data (A, B, C, D, E) for inspected exam
  const distributionData = useMemo(() => {
    return inspectStats.map((st) => ({
      subject: st.subject,
      A등급: st.distribution.A,
      B등급: st.distribution.B,
      C등급: st.distribution.C,
      D등급: st.distribution.D,
      E등급: st.distribution.E,
    }));
  }, [inspectStats]);

  return (
    <div className="space-y-6">
      {/* 1. Subject Trend Line Chart Across 4 Exams */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {grade}학년 과목별 평균 점수 추이 (4개 시험 비교)
              </h3>
              <p className="text-xs text-slate-500">
                1학기 중간 ➔ 1학기 기말 ➔ 2학기 중간 ➔ 2학기 기말 지필평가 과목 평균의 변동 흐름
              </p>
            </div>
          </div>

          {/* Subject chips for toggling lines */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-slate-400 mr-1 font-medium">과목 선택:</span>
            {allGradeSubjects.map((subj, idx) => {
              const isSelected = selectedTrendSubjects.includes(subj);
              const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
              return (
                <button
                  key={subj}
                  onClick={() => toggleTrendSubject(subj)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: color }}
                  />
                  {subj}
                </button>
              );
            })}
          </div>
        </div>

        {allGradeSubjects.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
            등록된 시험 과목이 없습니다.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendDataAcrossExams}
                margin={{ top: 10, right: 30, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                />
                <YAxis
                  domain={[40, 100]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${val}점`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) =>
                    typeof val === 'number' ? [`${val}점`] : ['미실시/자료없음']
                  }
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                {selectedTrendSubjects.map((subj) => {
                  const subIdx = allGradeSubjects.indexOf(subj);
                  const color = COLOR_PALETTE[subIdx % COLOR_PALETTE.length];
                  return (
                    <Line
                      key={subj}
                      type="monotone"
                      dataKey={subj}
                      name={subj}
                      stroke={color}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: color }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 2. Grid of Class Comparison & Distribution with Exam Selector */}
      <div className="space-y-4">
        {/* Exam filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 px-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span className="text-xs sm:text-sm font-bold text-slate-800">
              시험별 반별 평균 비교 및 성취도 분포 조회:
            </span>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {EXAMS.map((ex) => (
              <button
                key={ex.id}
                onClick={() => setInspectExamId(ex.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  inspectExamId === ex.id
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {ex.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Class Comparison Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  반별 과목 평균 비교 ({activeInspectExam.name})
                </h3>
                <p className="text-xs text-slate-500">
                  학급 간 학업 성취도 편차 및 전체 평균 대비 비교
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={classComparisonData}
                  margin={{ top: 10, right: 20, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="subject"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: any) => [`${val}점`]}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar
                    dataKey="전체평균"
                    fill="#94a3b8"
                    radius={[4, 4, 0, 0]}
                    name="학년 전체"
                  />
                  {classList.map((cNum, idx) => (
                    <Bar
                      key={cNum}
                      dataKey={`${cNum}반`}
                      fill={idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#f59e0b'}
                      radius={[4, 4, 0, 0]}
                      name={`${cNum}반`}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grade Distribution Chart (A, B, C, D, E) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PieChart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  과목별 성취도(A~E) 인원 분포 ({activeInspectExam.name})
                </h3>
                <p className="text-xs text-slate-500">
                  A(90점 이상), B(80점대), C(70점대), D(60점대), E(60점 미만)
                </p>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  margin={{ top: 10, right: 20, left: -15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="subject"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val: any) => [`${val}명`]}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="A등급" fill="#10b981" stackId="stack" name="A (90~100)" />
                  <Bar dataKey="B등급" fill="#3b82f6" stackId="stack" name="B (80~89)" />
                  <Bar dataKey="C등급" fill="#f59e0b" stackId="stack" name="C (70~79)" />
                  <Bar dataKey="D등급" fill="#f97316" stackId="stack" name="D (60~69)" />
                  <Bar dataKey="E등급" fill="#ef4444" stackId="stack" name="E (0~59)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Detailed Subject Statistics Summary Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-blue-600" />
          <h4 className="text-sm font-bold text-slate-900">
            {activeInspectExam.name} 과목별 상세 통계표 (평균 / 표준편차 / 최고점 / 최저점)
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-2.5 px-4">과목명</th>
                <th className="py-2.5 px-3 text-center">응시 인원</th>
                <th className="py-2.5 px-3 text-center text-blue-700">평균</th>
                <th className="py-2.5 px-3 text-center">표준편차</th>
                <th className="py-2.5 px-3 text-center text-emerald-700">최고점</th>
                <th className="py-2.5 px-3 text-center text-rose-700">최저점</th>
                <th className="py-2.5 px-4 text-center">성취도 A 비율</th>
                <th className="py-2.5 px-4 text-center">성취도 E 비율</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inspectStats.map((st) => {
                const aRatio =
                  st.count > 0 ? Math.round((st.distribution.A / st.count) * 100) : 0;
                const eRatio =
                  st.count > 0 ? Math.round((st.distribution.E / st.count) * 100) : 0;

                return (
                  <tr key={st.subject} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{st.subject}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                      {st.count}명
                    </td>
                    <td className="py-2.5 px-3 text-center font-black text-blue-700">
                      {st.average.toFixed(1)}점
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-500">
                      {st.stdDev.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-emerald-700">
                      {st.max}점
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-rose-700">
                      {st.min}점
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                        {aRatio}% ({st.distribution.A}명)
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-semibold text-[11px]">
                        {eRatio}% ({st.distribution.E}명)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
