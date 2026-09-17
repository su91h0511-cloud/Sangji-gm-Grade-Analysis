import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  FileText,
  Trash2,
  HelpCircle,
  Trophy,
  Users,
  Award,
  BookOpen,
  UploadCloud,
  BarChart3,
  Table as TableIcon,
  LayoutGrid,
  RotateCcw,
} from 'lucide-react';
import {
  Student,
  ExamInfo,
  Grade,
  StudentCalculatedResult,
  SubjectStats,
} from '../types';
import { getAchievement, getAchievementColor } from '../utils/gradeCalculations';
import { ScoreDistributionVisualizer } from './ScoreDistributionVisualizer';

interface StudentScoreTableProps {
  grade: Grade;
  currentExam: ExamInfo;
  currentSubjects: string[];
  results: StudentCalculatedResult[];
  subjectStats: SubjectStats[];
  onUpdateScore: (
    studentId: string,
    subject: string,
    score: number | null
  ) => void;
  onDeleteStudent: (studentId: string) => void;
  onOpenUploadModal: () => void;
  onOpenScoreResetModal?: () => void;
  onSelectStudentForReport: (student: Student) => void;
}

type SortField = 'rank' | 'classNum' | 'name' | 'average' | 'total' | string;

export const StudentScoreTable: React.FC<StudentScoreTableProps> = ({
  grade,
  currentExam,
  currentSubjects,
  results,
  subjectStats,
  onUpdateScore,
  onDeleteStudent,
  onOpenUploadModal,
  onOpenScoreResetModal,
  onSelectStudentForReport,
}) => {
  const [selectedClass, setSelectedClass] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<'both' | 'chart' | 'table'>('both');

  // Available classes in this grade
  const availableClasses = useMemo(() => {
    const classSet = new Set<number>();
    results.forEach((r) => classSet.add(r.student.classNum));
    return Array.from(classSet).sort((a, b) => a - b);
  }, [results]);

  // Filtered and sorted results
  const processedResults = useMemo(() => {
    let filtered = results.filter((res) => {
      if (selectedClass !== 'all' && res.student.classNum !== selectedClass) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchName = res.student.name.toLowerCase().includes(query);
        const matchNum = `${res.student.classNum}반 ${res.student.studentNum}번`.includes(query);
        return matchName || matchNum;
      }
      return true;
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'rank') {
        const aHas = a.validSubjectCount > 0 && a.gradeRank > 0;
        const bHas = b.validSubjectCount > 0 && b.gradeRank > 0;
        if (!aHas && !bHas) return a.student.studentNum - b.student.studentNum;
        if (!aHas) return 1;
        if (!bHas) return -1;
        comparison = a.gradeRank - b.gradeRank;
      } else if (sortField === 'classNum') {
        if (a.student.classNum !== b.student.classNum) {
          comparison = a.student.classNum - b.student.classNum;
        } else {
          comparison = a.student.studentNum - b.student.studentNum;
        }
      } else if (sortField === 'name') {
        comparison = a.student.name.localeCompare(b.student.name, 'ko');
      } else if (sortField === 'average' || sortField === 'total') {
        const aHas = a.validSubjectCount > 0;
        const bHas = b.validSubjectCount > 0;
        if (!aHas && !bHas) return a.student.studentNum - b.student.studentNum;
        if (!aHas) return 1;
        if (!bHas) return -1;
        comparison = b.average - a.average;
      } else if (currentSubjects.includes(sortField)) {
        const scoreA = a.scores[sortField];
        const scoreB = b.scores[sortField];
        const aHas = typeof scoreA === 'number';
        const bHas = typeof scoreB === 'number';
        if (!aHas && !bHas) return a.student.studentNum - b.student.studentNum;
        if (!aHas) return 1;
        if (!bHas) return -1;
        comparison = (scoreB as number) - (scoreA as number);
      }

      return sortAsc ? comparison : -comparison;
    });
  }, [results, selectedClass, searchQuery, sortField, sortAsc, currentSubjects]);

  // Quick statistics
  const gradeStats = useMemo(() => {
    const scoredStudents = results.filter((r) => r.validSubjectCount > 0);
    if (scoredStudents.length === 0) {
      return { avg: '-', max: '-', count: 0, totalStudents: results.length };
    }
    const averages = scoredStudents.map((r) => r.average);
    const sum = averages.reduce((a, b) => a + b, 0);
    return {
      avg: (Math.round((sum / scoredStudents.length) * 10) / 10).toFixed(1),
      max: Math.max(...averages).toFixed(1),
      count: scoredStudents.length,
      totalStudents: results.length,
    };
  }, [results]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank' || field === 'classNum');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Quick Stats Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">{grade}학년 전체 응시자</div>
            <div className="text-lg font-black text-slate-900">
              {gradeStats.count}
              <span className="text-xs font-normal text-slate-500 ml-1">
                / {results.length}명
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">학년 전체 평균</div>
            <div className="text-lg font-black text-slate-900">
              {gradeStats.avg}
              {gradeStats.avg !== '-' && (
                <span className="text-xs font-normal text-slate-500 ml-1">점</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">학년 최고 평균</div>
            <div className="text-lg font-black text-slate-900">
              {gradeStats.max}
              {gradeStats.max !== '-' && (
                <span className="text-xs font-normal text-slate-500 ml-1">점</span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">시험 실시 과목수</div>
            <div className="text-lg font-black text-slate-900">
              {currentSubjects.length}
              <span className="text-xs font-normal text-slate-500 ml-1">개 과목</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Switcher: Both, Chart-only, Table-only */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 px-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">화면 보기:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-bold">
            <button
              onClick={() => setViewMode('both')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'both'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>전체 보기 (분포 차트 + 성적표)</span>
            </button>
            <button
              onClick={() => setViewMode('chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'chart'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>성적 분포 분석만 (히스토그램·박스플롯)</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>성적표 목록만</span>
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-400 font-medium hidden md:block">
          {viewMode === 'both' && '📊 상단 성적 분포 시각화(히스토그램 & 박스플롯)와 하단 학생별 성적표를 함께 확인합니다.'}
          {viewMode === 'chart' && '📈 학급별/과목별 점수 분포 밀도와 5수치 분산도를 집중적으로 분석합니다.'}
          {viewMode === 'table' && '📋 학생별 점수 수정 및 석차 현황 목록에 집중합니다.'}
        </div>
      </div>

      {/* Distribution Visualizer (Histogram & Box Plot) */}
      {(viewMode === 'both' || viewMode === 'chart') && (
        <ScoreDistributionVisualizer
          grade={grade}
          currentExam={currentExam}
          currentSubjects={currentSubjects}
          results={results}
          selectedClassFilter={selectedClass}
        />
      )}

      {/* Table Section */}
      {(viewMode === 'both' || viewMode === 'table') && (
        <div className="space-y-4">
          {/* Control bar: Class filter, search, actions */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                <button
                  onClick={() => setSelectedClass('all')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    selectedClass === 'all'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  전체 반
                </button>
                {availableClasses.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedClass(c)}
                    className={`px-3 py-1 rounded-md transition-all ${
                      selectedClass === c
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c}반
                  </button>
                ))}
              </div>

              {/* Search box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="학생 이름 또는 번호 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44 sm:w-56"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-400 hidden sm:block">
                💡 점수를 직접 클릭하면 수정할 수 있으며, 석차가 실시간 재계산됩니다.
              </div>
              {onOpenScoreResetModal && (
                <button
                  onClick={onOpenScoreResetModal}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  title="현재 시험 또는 학년 점수 초기화"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span>점수 초기화</span>
                </button>
              )}
              <button
                onClick={onOpenUploadModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                title="엑셀/CSV 파일 또는 표 복사·붙여넣기로 학생 및 성적을 일괄 업로드합니다."
              >
                <UploadCloud className="w-4 h-4" />
                <span>자료 업로드</span>
              </button>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {currentSubjects.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-400" />
                <div className="text-base font-bold text-slate-700">
                  현재 시험에 등록된 과목이 없습니다
                </div>
                <p className="text-xs text-slate-400">
                  상단의 [시험 과목 설정] 버튼을 눌러 시험 과목을 먼저 등록해주세요.
                </p>
              </div>
            ) : processedResults.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-400" />
                <div className="text-base font-bold text-slate-700">등록된 학생이 없습니다</div>
                <p className="text-xs text-slate-400">
                  우측 상단의 [자료 업로드] 버튼을 눌러 학생 정보와 성적 점수를 일괄 등록해주세요.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold tracking-tight">
                      <th
                        onClick={() => handleSort('classNum')}
                        className="py-3 px-3 cursor-pointer hover:bg-slate-100 text-center w-14"
                      >
                        <div className="flex items-center justify-center gap-1">
                          반
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('classNum')}
                        className="py-3 px-3 cursor-pointer hover:bg-slate-100 text-center w-14"
                      >
                        번호
                      </th>
                      <th
                        onClick={() => handleSort('name')}
                        className="py-3 px-4 cursor-pointer hover:bg-slate-100 min-w-[90px]"
                      >
                        <div className="flex items-center gap-1">
                          이름
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      {/* Dynamic Subjects headers */}
                      {currentSubjects.map((subj) => (
                        <th
                          key={subj}
                          onClick={() => handleSort(subj)}
                          className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 min-w-[80px]"
                          title="클릭 시 해당 과목 점수순 정렬"
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span>{subj}</span>
                            <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                          </div>
                        </th>
                      ))}

                      <th
                        onClick={() => handleSort('total')}
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 font-extrabold text-slate-800 w-16"
                      >
                        <div className="flex items-center justify-center gap-1">
                          총점
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>

                      <th
                        onClick={() => handleSort('average')}
                        className="py-3 px-3 text-center cursor-pointer hover:bg-slate-100 font-extrabold text-blue-700 bg-blue-50/40 w-16"
                      >
                        <div className="flex items-center justify-center gap-1">
                          평균
                          <ArrowUpDown className="w-3 h-3 text-blue-500" />
                        </div>
                      </th>

                      {/* Overall Rank */}
                      <th
                        onClick={() => handleSort('rank')}
                        className="py-3 px-3 text-center cursor-pointer hover:bg-amber-100/50 bg-amber-50/70 text-amber-900 font-black min-w-[95px]"
                        title="학년 전체 석차"
                      >
                        <div className="flex items-center justify-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-600" />
                          전체 석차
                          <ArrowUpDown className="w-3 h-3 text-amber-600" />
                        </div>
                      </th>

                      {/* Class Rank */}
                      <th
                        className="py-3 px-3 text-center bg-indigo-50/70 text-indigo-900 font-black min-w-[85px]"
                        title="해당 반 내 등수"
                      >
                        반별 등수
                      </th>

                      {/* Actions */}
                      <th className="py-3 px-3 text-center w-28">관리 / 성적표</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {processedResults.map((result) => {
                      const isTop3 = result.gradeRank <= 3;
                      return (
                        <tr
                          key={result.student.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isTop3 ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                            {result.student.classNum}반
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                            {result.student.studentNum}번
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                            <button
                              onClick={() => onSelectStudentForReport(result.student)}
                              className="hover:text-blue-600 hover:underline text-left font-bold"
                              title="개인별 성적분석표 열기"
                            >
                              {result.student.name}
                            </button>
                          </td>

                          {/* Subject Scores Input/Display */}
                          {currentSubjects.map((subj) => {
                            const score = result.scores[subj];
                            const ach = getAchievement(score);
                            const achStyle = getAchievementColor(ach);

                            return (
                              <td key={subj} className="py-2 px-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={score ?? ''}
                                    placeholder="-"
                                    onChange={(e) => {
                                      const raw = e.target.value;
                                      if (raw === '') {
                                        onUpdateScore(result.student.id, subj, null);
                                      } else {
                                        const val = Number(raw);
                                        if (val >= 0 && val <= 100) {
                                          onUpdateScore(result.student.id, subj, val);
                                        }
                                      }
                                    }}
                                    className="w-14 text-center font-bold text-xs py-1 px-1 rounded border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
                                  />
                                  {ach !== '-' && (
                                    <span
                                      className={`text-[10px] font-extrabold px-1 py-0.2 rounded ${achStyle.bg} border ${achStyle.border}`}
                                      title={`성취도 ${ach}`}
                                    >
                                      {ach}
                                    </span>
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          {/* Total */}
                          <td className="py-2.5 px-3 text-center font-extrabold text-slate-800">
                            {result.validSubjectCount > 0 ? result.total : '-'}
                          </td>

                          {/* Average */}
                          <td className="py-2.5 px-3 text-center font-black text-blue-700 bg-blue-50/20">
                            {result.validSubjectCount > 0 ? result.average.toFixed(1) : '-'}
                          </td>

                          {/* Overall Grade Rank */}
                          <td className="py-2.5 px-3 text-center bg-amber-50/40">
                            {result.validSubjectCount > 0 && result.gradeRank > 0 ? (
                              <div className="inline-flex items-center justify-center gap-1 font-black text-amber-900">
                                {result.gradeRank === 1 && (
                                  <span className="text-amber-500">🥇</span>
                                )}
                                {result.gradeRank === 2 && (
                                  <span className="text-slate-400">🥈</span>
                                )}
                                {result.gradeRank === 3 && (
                                  <span className="text-amber-700">🥉</span>
                                )}
                                <span className="text-sm">{result.gradeRank}</span>
                                <span className="text-[10px] text-slate-500 font-normal">
                                  /{result.totalInGrade}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs font-normal">-</span>
                            )}
                          </td>

                          {/* Class Rank */}
                          <td className="py-2.5 px-3 text-center bg-indigo-50/30">
                            {result.validSubjectCount > 0 && result.classRank > 0 ? (
                              <>
                                <span className="font-extrabold text-indigo-900">
                                  {result.classRank}
                                </span>
                                <span className="text-[10px] text-slate-500 font-normal ml-0.5">
                                  /{result.totalInClass}
                                </span>
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs font-normal">-</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onSelectStudentForReport(result.student)}
                                className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                title="개인별 성적분석표"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    confirm(
                                      `${result.student.name} 학생을 삭제하시겠습니까?`
                                    )
                                  ) {
                                    onDeleteStudent(result.student.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="학생 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  {/* Table Footer: Subject Grade Averages */}
                  <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-700">
                    <tr>
                      <td colSpan={3} className="py-2.5 px-4 text-center text-xs font-black">
                        과목별 학년 평균
                      </td>
                      {currentSubjects.map((subj) => {
                        const stats = subjectStats.find((s) => s.subject === subj);
                        return (
                          <td
                            key={subj}
                            className="py-2.5 px-2 text-center text-xs text-blue-700 font-black"
                          >
                            {stats ? stats.average.toFixed(1) : '-'}
                            <div className="text-[10px] font-normal text-slate-400">
                              (최고 {stats?.max ?? '-'})
                            </div>
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-3 text-center text-slate-900 font-black">
                        -
                      </td>
                      <td className="py-2.5 px-3 text-center text-blue-800 font-black">
                        {gradeStats.avg}
                      </td>
                      <td colSpan={3} className="py-2.5 px-3 text-center text-xs text-slate-400 font-medium">
                        (기준: {currentExam.name})
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
