import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Grade,
  ExamInfo,
  ExamId,
  Student,
  StudentExamScores,
  GradeExamSubjectMap,
  EXAMS,
} from './types';
import {
  INITIAL_STUDENTS,
  INITIAL_SCORES,
  DEFAULT_SUBJECT_CONFIGS,
} from './data/initialData';
import {
  calculateExamResults,
  calculateSubjectStats,
} from './utils/gradeCalculations';
import {
  subscribeToCloudGradeData,
  saveGradeSystemToCloud,
  initializeCloudDataIfEmpty,
} from './lib/firebase';
import { Header } from './components/Header';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { StudentScoreTable } from './components/StudentScoreTable';
import { IndividualReportCard } from './components/IndividualReportCard';
import { SemesterComprehensiveView } from './components/SemesterComprehensiveView';
import { SubjectTrendView } from './components/SubjectTrendView';
import { SubjectManagerModal } from './components/SubjectManagerModal';
import { ScoreDataUploadModal } from './components/ScoreDataUploadModal';
import { ScoreResetModal } from './components/ScoreResetModal';
import { AddStudentModal } from './components/AddStudentModal';

const LOCAL_STORAGE_KEY = 'sangji_girls_ms_grade_system_v1';

interface SavedState {
  students: Student[];
  subjectConfigs: GradeExamSubjectMap;
  scores: StudentExamScores;
  enableLeaveWarning?: boolean;
}

