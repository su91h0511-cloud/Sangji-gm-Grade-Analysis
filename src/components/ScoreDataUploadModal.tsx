import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Grade, ExamInfo, Student, StudentExamScores } from '../types';

interface ScoreDataUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  grade: Grade;
  currentExam: ExamInfo;
  currentSubjects: string[];
  students: Student[];
  onBatchUpdateStudentsAndScores: (
    newStudents: Student[],
    newScores: StudentExamScores
  ) => void;
}

interface ParsedRow {
  grade: number;
  classNum: number;
  studentNum: number;
  name: string;
  scores: Record<string, number | null>;
}

export const ScoreDataUploadModal: React.FC<ScoreDataUploadModalProps> = ({
  isOpen,
  onClose,
  grade,
  currentExam,
  currentSubjects,
  students,
  onBatchUpdateStudentsAndScores,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState('');
  const [activeTab, setActiveTab] = useState<'file' | 'paste'>('file');
  const [parsedPreview, setParsedPreview] = useState<ParsedRow[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  // Generate and download a sample excel template
  const handleDownloadSampleExcel = () => {
    const sampleHeaders = ['학년', '반', '번호', '이름', ...currentSubjects];
    const sampleData = [
      sampleHeaders,
      [grade, 1, 1, '김민지', 95, 92, 88, 90, 85],
      [grade, 1, 2, '이서연', 88, 94, 90, 85, 80],
      [grade, 1, 3, '박수빈', 78, 85, 82, 88, 75],
      [grade, 2, 1, '최지은', 98, 95, 92, 96, 90],
      [grade, 2, 2, '정하은', 85, 88, 90, 82, 84],
    ];

    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${grade}학년_${currentExam.name}`);

    XLSX.writeFile(
      wb,
      `상지여중_${grade}학년_${currentExam.name}_성적양식.xlsx`
    );
  };

  // Helper to parse 2D array from file or text
  const parseRawRows = (rows: any[][]) => {
    if (rows.length < 2) {
      setErrorMessage('최소 1줄 이상의 헤더와 데이터 행이 필요합니다.');
      return;
    }

    const headers: string[] = rows[0].map((h: any) =>
      String(h || '').trim()
    );

    // Identify standard columns
    const gradeColIdx = headers.findIndex((h) => h.includes('학년'));
    const classColIdx = headers.findIndex(
      (h) => h.includes('반') || h.toLowerCase() === 'class'
    );
    const numColIdx = headers.findIndex(
      (h) => h.includes('번호') || h.toLowerCase() === 'number'
    );
    const nameColIdx = headers.findIndex(
      (h) => h.includes('이름') || h.toLowerCase() === 'name'
    );

    if (classColIdx === -1 || numColIdx === -1 || nameColIdx === -1) {
      setErrorMessage(
        '헤더에 [반], [번호], [이름] 컬럼이 반드시 포함되어야 합니다.'
      );
      return;
    }

    // Detect subject columns
    const subjectIndices: { name: string; idx: number }[] = [];
    headers.forEach((h, idx) => {
      if (
        idx !== gradeColIdx &&
        idx !== classColIdx &&
        idx !== numColIdx &&
        idx !== nameColIdx &&
        h.length > 0 &&
        !['총점', '평균', '석차', '비고', '합계'].includes(h)
      ) {
        subjectIndices.push({ name: h, idx });
      }
    });

    const parsed: ParsedRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const name = String(row[nameColIdx] || '').trim();
      const classNum = parseInt(String(row[classColIdx]), 10);
      const studentNum = parseInt(String(row[numColIdx]), 10);
      const rowGrade =
        gradeColIdx !== -1 ? parseInt(String(row[gradeColIdx]), 10) : grade;

      if (!name || isNaN(classNum) || isNaN(studentNum)) continue;

      const scores: Record<string, number | null> = {};
      subjectIndices.forEach(({ name: sName, idx }) => {
        const val = row[idx];
        if (val === undefined || val === null || String(val).trim() === '') {
          scores[sName] = null;
        } else {
          const num = Number(val);
          scores[sName] = isNaN(num) ? null : Math.min(100, Math.max(0, num));
        }
      });

      parsed.push({
        grade: isNaN(rowGrade) ? grade : rowGrade,
        classNum,
        studentNum,
        name,
        scores,
      });
    }

    if (parsed.length === 0) {
      setErrorMessage('유효한 학생 데이터 행을 찾을 수 없습니다.');
      return;
    }

    setErrorMessage(null);
    setParsedPreview(parsed);
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
        });
        parseRawRows(json);
      } catch (err: any) {
        setErrorMessage(`파일 처리 오류: ${err.message || '알 수 없는 오류'}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle pasted text (e.g. from Excel Ctrl+C)
  const handlePasteParse = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText
      .trim()
      .split('\n')
      .map((line) => line.split('\t').map((c) => c.trim()));
    parseRawRows(lines);
  };

  // Commit changes to state
  const handleApply = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;

    // Build updated student list and scores
    const updatedStudents = [...students];
    const newScores: StudentExamScores = {};

    parsedPreview.forEach((row) => {
      // Find existing student or create new
      let student = updatedStudents.find(
        (s) =>
          s.grade === row.grade &&
          s.classNum === row.classNum &&
          s.studentNum === row.studentNum
      );

      if (!student) {
        student = {
          id: `s_${row.grade}_${row.classNum}_${row.studentNum}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 6)}`,
          name: row.name,
          grade: row.grade as Grade,
          classNum: row.classNum,
          studentNum: row.studentNum,
        };
        updatedStudents.push(student);
      } else {
        // update name if changed
        student.name = row.name;
      }

      // Populate scores for current exam
      const scoreKey = `${student.id}_${currentExam.id}`;
      newScores[scoreKey] = { ...(row.scores as Record<string, number>) };
    });

    onBatchUpdateStudentsAndScores(updatedStudents, newScores);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                학생 명단 및 성적 일괄 업로드
              </h3>
              <p className="text-xs text-slate-500">
                {grade}학년 {currentExam.name} 기준
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

        {/* Tab & Template Download */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
            <button
              onClick={() => setActiveTab('file')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'file'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>엑셀 / CSV 파일 올리기</span>
            </button>
            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>엑셀 복사/붙여넣기</span>
            </button>
          </div>

          <button
            onClick={handleDownloadSampleExcel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>양식(서식) 엑셀 파일 받기</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'file' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <FileSpreadsheet className="w-10 h-10 mx-auto text-blue-600 mb-2" />
              <div className="text-sm font-bold text-slate-800">
                엑셀(.xlsx) 또는 CSV 파일을 여기로 드래그하거나 클릭하여 선택하세요
              </div>
              <p className="text-xs text-slate-400 mt-1">
                기본 컬럼: [학년], [반], [번호], [이름], [과목명1], [과목명2] ...
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                엑셀 표에서 데이터 영역(헤더 포함)을 복사(Ctrl+C)한 뒤 여기에 붙여넣기(Ctrl+V)하세요:
              </label>
              <textarea
                rows={6}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="학년	반	번호	이름	국어	수학	영어	과학	사회
3	1	1	김민지	95	92	88	90	85
3	1	2	이서연	88	94	90	85	80"
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={handlePasteParse}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                붙여넣은 데이터 파싱 및 미리보기
              </button>
            </div>
          )}

          {/* Preview of Parsed Rows */}
          {parsedPreview && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    총 {parsedPreview.length}명의 데이터가 파싱되었습니다 (미리보기)
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  반영 시 기존 동일 학번의 학생 점수가 업데이트됩니다.
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 sticky top-0 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">학번</th>
                      <th className="py-2 px-3">이름</th>
                      {Object.keys(parsedPreview[0]?.scores || {}).map((s) => (
                        <th key={s} className="py-2 px-2 text-center">
                          {s}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedPreview.slice(0, 10).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-medium text-slate-600">
                          {row.grade}학년 {row.classNum}반 {row.studentNum}번
                        </td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">
                          {row.name}
                        </td>
                        {Object.entries(row.scores).map(([s, sc]) => (
                          <td key={s} className="py-1.5 px-2 text-center font-bold text-slate-700">
                            {sc ?? '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedPreview.length > 10 && (
                  <div className="p-2 bg-slate-50 text-center text-xs text-slate-400 font-medium">
                    ... 외 {parsedPreview.length - 10}명 추가 생략
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-3 bg-blue-50 rounded-xl text-blue-900 text-xs flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              동일 학년, 반, 번호의 학생이 이미 존재할 경우 해당 학생의 기존 점수가 덮어쓰기되며,
              존재하지 않는 학생은 신규 등록됩니다.
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
            onClick={handleApply}
            disabled={!parsedPreview || parsedPreview.length === 0}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs"
          >
            시스템에 반영하기 ({parsedPreview ? parsedPreview.length : 0}명)
          </button>
        </div>
      </div>
    </div>
  );
};
