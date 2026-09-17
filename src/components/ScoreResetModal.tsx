import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, Trash2 } from 'lucide-react';
import { Grade, ExamInfo } from '../types';

interface ScoreResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: Grade;
  currentExam: ExamInfo;
  onResetExamScores: (grade: Grade, examId: string) => void;
  onResetGradeAllExamsScores: (grade: Grade) => void;
  onResetAllGradesScores?: () => void;
  onResetAllSystemData: () => void;
}

export const ScoreResetModal: React.FC<ScoreResetModalProps> = ({
  isOpen,
  onClose,
  grade,
  currentExam,
  onResetExamScores,
  onResetGradeAllExamsScores,
  onResetAllGradesScores,
  onResetAllSystemData,
}) => {
  const [resetOption, setResetOption] = useState<'currentExam' | 'gradeAll' | 'allGrades' | 'systemInitial'>('currentExam');
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const requiresTyping = resetOption === 'systemInitial';
  const isConfirmDisabled = requiresTyping && confirmText.trim() !== '초기화';

  const handleExecuteReset = () => {
    if (resetOption === 'currentExam') {
      if (confirm(`정말 [${grade}학년 ${currentExam.name}] 의 모든 학생 점수를 초기화하시겠습니까?`)) {
        onResetExamScores(grade, currentExam.id);
        onClose();
      }
    } else if (resetOption === 'gradeAll') {
      if (confirm(`정말 [${grade}학년 전체 4개 시험] 의 모든 학생 점수를 초기화하시겠습니까?`)) {
        onResetGradeAllExamsScores(grade);
        onClose();
      }
    } else if (resetOption === 'allGrades') {
      if (confirm(`정말 전 학년(1·2·3학년)의 모든 시험 점수를 비우시겠습니까? (학생 명단은 유지됩니다)`)) {
        if (onResetAllGradesScores) {
          onResetAllGradesScores();
        }
        onClose();
      }
    } else if (resetOption === 'systemInitial') {
      onResetAllSystemData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                점수 및 데이터 초기화
              </h3>
              <p className="text-xs text-slate-500">
                원하는 범위를 선택하여 데이터를 초기화합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 block">
              초기화 범위 선택:
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                resetOption === 'currentExam'
                  ? 'border-rose-500 bg-rose-50/30'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="resetOption"
                checked={resetOption === 'currentExam'}
                onChange={() => setResetOption('currentExam')}
                className="mt-0.5 text-rose-600"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900">
                  현재 시험 점수만 초기화 ({grade}학년 {currentExam.name})
                </div>
                <div className="text-[11px] text-slate-500">
                  학생 명단은 유지되며, 현재 선택된 시험의 과목별 점수만 깨끗하게 비웁니다.
                </div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                resetOption === 'gradeAll'
                  ? 'border-rose-500 bg-rose-50/30'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="resetOption"
                checked={resetOption === 'gradeAll'}
                onChange={() => setResetOption('gradeAll')}
                className="mt-0.5 text-rose-600"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900">
                  {grade}학년 전체 시험 점수 초기화 (1·2학기 4개 시험 전체)
                </div>
                <div className="text-[11px] text-slate-500">
                  {grade}학년 학생 명단은 유지되며, 해당 학년의 4개 시험 점수만 깨끗하게 비웁니다.
                </div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                resetOption === 'allGrades'
                  ? 'border-rose-500 bg-rose-50/30'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="resetOption"
                checked={resetOption === 'allGrades'}
                onChange={() => setResetOption('allGrades')}
                className="mt-0.5 text-rose-600"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900">
                  전체 학년(1~3학년) 모든 시험 점수 비우기 (학생 명단 유지)
                </div>
                <div className="text-[11px] text-slate-500">
                  1~3학년 학생 명단과 과목 설정은 그대로 보존하고, 등록된 모든 시험 점수만 빈 상태로 초기화합니다.
                </div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                resetOption === 'systemInitial'
                  ? 'border-rose-500 bg-rose-50/30'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="resetOption"
                checked={resetOption === 'systemInitial'}
                onChange={() => setResetOption('systemInitial')}
                className="mt-0.5 text-rose-600"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-rose-900 flex items-center gap-1">
                  <span>시스템 전체를 초기 기본값으로 복원</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                </div>
                <div className="text-[11px] text-slate-500">
                  상지여자중학교 1~3학년 기본 예시 데이터셋으로 전체 시스템을 재설정합니다.
                </div>
              </div>
            </label>
          </div>

          {requiresTyping && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <div className="text-xs font-bold text-rose-900">
                전체 초기화를 확인하기 위해 아래에 <span className="underline font-black">초기화</span> 라고 입력해주세요:
              </div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="초기화"
                className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleExecuteReset}
            disabled={isConfirmDisabled}
            className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>초기화 실행</span>
          </button>
        </div>
      </div>
    </div>
  );
};
