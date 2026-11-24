export type ConsultationStage =
  | 'reception'
  | 'consultation'
  | 'diagnosis';

export type ActiveTab = 'clinic' | 'tests' | 'prescription';

export type DoctorMood =
  | 'welcoming'
  | 'curious'
  | 'amused'
  | 'focused'
  | 'reassuring';

export type HistoryTopic =
  | 'chief_complaint'
  | 'onset_duration'
  | 'lifestyle_sleep'
  | 'medical_history'
  | 'memory_check'
  | 'ready_for_diagnosis';

export type MiniTestType = 'word_recall' | 'sequence_match' | 'daily_scenario';

export interface PatientProfile {
  name: string;
  age: number;
  occupation: string;
  selfRatedForgetfulness: number; // 1 to 10
}

export interface ChatMessage {
  id: string;
  role: 'doctor' | 'patient' | 'system_test';
  text: string;
  timestamp: string;
  mood?: DoctorMood;
  quickReplies?: string[];
  testSummary?: {
    testType: MiniTestType;
    title: string;
    score: number;
    maxScore: number;
    comment: string;
  };
}

export interface ClinicalFindings {
  chiefComplaint: string;
  duration: string;
  forgetfulnessTriggers: string[];
  sleepPattern: string;
  stressAndMood: string;
  caffeineAndHabits: string;
  medicalAndMeds: string;
  redFlagsCheck: string;
  doctorWittyNote: string;
}

export interface MiniTestResult {
  testType: MiniTestType;
  title: string;
  score: number;
  maxScore: number;
  details: string;
  completedAt: string;
}

export interface ConsultStepResponse {
  doctorReply: string;
  doctorMood: DoctorMood;
  quickReplies: string[];
  currentTopic: HistoryTopic;
  progressPercent: number;
  extractedFindings: Partial<ClinicalFindings>;
  triggerMiniTest: MiniTestType | null;
  readyForDiagnosis: boolean;
}

export interface PrescriptionItem {
  name: string;
  category: string;
  dosage: string;
  timing: string;
  duration: string;
  doctorNote: string;
}

export interface CognitiveProfile {
  shortTermMemory: number;
  focusAndAttention: number;
  sleepRecovery: number;
  stressResilience: number;
}

export interface DiagnosisResult {
  prescriptionCode: string;
  issuedDate: string;
  diagnosisTitle: string;
  clinicalClassification: string;
  severityLevel: 'خفيف ومطمئن' | 'متوسط ويحتاج متابعة' | 'يستدعي فحص طبي مباشر';
  doctorSummary: string;
  cognitiveProfile: CognitiveProfile;
  prescriptions: PrescriptionItem[];
  recommendedLabs: string[];
  lifestyleTips: string[];
  followUpJoke: string;
  medicalDisclaimer: string;
}
