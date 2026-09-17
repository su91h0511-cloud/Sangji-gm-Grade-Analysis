import {
  Grade,
  ExamId,
  Student,
  StudentCalculatedResult,
  SubjectStats,
  SemesterComprehensiveResult,
  GradeExamSubjectMap,
  StudentExamScores,
  EXAMS,
} from '../types';

export function getAchievement(score: number | null): string {
  if (score === null || isNaN(score)) return '-';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'E';
}

export function getAchievementColor(achievement: string) {
  switch (achievement) {
    case 'A':
      return { bg: 'bg-emerald-100 text-emerald-800', border: 'border-emerald-300' };
    case 'B':
      return { bg: 'bg-blue-100 text-blue-800', border: 'border-blue-300' };
    case 'C':
      return { bg: 'bg-amber-100 text-amber-800', border: 'border-amber-300' };
    case 'D':
      return { bg: 'bg-orange-100 text-orange-800', border: 'border-orange-300' };
    case 'E':
      return { bg: 'bg-rose-100 text-rose-800', border: 'border-rose-300' };
    default:
      return { bg: 'bg-slate-100 text-slate-500', border: 'border-slate-200' };
  }
}

export function calculateExamResults(
  studentsInGrade: Student[],
  subjects: string[],
  scores: StudentExamScores,
  examId: ExamId
): StudentCalculatedResult[] {
  const totalInGrade = studentsInGrade.length;

  // 1. Gather raw scores and preliminary totals
  const studentDataList = studentsInGrade.map((student) => {
    const key = `${student.id}_${examId}`;
    const studentScores = scores[key] || {};

    let total = 0;
    let validCount = 0;
    const cleanScores: Record<string, number | null> = {};

    subjects.forEach((subj) => {
      const val = studentScores[subj];
      if (typeof val === 'number' && !isNaN(val)) {
        cleanScores[subj] = val;
        total += val;
        validCount++;
      } else {
        cleanScores[subj] = null;
      }
    });

    const average = validCount > 0 ? Math.round((total / validCount) * 10) / 10 : 0;

    return {
      student,
      scores: cleanScores,
      total,
      average,
      validCount,
    };
  });

  // 2. Compute Grade-wide rank (higher average = rank 1)
  const sortedByAvg = [...studentDataList].sort((a, b) => {
    if (b.average !== a.average) return b.average - a.average;
    return b.total - a.total;
  });

  const gradeRankMap = new Map<string, number>();
  sortedByAvg.forEach((item, index) => {
    // Equal scores share the same rank
    if (index > 0 && item.average === sortedByAvg[index - 1].average) {
      gradeRankMap.set(item.student.id, gradeRankMap.get(sortedByAvg[index - 1].student.id)!);
    } else {
      gradeRankMap.set(item.student.id, index + 1);
    }
  });

  // 3. Compute Class-wide rank
  const classGroups = new Map<number, typeof studentDataList>();
  studentDataList.forEach((item) => {
    const list = classGroups.get(item.student.classNum) || [];
    list.push(item);
    classGroups.set(item.student.classNum, list);
  });

  const classRankMap = new Map<string, number>();
  const classTotalMap = new Map<number, number>();

  classGroups.forEach((classStudents, classNum) => {
    classTotalMap.set(classNum, classStudents.length);
    const sortedClass = [...classStudents].sort((a, b) => {
      if (b.average !== a.average) return b.average - a.average;
      return b.total - a.total;
    });

    sortedClass.forEach((item, index) => {
      if (index > 0 && item.average === sortedClass[index - 1].average) {
        classRankMap.set(item.student.id, classRankMap.get(sortedClass[index - 1].student.id)!);
      } else {
        classRankMap.set(item.student.id, index + 1);
      }
    });
  });

  // 4. Compute per-subject rankings
  const subjectGradeRankMaps: Record<string, Map<string, number>> = {};
  const subjectClassRankMaps: Record<string, Map<string, number>> = {};

  subjects.forEach((subj) => {
    // Grade ranking for this subject
    const subjValidStudents = studentDataList
      .filter((item) => typeof item.scores[subj] === 'number')
      .sort((a, b) => (b.scores[subj] as number) - (a.scores[subj] as number));

    const gMap = new Map<string, number>();
    subjValidStudents.forEach((item, idx) => {
      if (idx > 0 && item.scores[subj] === subjValidStudents[idx - 1].scores[subj]) {
        gMap.set(item.student.id, gMap.get(subjValidStudents[idx - 1].student.id)!);
      } else {
        gMap.set(item.student.id, idx + 1);
      }
    });
    subjectGradeRankMaps[subj] = gMap;

    // Class ranking for this subject
    const cMap = new Map<string, number>();
    classGroups.forEach((cStudents) => {
      const cValid = cStudents
        .filter((item) => typeof item.scores[subj] === 'number')
        .sort((a, b) => (b.scores[subj] as number) - (a.scores[subj] as number));

      cValid.forEach((item, idx) => {
        if (idx > 0 && item.scores[subj] === cValid[idx - 1].scores[subj]) {
          cMap.set(item.student.id, cMap.get(cValid[idx - 1].student.id)!);
        } else {
          cMap.set(item.student.id, idx + 1);
        }
      });
    });
    subjectClassRankMaps[subj] = cMap;
  });

  // 5. Build final calculated results
  return studentDataList.map((item) => {
    const gradeRank = gradeRankMap.get(item.student.id) || totalInGrade;
    const classRank = classRankMap.get(item.student.id) || 1;
    const totalInClass = classTotalMap.get(item.student.classNum) || 1;
    const percentile =
      totalInGrade > 0 ? Math.round((gradeRank / totalInGrade) * 1000) / 10 : 0;

    const subjectAchievements: StudentCalculatedResult['subjectAchievements'] = {};
    subjects.forEach((subj) => {
      const score = item.scores[subj];
      subjectAchievements[subj] = {
        score,
        achievement: getAchievement(score),
        gradeRank: subjectGradeRankMaps[subj]?.get(item.student.id) || 0,
        classRank: subjectClassRankMaps[subj]?.get(item.student.id) || 0,
      };
    });

    return {
      student: item.student,
      scores: item.scores,
      total: item.total,
      average: item.average,
      gradeRank,
      classRank,
      totalInGrade,
      totalInClass,
      validSubjectCount: item.validCount,
      percentile,
      subjectAchievements,
    };
  });
}

