import React, { useState } from 'react';
import { X, Plus, Trash2, BookOpen, AlertCircle } from 'lucide-react';
import { Grade, ExamInfo, COMMON_SUBJECT_POOL } from '../types';

interface SubjectManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: Grade;
  currentExam: ExamInfo;
  currentSubjects: string[];
  onUpdateSubjects: (newSubjects: string[]) => void;
}

export const SubjectManagerModal: React.FC<SubjectManagerModalProps> = ({
  isOpen,
  onClose,
  grade,
  currentExam,
  currentSubjects,
  onUpdateSubjects,
}) => {
  const [subjects, setSubjects] = useState<string[]>(currentSubjects);
  const [customSubjectName, setCustomSubjectName] = useState('');

  // Sync with currentSubjects whenever modal opens
  React.useEffect(() => {
    setSubjects(currentSubjects);
  }, [currentSubjects, isOpen]);

  if (!isOpen) return null;

  const handleToggleSubject = (name: string) => {
    if (subjects.includes(name)) {
      setSubjects(subjects.filter((s) => s !== name));
    } else {
      setSubjects([...subjects, name]);
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customSubjectName.trim();
    if (!trimmed) return;
    if (subjects.includes(trimmed)) {
      alert('이미 추가된 과목입니다.');
      return;
    }
    setSubjects([...subjects, trimmed]);
    setCustomSubjectName('');
  };

  const handleRemove = (name: string) => {
    setSubjects(subjects.filter((s) => s !== name));
  };

  const handleSave = () => {
    if (subjects.length === 0) {
      if (!confirm('시험 과목이 0개입니다. 계속하시겠습니까?')) {
        return;
      }
    }
    onUpdateSubjects(subjects);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                시험 실시 과목 설정
              </h3>
              <p className="text-xs text-slate-500">
                {grade}학년 {currentExam.name}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Currently Selected List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">
                선택된 시험 과목 ({subjects.length}개)
              </label>
              <span className="text-[11px] text-slate-400">
                * 성적표와 석차 계산에 포함됩니다
              </span>
            </div>

            {subjects.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                선택된 과목이 없습니다. 아래 풀에서 과목을 선택하거나 직접 추가해주세요.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                {subjects.map((subj) => (
                  <span
                    key={subj}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold border border-slate-200 shadow-2xs group"
                  >
                    <span>{subj}</span>
                    <button
                      type="button"
                      onClick={() => handleRemove(subj)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Select from Common Pool */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              중학교 추천 공통 과목 (클릭하여 켜기/끄기)
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_SUBJECT_POOL.map((item) => {
                const isSelected = subjects.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleToggleSubject(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs font-bold'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? `✓ ${item}` : `+ ${item}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direct Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              직접 과목 추가
            </label>
            <form onSubmit={handleAddCustom} className="flex gap-2">
              <input
                type="text"
                placeholder="예: 보건, 진로와직업, 컴퓨터 등"
                value={customSubjectName}
                onChange={(e) => setCustomSubjectName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>추가</span>
              </button>
            </form>
          </div>

          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              과목을 변경하거나 제외하면 기존에 입력된 해당 과목의 점수 데이터는 그대로 보존되지만,
              성적표 계산 및 총점/평균/석차 산출에서는 제외됩니다.
            </p>
          </div>
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
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
          >
            적용 및 저장
          </button>
        </div>
      </div>
    </div>
  );
};