export default function App() {
  // Load initial data from localStorage if available
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: SavedState = JSON.parse(saved);
        if (parsed.students && Array.isArray(parsed.students)) {
          return parsed.students;
        }
      }
    } catch (e) {
      console.error('Failed to load students from localStorage', e);
    }
    return INITIAL_STUDENTS;
  });

  const [subjectConfigs, setSubjectConfigs] = useState<GradeExamSubjectMap>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: SavedState = JSON.parse(saved);
        if (parsed.subjectConfigs && typeof parsed.subjectConfigs === 'object') {
          return parsed.subjectConfigs;
        }
      }
    } catch (e) {
      console.error('Failed to load subjectConfigs from localStorage', e);
    }
    return DEFAULT_SUBJECT_CONFIGS;
  });

  const [scores, setScores] = useState<StudentExamScores>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: SavedState = JSON.parse(saved);
        if (parsed.scores && typeof parsed.scores === 'object') {
          return parsed.scores;
        }
      }
    } catch (e) {
      console.error('Failed to load scores from localStorage', e);
    }
    return INITIAL_SCORES;
  });

  const [enableLeaveWarning, setEnableLeaveWarning] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: SavedState = JSON.parse(saved);
        return parsed.enableLeaveWarning ?? true;
      }
    } catch (e) {}
    return true;
  });

  // Cloud connection status
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const isIncomingCloudSyncRef = useRef<boolean>(false);
  const initialCloudLoadDoneRef = useRef<boolean>(false);

  // Current active selections
  const [currentGrade, setCurrentGrade] = useState<Grade>(3);
  const [currentExamId, setCurrentExamId] = useState<ExamId>('1-mid');
  const [isComprehensiveMode, setIsComprehensiveMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('score-table');

  // Selected student for Report Card
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Modals
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isScoreResetModalOpen, setIsScoreResetModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  // Auto-save tracking state
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(new Date());
  const [isSaving, setIsSaving] = useState(false);

  // Current Exam Object
  const currentExam = useMemo(() => {
    return EXAMS.find((e) => e.id === currentExamId) || EXAMS[0];
  }, [currentExamId]);

  // Current Subjects for Grade & Exam
  const currentSubjects = useMemo(() => {
    const key = `${currentGrade}_${currentExamId}`;
    return subjectConfigs[key] || [];
  }, [currentGrade, currentExamId, subjectConfigs]);

  // Students in Current Grade
  const studentsInGrade = useMemo(() => {
    return students.filter((s) => s.grade === currentGrade);
  }, [students, currentGrade]);

  // Auto select a default student for report card if none selected
  useEffect(() => {
    if (studentsInGrade.length > 0) {
      if (!selectedStudent || selectedStudent.grade !== currentGrade) {
        setSelectedStudent(studentsInGrade[0]);
      }
    } else {
      setSelectedStudent(null);
    }
  }, [studentsInGrade, currentGrade, selectedStudent]);

  // Real-time calculation of current exam results
  const currentExamResults = useMemo(() => {
    return calculateExamResults(
      studentsInGrade,
      currentSubjects,
      scores,
      currentExamId
    );
  }, [studentsInGrade, currentSubjects, scores, currentExamId]);

  // Subject statistics (average, max, stdDev, distribution) for current exam
  const currentSubjectStats = useMemo(() => {
    return calculateSubjectStats(currentSubjects, currentExamResults);
  }, [currentSubjects, currentExamResults]);

  // Real-time Firestore Cloud Subscription
  useEffect(() => {
    // Attempt initializing empty cloud collection first
    initializeCloudDataIfEmpty({
      students: INITIAL_STUDENTS,
      subjectConfigs: DEFAULT_SUBJECT_CONFIGS,
      scores: INITIAL_SCORES,
    }).catch((err) => {
      console.warn('Initial cloud seed skipped or already present:', err);
    });

    const unsubscribe = subscribeToCloudGradeData(
      (cloudData) => {
        isIncomingCloudSyncRef.current = true;
        setStudents(cloudData.students);
        setSubjectConfigs(cloudData.subjectConfigs);
        setScores(cloudData.scores);
        if (cloudData.updatedAt) {
          setLastSavedTime(new Date(cloudData.updatedAt));
        }
        setIsCloudConnected(true);
        initialCloudLoadDoneRef.current = true;

        // Reset incoming flag on next tick
        setTimeout(() => {
          isIncomingCloudSyncRef.current = false;
        }, 100);
      },
      (err) => {
        console.warn('Firestore real-time subscription error, using local storage:', err);
        setIsCloudConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-save effect (saves to localStorage AND syncs to Firebase Cloud)
  useEffect(() => {
    // If update originated from cloud subscription, don't ping-pong write back
    if (isIncomingCloudSyncRef.current) {
      return;
    }

    setIsSaving(true);
    const timer = setTimeout(async () => {
      try {
        const stateToSave: SavedState = {
          students,
          subjectConfigs,
          scores,
          enableLeaveWarning,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));

        // Save to Firebase Cloud so other users see updates instantly
        await saveGradeSystemToCloud(students, subjectConfigs, scores);
        setLastSavedTime(new Date());
        setIsCloudConnected(true);
      } catch (e) {
        console.error('Failed to sync data to cloud/localStorage', e);
      } finally {
        setIsSaving(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [students, subjectConfigs, scores, enableLeaveWarning]);

  // Page leave warning listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (enableLeaveWarning) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enableLeaveWarning]);

  // Handlers for selection
  const handleSelectGrade = (newGrade: Grade) => {
    setCurrentGrade(newGrade);
  };

  const handleSelectExam = (newExam: ExamInfo) => {
    setCurrentExamId(newExam.id);
    setIsComprehensiveMode(false);
    if (activeTab === 'semester-comprehensive' || activeTab === 'subject-trend') {
      setActiveTab('score-table');
    }
  };

  const handleSelectComprehensive = () => {
    setIsComprehensiveMode(true);
    if (activeTab !== 'semester-comprehensive' && activeTab !== 'subject-trend') {
      setActiveTab('semester-comprehensive');
    }
  };

  const handleChangeTab = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'semester-comprehensive' || tab === 'subject-trend') {
      setIsComprehensiveMode(true);
    } else {
      setIsComprehensiveMode(false);
    }
  };

  // Score editing
  const handleUpdateScore = useCallback(
    (studentId: string, subject: string, scoreVal: number | null) => {
      setScores((prev) => {
        const scoreKey = `${studentId}_${currentExamId}`;
        const currentStudentExamScores = { ...(prev[scoreKey] || {}) };

        if (scoreVal === null) {
          delete currentStudentExamScores[subject];
        } else {
          currentStudentExamScores[subject] = scoreVal;
        }

        return {
          ...prev,
          [scoreKey]: currentStudentExamScores,
        };
      });
    },
    [currentExamId]
  );

  // Student deletion
  const handleDeleteStudent = (studentId: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    setScores((prev) => {
      const next = { ...prev };
      EXAMS.forEach((ex) => {
        delete next[`${studentId}_${ex.id}`];
      });
      return next;
    });
  };

  // Student addition
  const handleAddStudent = (newStudent: Student) => {
    setStudents((prev) => [...prev, newStudent]);
  };

  // Update subjects for current grade & exam
  const handleUpdateSubjects = (newSubjects: string[]) => {
    const key = `${currentGrade}_${currentExamId}`;
    setSubjectConfigs((prev) => ({
      ...prev,
      [key]: newSubjects,
    }));
  };

  // Batch update students and scores from Excel/CSV upload
  const handleBatchUpdateStudentsAndScores = (
    newStudents: Student[],
    newScores: StudentExamScores
  ) => {
    setStudents(newStudents);
    setScores((prev) => ({
      ...prev,
      ...newScores,
    }));
  };

  // Reset Actions
  const handleResetCurrentExamScores = (grade: Grade, examId: string) => {
    const gradeStudents = students.filter((s) => s.grade === grade);
    setScores((prev) => {
      const updated = { ...prev };
      gradeStudents.forEach((st) => {
        delete updated[`${st.id}_${examId}`];
      });
      return updated;
    });
  };

  const handleResetGradeAllExamsScores = (grade: Grade) => {
    const gradeStudents = students.filter((s) => s.grade === grade);
    setScores((prev) => {
      const updated = { ...prev };
      gradeStudents.forEach((st) => {
        EXAMS.forEach((ex) => {
          delete updated[`${st.id}_${ex.id}`];
        });
      });
      return updated;
    });
  };

  const handleResetAllSystemData = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setStudents(INITIAL_STUDENTS);
    setSubjectConfigs(DEFAULT_SUBJECT_CONFIGS);
    setScores(INITIAL_SCORES);
  };

  // JSON Backup Export & Import
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      school: '상지여자중학교',
      students,
      subjectConfigs,
      scores,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `상지여자중학교_성적데이터_백업_${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.students || !parsed.subjectConfigs || !parsed.scores) {
          alert('유효하지 않은 백업 파일 형식입니다.');
          return;
        }

        if (confirm('백업 파일 데이터로 현재 시스템을 복원하시겠습니까?')) {
          setStudents(parsed.students);
          setSubjectConfigs(parsed.subjectConfigs);
          setScores(parsed.scores);
          alert('성공적으로 데이터가 복원되었습니다.');
        }
      } catch (err: any) {
        alert(`백업 파일 읽기 실패: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Quick navigation to individual report
  const handleSelectStudentForReport = (student: Student) => {
    setSelectedStudent(student);
    setIsComprehensiveMode(false);
    setActiveTab('individual-report');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header (Hidden during print) */}
      <div className="print:hidden">
        <Header
          currentGrade={currentGrade}
          onSelectGrade={handleSelectGrade}
          currentExam={currentExam}
          onSelectExam={handleSelectExam}
          isComprehensiveMode={isComprehensiveMode}
          onSelectComprehensive={handleSelectComprehensive}
          currentSubjects={currentSubjects}
          onOpenSubjectModal={() => setIsSubjectModalOpen(true)}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
          onOpenScoreResetModal={() => setIsScoreResetModalOpen(true)}
          onResetData={handleResetAllSystemData}
          studentsInGrade={studentsInGrade}
          lastSavedTime={lastSavedTime}
          isSaving={isSaving}
          isCloudConnected={isCloudConnected}
          enableLeaveWarning={enableLeaveWarning}
          onToggleLeaveWarning={() => setEnableLeaveWarning(!enableLeaveWarning)}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
        />

        {/* 2. Navigation Tabs Bar */}
        <NavigationTabs
          isComprehensiveMode={isComprehensiveMode}
          activeTab={activeTab}
          onChangeTab={handleChangeTab}
          selectedStudentName={selectedStudent?.name}
          currentExamName={currentExam.name}
        />
      </div>

      {/* 3. Main Content View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'score-table' && (
          <StudentScoreTable
            grade={currentGrade}
            currentExam={currentExam}
            currentSubjects={currentSubjects}
            results={currentExamResults}
            subjectStats={currentSubjectStats}
            onUpdateScore={handleUpdateScore}
            onDeleteStudent={handleDeleteStudent}
            onOpenUploadModal={() => setIsUploadModalOpen(true)}
            onOpenScoreResetModal={() => setIsScoreResetModalOpen(true)}
            onSelectStudentForReport={handleSelectStudentForReport}
          />
        )}

        {activeTab === 'individual-report' && (
          <IndividualReportCard
            grade={currentGrade}
            currentExam={currentExam}
            currentSubjects={currentSubjects}
            allStudentsInGrade={studentsInGrade}
            selectedStudent={selectedStudent}
            onSelectStudent={(st) => setSelectedStudent(st)}
            results={currentExamResults}
            subjectStats={currentSubjectStats}
            subjectConfigs={subjectConfigs}
            scores={scores}
          />
        )}

        {activeTab === 'semester-comprehensive' && (
          <SemesterComprehensiveView
            grade={currentGrade}
            students={students}
            subjectConfigs={subjectConfigs}
            scores={scores}
            onSelectStudentForReport={handleSelectStudentForReport}
          />
        )}

        {activeTab === 'subject-trend' && (
          <SubjectTrendView
            grade={currentGrade}
            currentExam={currentExam}
            currentSubjects={currentSubjects}
            students={students}
            subjectConfigs={subjectConfigs}
            scores={scores}
            subjectStats={currentSubjectStats}
          />
        )}
      </main>

      {/* Footer (Hidden during print) */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>상지여자중학교 지필평가 성적분석 및 통계 시스템</span>
          <span>강원도 원주시 상지여자중학교 교무실 / 학년 연구실</span>
        </div>
      </footer>

      {/* MODALS */}
      <SubjectManagerModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        grade={currentGrade}
        currentExam={currentExam}
        currentSubjects={currentSubjects}
        onUpdateSubjects={handleUpdateSubjects}
      />

      <ScoreDataUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        grade={currentGrade}
        currentExam={currentExam}
        currentSubjects={currentSubjects}
        students={students}
        onBatchUpdateStudentsAndScores={handleBatchUpdateStudentsAndScores}
      />

      <ScoreResetModal
        isOpen={isScoreResetModalOpen}
        onClose={() => setIsScoreResetModalOpen(false)}
        grade={currentGrade}
        currentExam={currentExam}
        onResetExamScores={handleResetCurrentExamScores}
        onResetGradeAllExamsScores={handleResetGradeAllExamsScores}
        onResetAllSystemData={handleResetAllSystemData}
      />

      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        defaultGrade={currentGrade}
        onAddStudent={handleAddStudent}
      />
    </div>
  );
}
