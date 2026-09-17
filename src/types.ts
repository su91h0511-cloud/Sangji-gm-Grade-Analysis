export type Grade = 1 | 2 | 3;

export type ExamId = '1-mid' | '1-final' | '2-mid' | '2-final';

export interface ExamInfo {
  id: ExamId;
  name: string;
  label: string;
  semester: 1 | 2;
  order: number;
}

export const EXAMS: ExamInfo[] = [
  { id: '1-mid', name: '1학기 1차(중간)', label: '1학기 1차', semester: 1, order: 1 },
  { id: '1-final', name: '1학기 2차(기말)', label: '1학기 2차', semester: 1, order: 2 },
  { id: '2-mid', name: '2학기 1차(중간)', label: '2학기 1차', semester: 2, order: 3 },
  { id: '2-final', name: '2학기 2차(기말)', label: '2학기 2차', semester: 2, order: 4 },
];

export interface Student {
  id: string;
  grade: Grade;
  classNum: number;
  studentNum: number;
  name: string;
}

// Map key: `${grade}_${examId}` e.g. "2_1-mid"
export type GradeExamSubjectMap = Record<string, string[]>;

// Map key: `${studentId}_${examId}` -> { [subjectName]: score }
export type StudentExamScores = Record<string, Record<string, number | null>>;

export interface UploadStudentRecord {
  grade: Grade;
  classNum: number;
  studentNum: number;
  name: string;
  scores: Record<string, number | null>;
}

export interface StudentCalculatedResult {
  student: Student;
  scores: Record<string, number | null>;
  total: number;
  average: number;
  gradeRank: number;
  classRank: number;
  totalInGrade: number;
  totalInClass: number;
  validSubjectCount: number;
  percentile: number;
  subjectAchievements: Record<
    string,
    {
      score: number | null;
      achievement: string;
      gradeRank: number;
      classRank: number;
    }
  >;
}

export interface SubjectStats {
  subject: string;
  count: number;
  average: number;
  stdDev: number;
  max: number;
  min: number;
  distribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    E: number;
  };
}

export interface SemesterComprehensiveResult {
  student: Student;
  exam1Result?: StudentCalculatedResult;
  exam2Result?: StudentCalculatedResult;
  combinedTotal: number;
  combinedAverage: number;
  gradeRank: number;
  classRank: number;
  totalInGrade: number;
  totalInClass: number;
  percentile: number;
  scoreChange: number | null;
  subjectCombined: Record<
    string,
    {
      score1: number | null;
      score2: number | null;
      average: number | null;
      achievement: string;
    }
  >;
}

export const COMMON_SUBJECT_POOL: string[] = [
  '국어',
  '수학',
  '영어',
  '사회',
  '역사',
  '과학',
  '도덕',
  '기술·가정',
  '한문',
  '정보',
  '체육',
  '음악',
  '미술',
  '일본어',
  '중국어',
];
