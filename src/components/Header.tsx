import React, { useRef } from 'react';
import {
  GraduationCap,
  Calendar,
  BookOpen,
  RotateCcw,
  Users,
  ChevronDown,
  UploadCloud,
  ShieldCheck,
  RefreshCw,
  FileDown,
  FileUp,
  CheckCircle2,
  Layers,
  Cloud,
} from 'lucide-react';
import { Grade, ExamInfo, EXAMS, Student } from '../types';

interface HeaderProps {
  currentGrade: Grade;
  onSelectGrade: (grade: Grade) => void;
  currentExam: ExamInfo;
  onSelectExam: (exam: ExamInfo) => void;
  isComprehensiveMode: boolean;
  onSelectComprehensive: () => void;
  currentSubjects: string[];
  onOpenSubjectModal: () => void;
  onOpenUploadModal: () => void;
  onOpenScoreResetModal: () => void;
  onResetData: () => void;
  studentsInGrade: Student[];
  lastSavedTime: Date | null;
  isSaving: boolean;
  isCloudConnected?: boolean;
  enableLeaveWarning: boolean;
  onToggleLeaveWarning: () => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentGrade,
  onSelectGrade,
  currentExam,
  onSelectExam,
  isComprehensiveMode,
  onSelectComprehensive,
  currentSubjects,
  onOpenSubjectModal,
  onOpenUploadModal,
  onOpenScoreResetModal,
  onResetData,
  studentsInGrade,
  lastSavedTime,
  isSaving,
  isCloudConnected = true,
  enableLeaveWarning,
  onToggleLeaveWarning,
  onExportBackup,
  onImportBackup,
}) => {
  const [showDataMenu, setShowDataMenu] = React.useState(false);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const formatSavedTime = (date: Date | null) => {
    if (!date) return '방금 전';
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {/* Top brand line & action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  상지여자중학교 성적분석 시스템
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  1~3학년 성적 분석
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Auto-save & Cloud Sync Indicator */}
            <div
              className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold shadow-2xs select-none transition-all ${
                isCloudConnected
                  ? 'bg-blue-50/90 text-blue-900 border border-blue-200'
                  : 'bg-emerald-50/80 text-emerald-800 border border-emerald-200/80'
              }`}
              title={
                isCloudConnected
                  ? '클라우드 실시간 동기화 활성화: 다른 컴퓨터나 다른 사용자가 링크로 접속해도 모든 자료가 실시간으로 자동 공유·저장됩니다.'
                  : '브라우저 자동 저장 활성화'
              }
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span className="text-blue-700 font-bold">클라우드 동기화 중...</span>
                </>
              ) : (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  <Cloud className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    클라우드 실시간 동기화됨{' '}
                    <span className="font-mono text-[11px] text-blue-700 font-normal">
                      ({formatSavedTime(lastSavedTime)})
                    </span>
                  </span>
                </>
              )}
            </div>

            {/* Subject Manager Button */}
            <button
              onClick={onOpenSubjectModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 hover:text-blue-700 border border-slate-300 rounded-xl transition-all shadow-2xs active:scale-98"
              title="시험 과목 편집"
            >
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>시험 과목 설정</span>
              <span className="ml-0.5 px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-md text-xs font-bold">
                {currentSubjects.length}과목
              </span>
            </button>

            {/* Score and Student Data Upload Button */}
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs active:scale-98"
              title="학생 기본 정보 및 시험 점수 일괄 업로드"
            >
              <UploadCloud className="w-4 h-4" />
              <span>자료 업로드</span>
            </button>

            {/* Score Reset Button */}
            <button
              onClick={onOpenScoreResetModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 hover:text-rose-800 border border-rose-200 rounded-xl transition-all shadow-2xs active:scale-98"
              title="성적 점수 데이터 초기화 (현재 시험 또는 학년 점수 비우기)"
            >
              <RotateCcw className="w-4 h-4 text-rose-500" />
              <span>점수 초기화</span>
            </button>

            {/* Data Protection & Safety Management Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDataMenu(!showDataMenu)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1"
                title="데이터 안전 보호 및 관리 메뉴"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showDataMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowDataMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 text-xs animate-in fade-in zoom-in-95">
                    {/* Status header inside dropdown */}
                    <div className="px-4 pb-2.5 mb-2 border-b border-slate-100">
                      <div className="flex items-center justify-between font-bold text-slate-800">
                        <span>데이터 안전 보호 상태</span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          실시간 자동저장
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        마지막 저장: <span className="font-mono text-slate-700 font-semibold">{lastSavedTime?.toLocaleTimeString('ko-KR') || '방금 전'}</span>
                      </div>
                    </div>

                    {/* Page leave warning toggle */}
                    <div className="px-4 py-2 hover:bg-slate-50 transition-colors">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={enableLeaveWarning}
                          onChange={() => onToggleLeaveWarning()}
                          className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-bold text-slate-800">
                            페이지 이탈 전 경고 알림
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                            실수로 탭이나 브라우저를 닫을 때 데이터 보호 확인창을 표시합니다.
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="my-1.5 border-t border-slate-100" />

                    {/* Offline Backup & Restore buttons */}
                    <button
                      onClick={() => {
                        setShowDataMenu(false);
                        onExportBackup();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                    >
                      <FileDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div>
                        <div>전체 데이터 백업 다운로드 (.json)</div>
                        <div className="text-[10px] text-slate-400">모든 성적과 학생 데이터를 안전하게 파일로 저장</div>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        setShowDataMenu(false);
                        backupFileInputRef.current?.click();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 font-medium"
                    >
                      <FileUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <div>
                        <div>백업 파일에서 데이터 복원 (.json)</div>
                        <div className="text-[10px] text-slate-400">이전에 저장한 백업 파일을 불러옵니다</div>
                      </div>
                    </button>

                    <input
                      ref={backupFileInputRef}
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          onImportBackup(e.target.files[0]);
                          e.target.value = '';
                        }
                      }}
                    />

                    <div className="my-1.5 border-t border-slate-100" />

                    {/* Reset button */}
                    <button
                      onClick={() => {
                        setShowDataMenu(false);
                        onResetData();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2 font-medium"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      <div>
                        <div>기본 예시 데이터로 초기화</div>
                        <div className="text-[10px] text-rose-400">현재 입력한 데이터를 지우고 기본값으로 리셋</div>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Grade & Exam Selectors bar */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
          {/* Grade selection tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {([1, 2, 3] as Grade[]).map((grade) => {
              const isSelected = currentGrade === grade;
              const count = grade === currentGrade ? studentsInGrade.length : undefined;

              return (
                <button
                  key={grade}
                  onClick={() => onSelectGrade(grade)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{grade}학년</span>
                  {count !== undefined && (
                    <span className="px-1.5 py-0.2 bg-blue-50 text-blue-600 rounded text-[11px] font-semibold">
                      {count}명
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Exam selection tabs & 종합 분석 */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-full">
            {EXAMS.map((exam) => {
              const isSelected = !isComprehensiveMode && currentExam.id === exam.id;
              return (
                <button
                  key={exam.id}
                  onClick={() => onSelectExam(exam)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{exam.name}</span>
                </button>
              );
            })}

            {/* Subtle Divider */}
            <div className="w-px h-5 bg-slate-300 mx-0.5 shrink-0" />

            {/* 종합 분석 Tab right next to 2학기 2차 */}
            <button
              onClick={onSelectComprehensive}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isComprehensiveMode
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 hover:text-indigo-900 font-semibold'
              }`}
              title="학기별 1·2차 종합 성적분석 및 과목별 점수 추이 통계"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>종합 분석</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