export function calculateSubjectStats(
  subjects: string[],
  results: StudentCalculatedResult[]
): SubjectStats[] {
  return subjects.map((subj) => {
    const validScores = results
      .map((r) => r.scores[subj])
      .filter((s): s is number => typeof s === 'number' && !isNaN(s));

    const count = validScores.length;
    if (count === 0) {
      return {
        subject: subj,
        count: 0,
        average: 0,
        stdDev: 0,
        max: 0,
        min: 0,
        distribution: { A: 0, B: 0, C: 0, D: 0, E: 0 },
      };
    }

    const sum = validScores.reduce((a, b) => a + b, 0);
    const average = Math.round((sum / count) * 10) / 10;
    const max = Math.max(...validScores);
    const min = Math.min(...validScores);

    // Standard deviation
    const variance =
      validScores.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / count;
    const stdDev = Math.round(Math.sqrt(variance) * 10) / 10;

    // Distribution
    const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    validScores.forEach((score) => {
      const ach = getAchievement(score);
      if (ach in distribution) {
        distribution[ach as keyof typeof distribution]++;
      }
    });

    return {
      subject: subj,
      count,
      average,
      stdDev,
      max,
      min,
      distribution,
    };
  });
}

export function getSubjectTrendsAcrossExams(
  grade: Grade,
  students: Student[],
  subjectConfigs: GradeExamSubjectMap,
  scores: StudentExamScores
) {
  const studentsInGrade = students.filter((s) => s.grade === grade);

  return EXAMS.map((exam) => {
    const subjects = subjectConfigs[`${grade}_${exam.id}`] || [];
    const results = calculateExamResults(studentsInGrade, subjects, scores, exam.id);
    const stats = calculateSubjectStats(subjects, results);

    const averages: Record<string, number> = {};
    stats.forEach((st) => {
      averages[st.subject] = st.average;
    });

    return {
      examId: exam.id,
      examName: exam.name,
      shortLabel: exam.label,
      averages,
    };
  });
}

