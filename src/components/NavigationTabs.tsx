import React from 'react';
import { Table, TrendingUp, UserCheck, Layers, Calendar, Sparkles } from 'lucide-react';

export type TabType =
  | 'score-table'
  | 'semester-comprehensive'
  | 'subject-trend'
  | 'individual-report';

interface NavigationTabsProps {
  isComprehensiveMode: boolean;
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  selectedStudentName?: string;
  currentExamName?: string;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  isComprehensiveMode,
  activeTab,
  onChangeTab,
  selectedStudentName,
  currentExamName,
}) => {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 py-1.5">
          <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-1" aria-label="Tabs">
            {!isComprehensiveMode ? (
              /* Regular Exam Mode Tabs: 2 Tabs only */
              <>
                <button
                  onClick={() => onChangeTab('score-table')}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'score-table'
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span>전체 성적 데이터 (성적표·분포)</span>
                </button>

                <button
                  onClick={() => onChangeTab('individual-report')}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'individual-report'
                      ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>개인별 성적분석표</span>
                  {selectedStudentName && (
                    <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full font-semibold">
                      {selectedStudentName}
                    </span>
                  )}
                </button>
              </>
            ) : (
              /* Comprehensive Analysis Mode Tabs: 2 Tabs */
              <>
                <button
                  onClick={() => onChangeTab('semester-comprehensive')}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'semester-comprehensive'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/60'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>학기별 1·2차 종합 성적분석표</span>
                </button>

                <button
                  onClick={() => onChangeTab('subject-trend')}
                  className={`flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                    activeTab === 'subject-trend'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/60'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>과목별 점수 추이 및 통계</span>
                </button>
              </>
            )}
          </nav>

          {/* Current Mode Badge */}
          <div className="hidden sm:flex items-center">
            {isComprehensiveMode ? (
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>종합 분석 모드 (학기별 종합 & 추이 분석)</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{currentExamName || '선택 시험'} 성적 관리 모드</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
