import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { Grade, Student } from '../types';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultGrade: Grade;
  onAddStudent: (newStudent: Student) => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  defaultGrade,
  onAddStudent,
}) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<Grade>(defaultGrade);
  const [classNum, setClassNum] = useState<number>(1);
  const [studentNum, setStudentNum] = useState<number>(1);

  React.useEffect(() => {
    setGrade(defaultGrade);
  }, [defaultGrade, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('학생 이름을 입력해주세요.');
      return;
    }

    const newStudent: Student = {
      id: `s_${grade}_${classNum}_${studentNum}_${Date.now()}`,
      name: name.trim(),
      grade,
      classNum,
      studentNum,
    };

    onAddStudent(newStudent);
    setName('');
    setStudentNum((prev) => prev + 1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">신규 학생 추가</h3>
              <p className="text-[11px] text-slate-500">학생 기본 인적사항 입력</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              학년 선택
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGrade(g as Grade)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    grade === g
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {g}학년
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                학급 (반)
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={classNum}
                onChange={(e) => setClassNum(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                번호
              </label>
              <input
                type="number"
                min={1}
                max={45}
                value={studentNum}
                onChange={(e) => setStudentNum(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              학생 이름
            </label>
            <input
              type="text"
              placeholder="예: 김민지"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
              autoFocus
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs"
            >
              학생 추가하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