export function getStudentExamTrendsWithComparisons(
  student: Student,
  allStudentsInGrade: Student[],
  subjectConfigs: GradeExamSubjectMap,
  scores: StudentExamScores
) {
  return EXAMS.map((exam) => {
    const subjects = subjectConfigs[`${student.grade}_${exam.id}`] || [];
    const results = calculateExamResults(allStudentsInGrade, subjects, scores, exam.id);
    const studentRes = results.find((r) => r.student.id === student.id);

    // Grade overall average
    const validAverages = results
      .map((r) => r.average)
      .filter((v) => typeof v === 'number' && !isNaN(v) && v > 0);
    const gradeAverage =
      validAverages.length > 0
        ? Math.round(
            (validAverages.reduce((a, b) => a + b, 0) / validAverages.length) * 10
          ) / 10
        : null;

    // Top 10 students average
    const sortedAvgs = [...validAverages].sort((a, b) => b - a);
    const top10 = sortedAvgs.slice(0, 10);
    const top10Average =
      top10.length > 0
        ? Math.round((top10.reduce((a, b) => a + b, 0) / top10.length) * 10) / 10
        : null;

    // By subject
    const subjectStats = calculateSubjectStats(subjects, results);
    const subjectComparisons: Record<
      string,
      { myScore: number | null; gradeAverage: number | null; top10Average: number | null }
    > = {};

    subjects.forEach((subj) => {
      const myScore = studentRes?.scores[subj] ?? null;
      const stat = subjectStats.find((s) => s.subject === subj);
      const subjScores = results
        .map((r) => r.scores[subj])
        .filter((s): s is number => typeof s === 'number')
        .sort((a, b) => b - a);

      const topSubj = subjScores.slice(0, 10);
      const topSubjAvg =
        topSubj.length > 0
          ? Math.round((topSubj.reduce((a, b) => a + b, 0) / topSubj.length) * 10) / 10
          : null;

      subjectComparisons[subj] = {
        myScore,
        gradeAverage: stat ? stat.average : null,
        top10Average: topSubjAvg,
      };
    });

    return {
      examId: exam.id,
      examName: exam.name,
      shortName: exam.label,
      myAverage: studentRes?.average ?? null,
      gradeAverage,
      top10Average,
      subjects: subjectComparisons,
    };
  });
}

