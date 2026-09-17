import { Grade, ExamId, Student, GradeExamSubjectMap, StudentExamScores, EXAMS } from '../types';

export const COMMON_SUBJECT_PRESETS = [
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

export const STORAGE_KEYS = {
  STUDENTS: 'sangji_students_v1',
  SUBJECT_CONFIG: 'sangji_subjects_v1',
  SCORES: 'sangji_scores_v1',
  LAST_SAVED: 'sangji_last_saved_v1',
  LEAVE_WARNING: 'sangji_leave_warning_v1',
};

// Default subjects by grade and exam
export const INITIAL_SUBJECT_CONFIG: GradeExamSubjectMap = {
  // 1학년
  '1_1-mid': ['국어', '수학', '영어', '사회', '과학'],
  '1_1-final': ['국어', '수학', '영어', '사회', '과학', '도덕', '기술·가정'],
  '1_2-mid': ['국어', '수학', '영어', '사회', '과학'],
  '1_2-final': ['국어', '수학', '영어', '사회', '과학', '도덕', '기술·가정'],

  // 2학년 (기본)
  '2_1-mid': ['국어', '수학', '영어', '역사', '과학'],
  '2_1-final': ['국어', '수학', '영어', '역사', '과학', '도덕', '기술·가정'],
  '2_2-mid': ['국어', '수학', '영어', '역사', '과학'],
  '2_2-final': ['국어', '수학', '영어', '역사', '과학', '도덕', '기술·가정', '한문'],

  // 3학년
  '3_1-mid': ['국어', '수학', '영어', '사회', '과학', '역사'],
  '3_1-final': ['국어', '수학', '영어', '사회', '과학', '역사', '도덕', '기술·가정'],
  '3_2-mid': ['국어', '수학', '영어', '사회', '과학', '역사'],
  '3_2-final': ['국어', '수학', '영어', '사회', '과학', '역사', '기술·가정'],
};

// Realistic student names for Sangji Girls' Middle School
const STUDENT_NAMES: string[] = [
  '김민지', '이서연', '박지유', '정하은', '최서윤', '강민서', '조수아', '윤채원', '장예은', '임지우',
  '한서현', '오윤아', '서다은', '신유진', '권가은', '황시은', '안지원', '송예린', '류서진', '홍수빈',
  '백지민', '문채은', '양은서', '손나연', '배하율', '조민서', '유다인', '고소율', '문서영', '노유나',
  '정지안', '김수연', '박시현', '이채윤', '최서아', '강하린', '조은율', '윤다솜', '장가율', '임소희',
  '한채원', '오지효', '서하늬', '신보민', '권다희', '황유빈', '안세아', '송시우', '류하람', '홍다경'
];

export const INITIAL_STUDENTS: Student[] = (() => {
  const students: Student[] = [];

  // Grade 1: 2 classes, 15 students each = 30 students
  let nameIdx = 0;
  for (let c = 1; c <= 2; c++) {
    for (let num = 1; num <= 15; num++) {
      students.push({
        id: `s-1-${c}-${num}`,
        grade: 1,
        classNum: c,
        studentNum: num,
        name: STUDENT_NAMES[nameIdx % STUDENT_NAMES.length],
      });
      nameIdx++;
    }
  }

  // Grade 2: 3 classes, 15 students each = 45 students
  for (let c = 1; c <= 3; c++) {
    for (let num = 1; num <= 15; num++) {
      students.push({
        id: `s-2-${c}-${num}`,
        grade: 2,
        classNum: c,
        studentNum: num,
        name: STUDENT_NAMES[nameIdx % STUDENT_NAMES.length],
      });
      nameIdx++;
    }
  }

  // Grade 3: 2 classes, 15 students each = 30 students
  for (let c = 1; c <= 2; c++) {
    for (let num = 1; num <= 15; num++) {
      students.push({
        id: `s-3-${c}-${num}`,
        grade: 3,
        classNum: c,
        studentNum: num,
        name: STUDENT_NAMES[nameIdx % STUDENT_NAMES.length],
      });
      nameIdx++;
    }
  }

  return students;
})();

// Seeded pseudorandom generator for deterministic, realistic scores
function pseudoRandom(seed: number) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateInitialScores(): StudentExamScores {
  const scores: StudentExamScores = {};

  INITIAL_STUDENTS.forEach((st, studentIdx) => {
    // Base ability from 55 to 95
    const baseAbility = 60 + (studentIdx * 17) % 35;

    EXAMS.forEach((exam, examIdx) => {
      const key = `${st.id}_${exam.id}`;
      const configKey = `${st.grade}_${exam.id}`;
      const subjects = INITIAL_SUBJECT_CONFIG[configKey] || ['국어', '수학', '영어', '사회', '과학'];

      const studentScores: Record<string, number | null> = {};

      subjects.forEach((subj, subjIdx) => {
        const seed = studentIdx * 100 + examIdx * 20 + subjIdx;
        const randVariation = (pseudoRandom(seed) - 0.45) * 22;
        // Semester progression trend: small increase or change
        const progression = (examIdx - 1.5) * 2.2;
        let score = Math.round(baseAbility + randVariation + progression);

        // Clamp to 0..100
        score = Math.max(35, Math.min(100, score));

        // Round to integer
        studentScores[subj] = score;
      });

      scores[key] = studentScores;
    });
  });

  return scores;
}

export const INITIAL_SCORES: StudentExamScores = generateInitialScores();
export const DEFAULT_SUBJECT_CONFIGS: GradeExamSubjectMap = INITIAL_SUBJECT_CONFIG;
export const COMMON_SUBJECT_POOL: string[] = COMMON_SUBJECT_PRESETS;
