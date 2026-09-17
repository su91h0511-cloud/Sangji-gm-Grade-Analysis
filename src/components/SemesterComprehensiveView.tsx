import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Award,
  Trophy,
  Users,
  Printer,
  Download,
  Layers,
  ChevronRight,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Grade,
  Student,
  GradeExamSubjectMap,
  StudentExamScores,
} from '../types';
import {
  calculateSemesterComprehensiveResults,
  getAchievementColor,
} from '../utils/gradeCalculations';
import { StudentSemesterComparisonPanel } from './StudentSemesterComparisonPanel';

interface SemesterComprehensiveViewProps {
  grade: Grade;
  students: Student[];
  subjectConfigs: GradeExamSubjectMap;
  scores: StudentExamScores;
  onSelectStudentForReport: (student: Student) => void;
}

export interface InterSemesterItem {
  student: Student;
  sem1Result?: ReturnType<typeof calculateSemesterComprehensiveResults>['results'][0];
  sem2Result?: ReturnType<typeof calculateSemesterComprehensiveResults>['results'][0];
  sem1Avg: number | null;
  sem2Avg: number | null;
  sem1Rank: number | null;
  sem2Rank: number | null;
  sem1ClassRank: number | null;
  sem2ClassRank: number | null;
  avgDiff: number | null;
  rankDiff: number | null;
  classRankDiff: number | null;
  topGainedSubj: string | null;
}

type SortField =
  | 'gradeRank'
  | 'classRank'
  | 'classNum'
  | 'name'
  | 'combinedAverage'
  | 'scoreChange'
  | 'exam1Rank'
  | 'exam2Rank'
  | 'semAvgChange'
  | 'semRankChange'
  | 'sem1Avg'
  | 'sem2Avg';