export function calculateSemesterComprehensiveResults(
  semester: 1 | 2,
  gradeStudents: Student[],
  subjectConfigs: GradeExamSubjectMap,
  scores: StudentExamScores
): {
  results: SemesterComprehensiveResult[];
  semesterSubjects: string[];
  exam1Info: { id: ExamId; name: string; label: string };
  exam2Info: { id: ExamId; name: string; label: string };
  stats: {
    totalStudents: number;
    exam1Average: number;
    exam2Average: number;
    combinedAverage: number;
    improvedCount: number;
  };
} {
  const grade = gradeStudents[0]?.grade || 2;
  const exam1Id: ExamId = semester === 1 ? '1-mid' : '2-mid';
  const exam2Id: ExamId = semester === 1 ? '1-final' : '2-final';

  const exam1Info = EXAMS.find((e) => e.id === exam1Id)!;
  const exam2Info = EXAMS.find((e) => e.id === exam2Id)!;

  const subjects1 = subjectConfigs[`${grade}_${exam1Id}`] || [];
  const subjects2 = subjectConfigs[`${grade}_${exam2Id}`] || [];

  // Union of subjects across both exams
  const semesterSubjects = Array.from(new Set([...subjects1, ...subjects2]));

  // Calculate standard results for each exam
  const exam1Results = calculateExamResults(gradeStudents, subjects1, scores, exam1Id);
  const exam2Results = calculateExamResults(gradeStudents, subjects2, scores, exam2Id);

  const e1Map = new Map(exam1Results.map((r) => [r.student.id, r]));
  const e2Map = new Map(exam2Results.map((r) => [r.student.id, r]));

  // Combine results
  const rawCombinedList = gradeStudents.map((student) => {
    const res1 = e1Map.get(student.id);
    const res2 = e2Map.get(student.id);

    const subjectCombined: SemesterComprehensiveResult['subjectCombined'] = {};
    let combinedTotal = 0;
    let validSubjCount = 0;

    semesterSubjects.forEach((subj) => {
      const sc1 = res1?.scores[subj] ?? null;
      const sc2 = res2?.scores[subj] ?? null;

      let subAvg: number | null = null;
      if (sc1 !== null && sc2 !== null) {
        subAvg = Math.round(((sc1 + sc2) / 2) * 10) / 10;
      } else if (sc1 !== null) {
        subAvg = sc1;
      } else if (sc2 !== null) {
        subAvg = sc2;
      }

      if (subAvg !== null) {
        combinedTotal += subAvg;
        validSubjCount++;
      }

      subjectCombined[subj] = {
        score1: sc1,
        score2: sc2,
        average: subAvg,
        achievement: getAchievement(subAvg),
      };
    });

    const combinedAverage =
      validSubjCount > 0 ? Math.round((combinedTotal / validSubjCount) * 10) / 10 : 0;

    const avg1 = res1?.average ?? null;
    const avg2 = res2?.average ?? null;
    const scoreChange =
      avg1 !== null && avg2 !== null ? Math.round((avg2 - avg1) * 10) / 10 : null;

    return {
      student,
      exam1Result: res1,
      exam2Result: res2,
      combinedTotal: Math.round(combinedTotal * 10) / 10,
      combinedAverage,
      scoreChange,
      subjectCombined,
    };
  });

  // Rank combined by combinedAverage
  const sortedCombined = [...rawCombinedList].sort((a, b) => {
    if (b.combinedAverage !== a.combinedAverage) {
      return b.combinedAverage - a.combinedAverage;
    }
    return b.combinedTotal - a.combinedTotal;
  });

  const gradeRankMap = new Map<string, number>();
  sortedCombined.forEach((item, idx) => {
    if (idx > 0 && item.combinedAverage === sortedCombined[idx - 1].combinedAverage) {
      gradeRankMap.set(item.student.id, gradeRankMap.get(sortedCombined[idx - 1].student.id)!);
    } else {
      gradeRankMap.set(item.student.id, idx + 1);
    }
  });

  // Class rankings
  const classGroupMap = new Map<number, typeof rawCombinedList>();
  rawCombinedList.forEach((item) => {
    const list = classGroupMap.get(item.student.classNum) || [];
    list.push(item);
    classGroupMap.set(item.student.classNum, list);
  });

  const classRankMap = new Map<string, number>();
  const classTotalMap = new Map<number, number>();

  classGroupMap.forEach((cStudents, classNum) => {
    classTotalMap.set(classNum, cStudents.length);
    const sorted = [...cStudents].sort((a, b) => b.combinedAverage - a.combinedAverage);
    sorted.forEach((item, idx) => {
      if (idx > 0 && item.combinedAverage === sorted[idx - 1].combinedAverage) {
        classRankMap.set(item.student.id, classRankMap.get(sorted[idx - 1].student.id)!);
      } else {
        classRankMap.set(item.student.id, idx + 1);
      }
    });
  });

  const totalInGrade = gradeStudents.length;

  const results: SemesterComprehensiveResult[] = rawCombinedList.map((item) => {
    const gradeRank = gradeRankMap.get(item.student.id) || totalInGrade;
    const classRank = classRankMap.get(item.student.id) || 1;
    const totalInClass = classTotalMap.get(item.student.classNum) || 1;
    const percentile =
      totalInGrade > 0 ? Math.round((gradeRank / totalInGrade) * 1000) / 10 : 0;

    return {
      student: item.student,
      exam1Result: item.exam1Result,
      exam2Result: item.exam2Result,
      combinedTotal: item.combinedTotal,
      combinedAverage: item.combinedAverage,
      gradeRank,
      classRank,
      totalInGrade,
      totalInClass,
      percentile,
      scoreChange: item.scoreChange,
      subjectCombined: item.subjectCombined,
    };
  });

  // Calculate semester overview statistics
  const e1Avgs = exam1Results
    .map((r) => r.average)
    .filter((a) => typeof a === 'number' && a > 0);
  const e2Avgs = exam2Results
    .map((r) => r.average)
    .filter((a) => typeof a === 'number' && a > 0);
  const combAvgs = results
    .map((r) => r.combinedAverage)
    .filter((a) => typeof a === 'number' && a > 0);

  const exam1Average =
    e1Avgs.length > 0
      ? Math.round((e1Avgs.reduce((a, b) => a + b, 0) / e1Avgs.length) * 10) / 10
      : 0;

  const exam2Average =
    e2Avgs.length > 0
      ? Math.round((e2Avgs.reduce((a, b) => a + b, 0) / e2Avgs.length) * 10) / 10
      : 0;

  const combinedAverage =
    combAvgs.length > 0
      ? Math.round((combAvgs.reduce((a, b) => a + b, 0) / combAvgs.length) * 10) / 10
      : 0;

  const improvedCount = results.filter(
    (r) => r.scoreChange !== null && r.scoreChange > 0
  ).length;

  return {
    results,
    semesterSubjects,
    exam1Info,
    exam2Info,
    stats: {
      totalStudents: gradeStudents.length,
      exam1Average,
      exam2Average,
      combinedAverage,
      improvedCount,
    },
  };
}
