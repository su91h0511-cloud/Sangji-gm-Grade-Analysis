import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Firestore,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { Student, GradeExamSubjectMap, StudentExamScores } from '../types';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use named database if specified in config, otherwise default
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Sign in anonymously on load
signInAnonymously(auth).catch((err) => {
  console.warn('Anonymous sign-in error:', err);
});

export interface CloudGradeSystemData {
  students: Student[];
  subjectConfigs: GradeExamSubjectMap;
  scores: StudentExamScores;
  updatedAt?: string;
  updatedBy?: string;
}

const SYSTEM_DOC_REF = doc(db, 'sangji_system', 'main');

/**
 * Real-time listener for shared school grade data.
 * When a document doesn't exist yet, it seeds the initial data.
 */
export function subscribeToCloudGradeData(
  onData: (data: CloudGradeSystemData) => void,
  onError?: (error: any) => void
): () => void {
  return onSnapshot(
    SYSTEM_DOC_REF,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as CloudGradeSystemData;
        if (data && data.students && data.scores && data.subjectConfigs) {
          onData(data);
        }
      }
    },
    (error) => {
      console.error('Firestore subscription error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Initializes the cloud document if it doesn't already exist.
 */
export async function initializeCloudDataIfEmpty(
  initialData: CloudGradeSystemData
): Promise<boolean> {
  try {
    const snap = await getDoc(SYSTEM_DOC_REF);
    if (!snap.exists()) {
      await setDoc(SYSTEM_DOC_REF, {
        ...initialData,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system_init',
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error initializing cloud data:', err);
    return false;
  }
}

/**
 * Saves the current state to Firestore so all other teachers see it immediately.
 */
export async function saveGradeSystemToCloud(
  students: Student[],
  subjectConfigs: GradeExamSubjectMap,
  scores: StudentExamScores
): Promise<void> {
  try {
    await setDoc(
      SYSTEM_DOC_REF,
      {
        students,
        subjectConfigs,
        scores,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to save data to Firebase Firestore:', error);
    throw error;
  }
}
