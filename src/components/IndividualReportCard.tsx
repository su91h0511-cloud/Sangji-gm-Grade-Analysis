import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  User,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle,
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
import { ReportCardSheet } from './ReportCardSheet';

interface IndividualReportCardProps {
  grade: Grade;
  currentExam: ExamInfo;
  currentSubjects: string[];
  allStudentsInGrade: Student[];
  selectedStudent: Student | null;
  onSelectStudent: (student: Student) => void;
  results: StudentCalculatedResult[];
  subjectStats: SubjectStats[];
  subjectConfigs: GradeExamSubjectMap;
  scores: StudentExamScores;
}

export const IndividualReportCard: React.FC<IndividualReportCardProps> = ({
  grade,
  currentExam,
  currentSubjects,
  allStudentsInGrade,
  selectedStudent,
  onSelectStudent,
  results,
  subjectStats,
  subjectConfigs,
  scores,
}) => {
  // Mode: 'single' or 'batch'
  const [viewMode, setViewMode] = useState<'single' | 'batch'>('single');

  // Filter & Sort states
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'class_num' | 'rank' | 'class_rank' | 'name'>('class_num');

  // Fast result lookup map
  const resultMap = useMemo(() => {
    const map = new Map<string, StudentCalculatedResult>();
    results.forEach((r) => map.set(r.student.id, r));
    return map;
  }, [results]);

  // Unique classes in this grade
  const availableClasses = useMemo(() => {
    const classSet = new Set<number>();
    allStudentsInGrade.forEach((s) => classSet.add(s.classNum));
    return Array.from(classSet).sort((a, b) => a - b);
  }, [allStudentsInGrade]);

  // Filtered and sorted students according to user selections
  const orderedStudents = useMemo(() => {
    let list = [...allStudentsInGrade];

    // Filter by class
    if (selectedClassFilter !== 'all') {
      const clsNum = Number(selectedClassFilter);
      list = list.filter((s) => s.classNum === clsNum);
    }

    // Sort according to selection
    list.sort((a, b) => {
      if (sortBy === 'class_num') {
        if (a.classNum !== b.classNum) return a.classNum - b.classNum;
        return a.studentNum - b.studentNum;
      }
      if (sortBy === 'rank') {
        const resA = resultMap.get(a.id);
        const resB = resultMap.get(b.id);
        const rankA = resA ? resA.gradeRank : 9999;
        const rankB = resB ? resB.gradeRank : 9999;
        if (rankA !== rankB) return rankA - rankB;
        if (a.classNum !== b.classNum) return a.classNum - b.classNum;
        return a.studentNum - b.studentNum;
      }
      if (sortBy === 'class_rank') {
        if (a.classNum !== b.classNum) return a.classNum - b.classNum;
        const resA = resultMap.get(a.id);
        const resB = resultMap.get(b.id);
        const cRankA = resA ? resA.classRank : 9999;
        const cRankB = resB ? resB.classRank : 9999;
        if (cRankA !== cRankB) return cRankA - cRankB;
        return a.studentNum - b.studentNum;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'ko');
      }
      return 0;
    });

    return list;
  }, [allStudentsInGrade, selectedClassFilter, sortBy, resultMap]);

  const activeStudent = useMemo(() => {
    if (orderedStudents.length === 0) return null;
    if (selectedStudent && orderedStudents.some((s) => s.id === selectedStudent.id)) {
      return selectedStudent;
    }
    return orderedStudents[0];
  }, [selectedStudent, orderedStudents]);

  useEffect(() => {
    if (activeStudent && (!selectedStudent || selectedStudent.id !== activeStudent.id)) {
      onSelectStudent(activeStudent);
    }
  }, [activeStudent, selectedStudent, onSelectStudent]);

  const currentResult = useMemo(() => {
    if (!activeStudent) return null;
    return resultMap.get(activeStudent.id) || null;
  }, [activeStudent, resultMap]);

  const currentIndex = useMemo(() => {
    if (!activeStudent) return -1;
    return orderedStudents.findIndex((s) => s.id === activeStudent.id);
  }, [activeStudent, orderedStudents]);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectStudent(orderedStudents[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < orderedStudents.length - 1) {
      onSelectStudent(orderedStudents[currentIndex + 1]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (allStudentsInGrade.length === 0) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
        등록된 학생이 없습니다. 학생 성적 자료를 먼저 업로드해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls Bar (Hidden in Print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4 print:hidden">
        {/* Row 1: Mode Switcher & Primary Print Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('single')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'single'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>개별 학생 보기</span>
            </button>

            <button
              onClick={() => setViewMode('batch')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'batch'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>전체 인쇄용 보기</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[11px] font-bold ${
                  viewMode === 'batch'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {orderedStudents.length}명
              </span>
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-98"
          >
            <Printer className="w-4 h-4" />
            <span>
              {viewMode === 'single'
                ? `${activeStudent?.name || ''} 성적분석표 인쇄 / PDF`
                : `전체 성적분석표 일괄 인쇄 (${orderedStudents.length}명)`}
            </span>
          </button>
        </div>

        {/* Row 2: Common Filters & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                학급 선택:
              </span>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setSelectedClassFilter('all')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                    selectedClassFilter === 'all'
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  전체 학급 ({allStudentsInGrade.length}명)
                </button>
                {availableClasses.map((cls) => {
                  const count = allStudentsInGrade.filter(
                    (s) => s.classNum === cls
                  ).length;
                  return (
                    <button
                      key={cls}
                      onClick={() => setSelectedClassFilter(String(cls))}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                        selectedClassFilter === String(cls)
                          ? 'bg-white text-blue-700 shadow-2xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cls}반 ({count}명)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Order Selection */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                학생 정렬 순서:
              </span>
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as 'class_num' | 'rank' | 'class_rank' | 'name')
                }
                className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              >
                <option value="class_num">반 / 번호 순 (1반 1번 ~)</option>
                <option value="rank">전체 석차 순 (1등 ~)</option>
                <option value="class_rank">반별 석차 순 (반 1등 ~)</option>
                <option value="name">이름 가나다 순 (ㄱ ~ ㅎ)</option>
              </select>
            </div>
          </div>

          {viewMode === 'batch' && (
            <div className="text-xs text-slate-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                선택한 정렬 순서대로 <strong>각 학생별 페이지가 자동 분리</strong>되어 일괄 출력됩니다.
              </span>
            </div>
          )}
        </div>

        {/* Row 3: Single Student Navigation */}
        {viewMode === 'single' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">학생 바로가기:</span>
              <button
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="이전 학생"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <select
                value={activeStudent?.id || ''}
                onChange={(e) => {
                  const target = orderedStudents.find(
                    (s) => s.id === e.target.value
                  );
                  if (target) onSelectStudent(target);
                }}
                className="px-3 py-1.5 text-xs sm:text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 max-w-xs sm:max-w-md text-slate-900"
              >
                {orderedStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.classNum}반 {s.studentNum}번 {s.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleNext}
                disabled={currentIndex >= orderedStudents.length - 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="다음 학생"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <span className="text-xs font-semibold text-slate-500 ml-1">
                ({currentIndex + 1} / {orderedStudents.length}명)
              </span>
            </div>

            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>💡 상단 정렬 순서 변경 시 학생 이동 순서도 함께 변경됩니다.</span>
            </div>
          </div>
        )}
      </div>

      {/* View Renderings */}
      {viewMode === 'single' ? (
        activeStudent && currentResult ? (
          <ReportCardSheet
            student={activeStudent}
            result={currentResult}
            allResults={results}
            allStudentsInGrade={allStudentsInGrade}
            grade={grade}
            currentExam={currentExam}
            currentSubjects={currentSubjects}
            subjectStats={subjectStats}
            subjectConfigs={subjectConfigs}
            scores={scores}
          />
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
            선택된 조건의 학생 성적 데이터를 불러올 수 없습니다.
          </div>
        )
      ) : (
        <div className="space-y-8">
          {orderedStudents.map((student, index) => {
            const studentResult = results.find(
              (r) => r.student.id === student.id
            );
            if (!studentResult) return null;

            return (
              <div key={student.id} className="relative">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-500 px-1 print:hidden">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-200 text-slate-800 font-black">
                      #{index + 1}
                    </span>
                    <span className="font-bold text-slate-800">
                      {student.grade}학년 {student.classNum}반 {student.studentNum}번{' '}
                      <span className="text-blue-700 font-black">{student.name}</span>
                    </span>
                    <span className="text-slate-400">
                      · 전교 {studentResult.gradeRank}등 / {student.classNum}반 {studentResult.classRank}등
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    인쇄 시 새 페이지로 분리
                  </span>
                </div>

                <ReportCardSheet
                  student={student}
                  result={studentResult}
                  allResults={results}
                  allStudentsInGrade={allStudentsInGrade}
                  grade={grade}
                  currentExam={currentExam}
                  currentSubjects={currentSubjects}
                  subjectStats={subjectStats}
                  subjectConfigs={subjectConfigs}
                  scores={scores}
                  isBatchPrint={true}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