export const SemesterComprehensiveView: React.FC<SemesterComprehensiveViewProps> = ({
  grade,
  students,
  subjectConfigs,
  scores,
  onSelectStudentForReport,
}) => {
  const [tableSemesterMode, setTableSemesterMode] = useState<
    1 | 2 | 'comparison'
  >(1);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');
  const [sortField, setSortField] = useState<SortField>('gradeRank');
  const [sortAsc, setSortAsc] = useState(true);

  const gradeStudents = useMemo(() => {
    return students.filter((s) => s.grade === grade);
  }, [students, grade]);

  const activeStudent = useMemo(() => {
    if (selectedStudentId) {
      const found = gradeStudents.find((s) => s.id === selectedStudentId);
      if (found) return found;
    }
    return gradeStudents[0] || null;
  }, [selectedStudentId, gradeStudents]);

  const availableClasses = useMemo(() => {
    const classSet = new Set<number>();
    gradeStudents.forEach((s) => classSet.add(s.classNum));
    return Array.from(classSet).sort((a, b) => a - b);
  }, [gradeStudents]);

  const sem1Data = useMemo(() => {
    return calculateSemesterComprehensiveResults(
      1,
      gradeStudents,
      subjectConfigs,
      scores
    );
  }, [gradeStudents, subjectConfigs, scores]);

  const sem2Data = useMemo(() => {
    return calculateSemesterComprehensiveResults(
      2,
      gradeStudents,
      subjectConfigs,
      scores
    );
  }, [gradeStudents, subjectConfigs, scores]);

  const currentSemesterNum = tableSemesterMode === 2 ? 2 : 1;
  const currentSemesterData = tableSemesterMode === 2 ? sem2Data : sem1Data;
  const {
    results: currentSemesterResults,
    semesterSubjects,
    exam1Info,
    exam2Info,
    stats,
  } = currentSemesterData;

  const interSemesterMap = useMemo(() => {
    const map = new Map<
      string,
      {
        student: Student;
        sem1Result?: (typeof sem1Data.results)[0];
        sem2Result?: (typeof sem2Data.results)[0];
        sem1Avg: number | null;
        sem2Avg: number | null;
        sem1Rank: number | null;
        sem2Rank: number | null;
        sem1ClassRank: number | null;
        sem2ClassRank: number | null;
        avgDiff: number | null;
        rankDiff: number | null;
        classRankDiff: number | null;
        topGainedSubj: string | null;
      }
    >();

    gradeStudents.forEach((st) => {
      const r1 = sem1Data.results.find((r) => r.student.id === st.id);
      const r2 = sem2Data.results.find((r) => r.student.id === st.id);

      const s1Avg = r1 ? r1.combinedAverage : null;
      const s2Avg = r2 ? r2.combinedAverage : null;
      const s1Rank = r1 ? r1.gradeRank : null;
      const s2Rank = r2 ? r2.gradeRank : null;
      const s1ClassRank = r1 ? r1.classRank : null;
      const s2ClassRank = r2 ? r2.classRank : null;

      const avgDiff =
        s1Avg !== null && s2Avg !== null
          ? Math.round((s2Avg - s1Avg) * 10) / 10
          : null;
      const rankDiff =
        s1Rank !== null && s2Rank !== null ? s1Rank - s2Rank : null;
      const classRankDiff =
        s1ClassRank !== null && s2ClassRank !== null
          ? s1ClassRank - s2ClassRank
          : null;

      let topGainedSubj: string | null = null;
      if (r1 && r2) {
        let maxGain = 0;
        const allSubjs = new Set([
          ...Object.keys(r1.subjectCombined),
          ...Object.keys(r2.subjectCombined),
        ]);
        allSubjs.forEach((sub) => {
          const a1 = r1.subjectCombined[sub]?.average;
          const a2 = r2.subjectCombined[sub]?.average;
          if (typeof a1 === 'number' && typeof a2 === 'number') {
            const gain = a2 - a1;
            if (gain > maxGain) {
              maxGain = gain;
              topGainedSubj = `${sub}(+${gain.toFixed(1)}점 ▲)`;
            }
          }
        });
      }

      map.set(st.id, {
        student: st,
        sem1Result: r1,
        sem2Result: r2,
        sem1Avg: s1Avg,
        sem2Avg: s2Avg,
        sem1Rank: s1Rank,
        sem2Rank: s2Rank,
        sem1ClassRank: s1ClassRank,
        sem2ClassRank: s2ClassRank,
        avgDiff,
        rankDiff,
        classRankDiff,
        topGainedSubj,
      });
    });

    return map;
  }, [gradeStudents, sem1Data, sem2Data]);

  const processedResults = useMemo(() => {
    let list = currentSemesterResults.filter((item) => {
      if (selectedClass !== 'all' && item.student.classNum !== selectedClass) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = item.student.name.toLowerCase().includes(query);
        const matchNum =
          `${item.student.classNum}반 ${item.student.studentNum}번`.includes(
            query
          );
        return matchName || matchNum;
      }
      return true;
    });

    return list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'gradeRank':
          comparison = a.gradeRank - b.gradeRank;
          break;
        case 'classRank':
          if (a.student.classNum !== b.student.classNum) {
            comparison = a.student.classNum - b.student.classNum;
          } else {
            comparison = a.classRank - b.classRank;
          }
          break;
        case 'classNum':
          if (a.student.classNum !== b.student.classNum) {
            comparison = a.student.classNum - b.student.classNum;
          } else {
            comparison = a.student.studentNum - b.student.studentNum;
          }
          break;
        case 'name':
          comparison = a.student.name.localeCompare(b.student.name, 'ko');
          break;
        case 'combinedAverage':
          comparison = b.combinedAverage - a.combinedAverage;
          break;
        case 'scoreChange': {
          const changeA = a.scoreChange ?? -999;
          const changeB = b.scoreChange ?? -999;
          comparison = changeB - changeA;
          break;
        }
        case 'semAvgChange': {
          const diffA = interSemesterMap.get(a.student.id)?.avgDiff ?? -999;
          const diffB = interSemesterMap.get(b.student.id)?.avgDiff ?? -999;
          comparison = diffB - diffA;
          break;
        }
        case 'semRankChange': {
          const diffA = interSemesterMap.get(a.student.id)?.rankDiff ?? -999;
          const diffB = interSemesterMap.get(b.student.id)?.rankDiff ?? -999;
          comparison = diffB - diffA;
          break;
        }
        case 'exam1Rank': {
          const r1 = a.exam1Result?.gradeRank ?? 999;
          const r2 = b.exam1Result?.gradeRank ?? 999;
          comparison = r1 - r2;
          break;
        }
        case 'exam2Rank': {
          const r1 = a.exam2Result?.gradeRank ?? 999;
          const r2 = b.exam2Result?.gradeRank ?? 999;
          comparison = r1 - r2;
          break;
        }
        default:
          comparison = a.gradeRank - b.gradeRank;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [
    currentSemesterResults,
    selectedClass,
    searchQuery,
    sortField,
    sortAsc,
    interSemesterMap,
  ]);

  const processedInterSemesterList = useMemo(() => {
    const rawList: InterSemesterItem[] = [];
    interSemesterMap.forEach((val) => rawList.push(val));

    const list = rawList.filter((item) => {
      if (selectedClass !== 'all' && item.student.classNum !== selectedClass) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = item.student.name.toLowerCase().includes(query);
        const matchNum =
          `${item.student.classNum}반 ${item.student.studentNum}번`.includes(
            query
          );
        return matchName || matchNum;
      }
      return true;
    });

    return list.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'semAvgChange':
          comparison = (b.avgDiff ?? -999) - (a.avgDiff ?? -999);
          break;
        case 'semRankChange':
          comparison = (b.rankDiff ?? -999) - (a.rankDiff ?? -999);
          break;
        case 'sem1Avg':
          comparison = (b.sem1Avg ?? 0) - (a.sem1Avg ?? 0);
          break;
        case 'sem2Avg':
          comparison = (b.sem2Avg ?? 0) - (a.sem2Avg ?? 0);
          break;
        case 'gradeRank':
          comparison = (a.sem2Rank ?? 999) - (b.sem2Rank ?? 999);
          break;
        case 'classNum':
          if (a.student.classNum !== b.student.classNum) {
            comparison = a.student.classNum - b.student.classNum;
          } else {
            comparison = a.student.studentNum - b.student.studentNum;
          }
          break;
        case 'name':
          comparison = a.student.name.localeCompare(b.student.name, 'ko');
          break;
        default:
          comparison = (b.avgDiff ?? -999) - (a.avgDiff ?? -999);
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [interSemesterMap, selectedClass, searchQuery, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const classComparisonData = useMemo(() => {
    return availableClasses.map((cNum) => {
      const classItems = currentSemesterResults.filter(
        (r) => r.student.classNum === cNum
      );
      const e1Valid = classItems.filter(
        (r) => r.exam1Result && r.exam1Result.validSubjectCount > 0
      );
      const e2Valid = classItems.filter(
        (r) => r.exam2Result && r.exam2Result.validSubjectCount > 0
      );
      const combValid = classItems.filter(
        (r) =>
          (r.exam1Result && r.exam1Result.validSubjectCount > 0) ||
          (r.exam2Result && r.exam2Result.validSubjectCount > 0)
      );

      const e1Avg =
        e1Valid.length > 0
          ? Math.round(
              (e1Valid.reduce(
                (acc, r) => acc + (r.exam1Result?.average || 0),
                0
              ) /
                e1Valid.length) *
                10
            ) / 10
          : 0;

      const e2Avg =
        e2Valid.length > 0
          ? Math.round(
              (e2Valid.reduce(
                (acc, r) => acc + (r.exam2Result?.average || 0),
                0
              ) /
                e2Valid.length) *
                10
            ) / 10
          : 0;

      const combAvg =
        combValid.length > 0
          ? Math.round(
              (combValid.reduce((acc, r) => acc + r.combinedAverage, 0) /
                combValid.length) *
                10
            ) / 10
          : 0;

      return {
        className: `${cNum}반`,
        '1차': e1Avg,
        '2차': e2Avg,
        '학기 종합': combAvg,
        studentCount: classItems.length,
      };
    });
  }, [availableClasses, currentSemesterResults]);

  const interSemesterStats = useMemo(() => {
    let improved = 0;
    let declined = 0;
    let unchanged = 0;
    let totalGain = 0;
    let count = 0;

    interSemesterMap.forEach((val) => {
      if (val.avgDiff !== null) {
        count++;
        totalGain += val.avgDiff;
        if (val.avgDiff > 0) improved++;
        else if (val.avgDiff < 0) declined++;
        else unchanged++;
      }
    });

    const netAvgChange =
      count > 0 ? Math.round((totalGain / count) * 10) / 10 : 0;

    return {
      count,
      improved,
      declined,
      unchanged,
      netAvgChange,
      improvedPercent: count > 0 ? Math.round((improved / count) * 100) : 0,
    };
  }, [interSemesterMap]);

  const handleExportCSV = () => {
    if (tableSemesterMode === 'comparison') {
      const headers = [
        '학년',
        '반',
        '번호',
        '이름',
        '1학기종합평균',
        '1학기전교석차',
        '1학기반석차',
        '2학기종합평균',
        '2학기전교석차',
        '2학기반석차',
        '학기간평균등락폭',
        '전교석차변동',
        '최대상승과목',
      ];

      const rows = processedInterSemesterList.map((item) => [
        item.student.grade,
        item.student.classNum,
        item.student.studentNum,
        item.student.name,
        item.sem1Avg ?? '',
        item.sem1Rank ?? '',
        item.sem1ClassRank ?? '',
        item.sem2Avg ?? '',
        item.sem2Rank ?? '',
        item.sem2ClassRank ?? '',
        item.avgDiff ?? '',
        item.rankDiff ?? '',
        item.topGainedSubj ? `"${item.topGainedSubj}"` : '',
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `${grade}학년_학기간(1학기-2학기)_성적등락_분석표.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const headers = [
      '종합석차',
      '반별석차',
      '학년',
      '반',
      '번호',
      '이름',
      '1차평균',
      '1차석차',
      '2차평균',
      '2차석차',
      '종합총점',
      '종합평균',
      '상위백분율(%)',
      '1차대비2차변동',
      '학기간(1학기대비2학기)등락',
    ];

    if (viewMode === 'detailed') {
      semesterSubjects.forEach((subj) => {
        headers.push(`${subj}_1차`);
        headers.push(`${subj}_2차`);
        headers.push(`${subj}_종합`);
        headers.push(`${subj}_성취도`);
      });
    }

    const rows = processedResults.map((r) => {
      const inter = interSemesterMap.get(r.student.id);
      const row = [
        r.gradeRank,
        r.classRank,
        r.student.grade,
        r.student.classNum,
        r.student.studentNum,
        r.student.name,
        r.exam1Result ? r.exam1Result.average : '',
        r.exam1Result ? r.exam1Result.gradeRank : '',
        r.exam2Result ? r.exam2Result.average : '',
        r.exam2Result ? r.exam2Result.gradeRank : '',
        r.combinedTotal,
        r.combinedAverage,
        r.percentile,
        r.scoreChange !== null ? r.scoreChange : '',
        inter?.avgDiff !== null && inter?.avgDiff !== undefined
          ? inter.avgDiff
          : '',
      ];

      if (viewMode === 'detailed') {
        semesterSubjects.forEach((subj) => {
          const info = r.subjectCombined[subj];
          row.push(info?.score1 ?? '');
          row.push(info?.score2 ?? '');
          row.push(info?.average ?? '');
          row.push(info?.achievement ?? '');
        });
      }

      return row.join(',');
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `${grade}학년_${currentSemesterNum}학기_종합성적분석표.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Semester Navigation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
              상지여자중학교
            </span>
            <span className="text-xs text-slate-500 font-bold">
              {grade}학년 학기별 지필평가
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>학기별 1·2차 종합 성적 및 학기 간 등락 분석표</span>
          </h2>
          <p className="text-xs text-slate-500">
            학기별 1차·2차 누적 합산과 1학기 ↔ 2학기 간 성적 등락폭(상승/하락)을 한눈에 분석합니다.
          </p>
        </div>

        {/* View Selection */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setTableSemesterMode(1)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                tableSemesterMode === 1
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              1학기 종합
            </button>
            <button
              onClick={() => setTableSemesterMode(2)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                tableSemesterMode === 2
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              2학기 종합
            </button>
            <button
              onClick={() => setTableSemesterMode('comparison')}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                tableSemesterMode === 'comparison'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>1학기 ↔ 2학기 등락 비교</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 print:hidden">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-all"
              title="엑셀(CSV) 다운로드"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">엑셀 저장</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>인쇄</span>
            </button>
          </div>
        </div>
      </div>

      {/* SELECTED STUDENT INTER-SEMESTER FLUCTUATION PANEL */}
      {activeStudent && (
        <StudentSemesterComparisonPanel
          student={activeStudent}
          allStudents={gradeStudents}
          onSelectStudent={(st) => setSelectedStudentId(st.id)}
          sem1Result={sem1Data.results.find(
            (r) => r.student.id === activeStudent.id
          )}
          sem2Result={sem2Data.results.find(
            (r) => r.student.id === activeStudent.id
          )}
          onOpenReportCard={onSelectStudentForReport}
          subjectConfigs={subjectConfigs}
          scores={scores}
        />
      )}

      {/* KPI Overview Summary Cards */}
      {tableSemesterMode === 'comparison' ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">분석 대상 학생</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {interSemesterStats.count}
              <span className="text-xs text-slate-500 font-normal ml-1">
                명
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              1·2학기 전체 응시자
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20">
            <div className="flex items-center justify-between text-emerald-700 mb-1">
              <span className="text-xs font-bold">학기 간 성적 상승 학생</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {interSemesterStats.improved}
              <span className="text-xs text-slate-500 font-normal ml-1">
                명
              </span>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-1">
              전체의 {interSemesterStats.improvedPercent}% 성적 향상 ▲
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-2xs bg-rose-50/20">
            <div className="flex items-center justify-between text-rose-700 mb-1">
              <span className="text-xs font-bold">성적 하락/보완 학생</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700">
              {interSemesterStats.declined}
              <span className="text-xs text-slate-500 font-normal ml-1">
                명
              </span>
            </div>
            <div className="text-[11px] text-rose-700 font-bold mt-1">
              하락폭 관리 대상 ▼
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">성적 유지 학생</span>
              <Minus className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-700">
              {interSemesterStats.unchanged}
              <span className="text-xs text-slate-500 font-normal ml-1">
                명
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              ±0.0점 성적 유지
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs bg-indigo-50/20 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-indigo-800 mb-1">
              <span className="text-xs font-bold">학년 전체 순등락 평균</span>
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-700">
              {interSemesterStats.netAvgChange >= 0
                ? `+${interSemesterStats.netAvgChange}`
                : interSemesterStats.netAvgChange}
              <span className="text-xs text-indigo-600 font-normal ml-1">
                점
              </span>
            </div>
            <div className="text-[11px] text-indigo-700 font-bold mt-1">
              1학기 대비 2학기 변화량
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">전체 응시 인원</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats.totalStudents}
              <span className="text-xs text-slate-500 font-normal ml-1">
                명
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {availableClasses.length}개 학급 ({grade}학년)
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">{exam1Info.label} 평균</span>
              <Trophy className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-700">
              {stats.exam1Average.toFixed(1)}
              <span className="text-xs text-slate-500 font-normal ml-1">
                점
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              1차 지필평가 학년 평균
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-medium">{exam2Info.label} 평균</span>
              <Trophy className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-slate-700">
              {stats.exam2Average.toFixed(1)}
              <span className="text-xs text-slate-500 font-normal ml-1">
                점
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              2차 지필평가 학년 평균
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs bg-blue-50/20">
            <div className="flex items-center justify-between text-blue-700 mb-1">
              <span className="text-xs font-bold">
                {currentSemesterNum}학기 종합 평균
              </span>
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-700">
              {stats.combinedAverage.toFixed(1)}
              <span className="text-xs text-blue-600 font-normal ml-1">
                점
              </span>
            </div>
            <div className="text-[11px] font-bold mt-1 flex items-center gap-1">
              {stats.exam2Average - stats.exam1Average >= 0 ? (
                <span className="text-emerald-700 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  +{(stats.exam2Average - stats.exam1Average).toFixed(1)}점 상승
                </span>
              ) : (
                <span className="text-rose-700 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" />
                  {(stats.exam2Average - stats.exam1Average).toFixed(1)}점 하락
                </span>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-2xs bg-emerald-50/20 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between text-emerald-800 mb-1">
              <span className="text-xs font-bold">1차 대비 성적 향상자</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700">
              {stats.improvedCount}
              <span className="text-xs text-slate-500 font-normal ml-1">
                / {stats.totalStudents}명
              </span>
            </div>
            <div className="text-[11px] text-emerald-700 font-bold mt-1">
              전체의{' '}
              {stats.totalStudents > 0
                ? Math.round((stats.improvedCount / stats.totalStudents) * 100)
                : 0}
              % 향상
            </div>
          </div>
        </div>
      )}

      {/* Class Comparison Chart */}
      {tableSemesterMode !== 'comparison' && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                학급별 {currentSemesterNum}학기 1차·2차 및 종합 평균 비교
              </h3>
              <p className="text-xs text-slate-400">
                반별 학업 성취도 추이를 비교합니다
              </p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
              상지여자중학교 {grade}학년
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={classComparisonData}
                margin={{ top: 10, right: 20, left: -15, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="className"
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }}
                />
                <YAxis
                  domain={[40, 100]}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '11px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }}
                />
                <Bar
                  dataKey="1차"
                  fill="#94a3b8"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="2차"
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="학기 종합"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-700">학급:</span>
            <select
              value={selectedClass}
              onChange={(e) =>
                setSelectedClass(
                  e.target.value === 'all' ? 'all' : Number(e.target.value)
                )
              }
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">전체 반</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  {c}반
                </option>
              ))}
            </select>
          </div>

          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="학생 이름 또는 번호 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {tableSemesterMode !== 'comparison' && (
            <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  viewMode === 'summary'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                종합 요약
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1 rounded-md font-bold transition-all ${
                  viewMode === 'detailed'
                    ? 'bg-white text-blue-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                과목별 상세
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-slate-500 font-medium">
          조회 결과:{' '}
          <strong className="text-slate-800 font-bold">
            {tableSemesterMode === 'comparison'
              ? processedInterSemesterList.length
              : processedResults.length}
          </strong>
          명 (행 클릭 시 해당 학생의 등락 분석 카드 표시)
        </div>
      </div>

      {/* TABLE 1: INTER-SEMESTER COMPARISON TABLE */}
      {tableSemesterMode === 'comparison' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th
                    onClick={() => handleSort('classNum')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200/70 transition-colors w-20"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>학번</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors w-28"
                  >
                    <div className="flex items-center gap-1">
                      <span>이름</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('sem1Avg')}
                    className="py-3 px-3 text-center bg-slate-100/90 border-l border-slate-200 cursor-pointer hover:bg-slate-200/70"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>1학기 종합 (평균/석차)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('sem2Avg')}
                    className="py-3 px-3 text-center bg-blue-50/60 border-l border-slate-200 cursor-pointer hover:bg-blue-100"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>2학기 종합 (평균/석차)</span>
                      <ArrowUpDown className="w-3 h-3 text-blue-600" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('semAvgChange')}
                    className="py-3 px-3 text-center bg-amber-50/70 border-l border-amber-200 text-amber-950 font-black cursor-pointer hover:bg-amber-100"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>학기 간 평균 등락폭</span>
                      <ArrowUpDown className="w-3 h-3 text-amber-700" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('semRankChange')}
                    className="py-3 px-3 text-center bg-emerald-50/50 border-l border-emerald-200 text-emerald-950 font-bold cursor-pointer hover:bg-emerald-100"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>전교 석차 변동</span>
                      <ArrowUpDown className="w-3 h-3 text-emerald-700" />
                    </div>
                  </th>

                  <th className="py-3 px-3 text-center border-l border-slate-200 text-slate-700">
                    반 등수 변동
                  </th>

                  <th className="py-3 px-3 text-center border-l border-slate-200 text-slate-700">
                    최대 상승 과목
                  </th>

                  <th className="py-3 px-3 text-center w-24 print:hidden">
                    등락 분석
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {processedInterSemesterList.map((item) => {
                  const isSelected = activeStudent?.id === item.student.id;
                  const diff = item.avgDiff;
                  const rankDiff = item.rankDiff;

                  return (
                    <tr
                      key={item.student.id}
                      onClick={() => setSelectedStudentId(item.student.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-100/60 font-semibold'
                          : 'hover:bg-blue-50/40'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                        {item.student.classNum}반 {item.student.studentNum}번
                      </td>

                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.student.name}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-600 text-white font-bold">
                              선택됨
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center border-l border-slate-200 text-slate-700">
                        {item.sem1Avg !== null ? (
                          <div>
                            <span className="font-bold">
                              {item.sem1Avg.toFixed(1)}점
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({item.sem1Rank}위)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center border-l border-slate-200 bg-blue-50/20 text-blue-900">
                        {item.sem2Avg !== null ? (
                          <div>
                            <span className="font-black text-blue-700">
                              {item.sem2Avg.toFixed(1)}점
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">
                              ({item.sem2Rank}위)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center border-l border-amber-200 bg-amber-50/20">
                        {diff !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black border ${
                              diff > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : diff < 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {diff > 0 ? (
                              <>
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>+{diff.toFixed(1)}점 ▲</span>
                              </>
                            ) : diff < 0 ? (
                              <>
                                <TrendingDown className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>{diff.toFixed(1)}점 ▼</span>
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

                      <td className="py-2.5 px-3 text-center border-l border-emerald-200 font-bold">
                        {rankDiff !== null ? (
                          <span
                            className={`text-xs ${
                              rankDiff > 0
                                ? 'text-emerald-700 font-black'
                                : rankDiff < 0
                                ? 'text-rose-700 font-black'
                                : 'text-slate-500'
                            }`}
                          >
                            {rankDiff > 0
                              ? `▲ ${rankDiff}계단`
                              : rankDiff < 0
                              ? `▼ ${Math.abs(rankDiff)}계단`
                              : '- 유지'}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center border-l border-slate-200 text-slate-600">
                        {item.classRankDiff !== null ? (
                          <span>
                            {item.classRankDiff > 0
                              ? `▲ ${item.classRankDiff}`
                              : item.classRankDiff < 0
                              ? `▼ ${Math.abs(item.classRankDiff)}`
                              : '-'}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center border-l border-slate-200 text-xs">
                        {item.topGainedSubj ? (
                          <span className="text-emerald-700 font-bold">
                            {item.topGainedSubj}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center print:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentId(item.student.id);
                          }}
                          className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors inline-flex items-center gap-1"
                        >
                          <span>상세비교</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="font-bold text-slate-700">
              상지여자중학교 {grade}학년 학기 간(1학기 ↔ 2학기) 종합 성적 등락 비교표
            </div>
            <div>
              * 등락폭 산출식: 2학기 종합 평균 - 1학기 종합 평균 (양수 ▲: 상승, 음수 ▼: 하락)
            </div>
          </div>
        </div>
      ) : (
        /* TABLE 2: STANDARD SEMESTER VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                  <th
                    onClick={() => handleSort('gradeRank')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200/70 transition-colors w-16"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>종합 석차</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('classRank')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200/70 transition-colors w-16"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>반 등수</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('classNum')}
                    className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200/70 transition-colors w-20"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>학번</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-200/70 transition-colors w-28"
                  >
                    <div className="flex items-center gap-1">
                      <span>이름</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('exam1Rank')}
                    className="py-3 px-3 text-center bg-slate-100/90 border-l border-slate-200 cursor-pointer hover:bg-slate-200/70"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{exam1Info.label} (평균/석차)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('exam2Rank')}
                    className="py-3 px-3 text-center bg-slate-100/90 border-l border-slate-200 cursor-pointer hover:bg-slate-200/70"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>{exam2Info.label} (평균/석차)</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>

                  <th className="py-3 px-3 text-center bg-blue-50/60 border-l border-blue-200 text-blue-900">
                    종합 총점
                  </th>
                  <th
                    onClick={() => handleSort('combinedAverage')}
                    className="py-3 px-3 text-center bg-blue-50/80 border-l border-blue-200 text-blue-950 font-black cursor-pointer hover:bg-blue-100"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>종합 평균</span>
                      <ArrowUpDown className="w-3 h-3 text-blue-600" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('scoreChange')}
                    className="py-3 px-3 text-center bg-blue-50/60 border-l border-blue-200 text-blue-900 cursor-pointer hover:bg-blue-100"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>1차대비 2차</span>
                      <ArrowUpDown className="w-3 h-3 text-blue-600" />
                    </div>
                  </th>

                  <th
                    onClick={() => handleSort('semAvgChange')}
                    className="py-3 px-3 text-center bg-amber-50/70 border-l border-amber-200 text-amber-950 font-black cursor-pointer hover:bg-amber-100"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>학기간 등락폭 (1↔2학기)</span>
                      <ArrowUpDown className="w-3 h-3 text-amber-700" />
                    </div>
                  </th>

                  {viewMode === 'detailed' &&
                    semesterSubjects.map((subj) => (
                      <th
                        key={subj}
                        className="py-3 px-2 text-center border-l border-slate-200 font-bold bg-slate-50"
                      >
                        {subj}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          1차/2차/평균
                        </span>
                      </th>
                    ))}

                  <th className="py-3 px-3 text-center w-24 print:hidden">
                    관리
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {processedResults.map((r) => {
                  const isSelected = activeStudent?.id === r.student.id;
                  const e1Avg = r.exam1Result?.average;
                  const e1Rank = r.exam1Result?.gradeRank;
                  const e2Avg = r.exam2Result?.average;
                  const e2Rank = r.exam2Result?.gradeRank;
                  const inter = interSemesterMap.get(r.student.id);

                  return (
                    <tr
                      key={r.student.id}
                      onClick={() => setSelectedStudentId(r.student.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-100/60 font-semibold'
                          : 'hover:bg-blue-50/40'
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-black">
                        <div className="flex items-center justify-center gap-1">
                          {r.gradeRank === 1 && (
                            <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          )}
                          {r.gradeRank <= 3 && r.gradeRank > 1 && (
                            <Award className="w-3.5 h-3.5 text-indigo-500" />
                          )}
                          <span
                            className={
                              r.gradeRank <= 3
                                ? 'text-blue-700 font-black text-sm'
                                : 'text-slate-800'
                            }
                          >
                            {r.gradeRank}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-normal block">
                          상위 {r.percentile}%
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center font-bold text-slate-700">
                        {r.classRank}
                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                          /{r.totalInClass}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center text-slate-600 font-medium">
                        {r.student.classNum}반 {r.student.studentNum}번
                      </td>

                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{r.student.name}</span>
                          {isSelected && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-600 text-white font-bold">
                              선택됨
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center border-l border-slate-200 bg-slate-50/40 font-semibold text-slate-700">
                        {e1Avg !== undefined ? (
                          <div>
                            <span>{e1Avg.toFixed(1)}점</span>
                            <span className="text-[10px] text-slate-400 ml-1 font-normal">
                              ({e1Rank}위)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center border-l border-slate-200 bg-slate-50/40 font-semibold text-slate-700">
                        {e2Avg !== undefined ? (
                          <div>
                            <span>{e2Avg.toFixed(1)}점</span>
                            <span className="text-[10px] text-slate-400 ml-1 font-normal">
                              ({e2Rank}위)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center border-l border-blue-200 bg-blue-50/20 font-bold text-slate-800">
                        {r.combinedTotal}점
                      </td>

                      <td className="py-2.5 px-3 text-center border-l border-blue-200 bg-blue-50/40 font-black text-sm text-blue-700">
                        {r.combinedAverage.toFixed(1)}점
                      </td>

                      <td className="py-2.5 px-3 text-center border-l border-blue-200 bg-blue-50/20">
                        {r.scoreChange !== null ? (
                          <div
                            className={`font-black text-xs inline-flex items-center gap-0.5 ${
                              r.scoreChange > 0
                                ? 'text-emerald-600'
                                : r.scoreChange < 0
                                ? 'text-rose-600'
                                : 'text-slate-400'
                            }`}
                          >
                            {r.scoreChange > 0 ? (
                              <>
                                <TrendingUp className="w-3.5 h-3.5" />
                                <span>+{r.scoreChange.toFixed(1)}</span>
                              </>
                            ) : r.scoreChange < 0 ? (
                              <>
                                <TrendingDown className="w-3.5 h-3.5" />
                                <span>{r.scoreChange.toFixed(1)}</span>
                              </>
                            ) : (
                              <>
                                <Minus className="w-3.5 h-3.5" />
                                <span>0.0</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-center border-l border-amber-200 bg-amber-50/20">
                        {inter?.avgDiff !== null &&
                        inter?.avgDiff !== undefined ? (
                          <span
                            className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[11px] font-black border ${
                              inter.avgDiff > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : inter.avgDiff < 0
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {inter.avgDiff > 0 ? (
                              <>
                                <TrendingUp className="w-3 h-3 text-emerald-600" />
                                <span>+{inter.avgDiff.toFixed(1)} ▲</span>
                              </>
                            ) : inter.avgDiff < 0 ? (
                              <>
                                <TrendingDown className="w-3 h-3 text-rose-600" />
                                <span>{inter.avgDiff.toFixed(1)} ▼</span>
                              </>
                            ) : (
                              <>
                                <Minus className="w-3 h-3 text-slate-400" />
                                <span>0.0</span>
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      {viewMode === 'detailed' &&
                        semesterSubjects.map((subj) => {
                          const info = r.subjectCombined[subj];
                          const achStyle = getAchievementColor(
                            info?.achievement || '-'
                          );

                          return (
                            <td
                              key={subj}
                              className="py-2 px-2 text-center border-l border-slate-200 text-[11px]"
                            >
                              {info && info.average !== null ? (
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800">
                                    {info.average.toFixed(1)}점
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {info.score1 ?? '-'}/{info.score2 ?? '-'}
                                  </div>
                                  <span
                                    className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-black ${achStyle.bg} border ${achStyle.border}`}
                                  >
                                    {info.achievement}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300">-</span>
                              )}
                            </td>
                          );
                        })}

                      <td className="py-2.5 px-3 text-center print:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStudentForReport(r.student);
                          }}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-0.5"
                          title="개인 성적분석표 보기"
                        >
                          <span className="text-[11px] font-bold">성적표</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <div className="font-bold text-slate-700">
              상지여자중학교 {grade}학년 {currentSemesterNum}학기 종합 지필평가 분석표
            </div>
            <div>
              1차와 2차 시험 평균 산출식: (1차 평균 + 2차 평균) / 2
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
