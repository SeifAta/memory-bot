import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { WelcomeReception } from './components/WelcomeReception';
import { ConsultationRoom } from './components/ConsultationRoom';
import { MemoryMiniTests } from './components/MemoryMiniTests';
import { PrescriptionSheet } from './components/PrescriptionSheet';
import type {
  ActiveTab,
  ChatMessage,
  ClinicalFindings,
  ConsultationStage,
  ConsultStepResponse,
  DiagnosisResult,
  HistoryTopic,
  MiniTestResult,
  MiniTestType,
  PatientProfile,
} from './types/clinic';

const INITIAL_FINDINGS: ClinicalFindings = {
  chiefComplaint: '',
  duration: '',
  forgetfulnessTriggers: [],
  sleepPattern: '',
  stressAndMood: '',
  caffeineAndHabits: '',
  medicalAndMeds: '',
  redFlagsCheck: '',
  doctorWittyNote: '',
};

const DEFAULT_PROFILE: PatientProfile = {
  name: 'يا بطل',
  age: 30,
  occupation: 'مواطن مصري مكافح',
  selfRatedForgetfulness: 5,
};

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mergeFindings(
  prev: ClinicalFindings,
  incoming?: Partial<ClinicalFindings>
): ClinicalFindings {
  if (!incoming) return prev;
  const mergedTriggers = Array.from(
    new Set([
      ...prev.forgetfulnessTriggers,
      ...(Array.isArray(incoming.forgetfulnessTriggers)
        ? incoming.forgetfulnessTriggers.filter(Boolean)
        : []),
    ])
  );
  return {
    chiefComplaint: incoming.chiefComplaint || prev.chiefComplaint,
    duration: incoming.duration || prev.duration,
    forgetfulnessTriggers: mergedTriggers,
    sleepPattern: incoming.sleepPattern || prev.sleepPattern,
    stressAndMood: incoming.stressAndMood || prev.stressAndMood,
    caffeineAndHabits: incoming.caffeineAndHabits || prev.caffeineAndHabits,
    medicalAndMeds: incoming.medicalAndMeds || prev.medicalAndMeds,
    redFlagsCheck: incoming.redFlagsCheck || prev.redFlagsCheck,
    doctorWittyNote: incoming.doctorWittyNote || prev.doctorWittyNote,
  };
}

export default function App() {
  const [stage, setStage] = useState<ConsultationStage>('reception');
  const [activeTab, setActiveTab] = useState<ActiveTab>('clinic');

  const [profile, setProfile] = useState<PatientProfile>(DEFAULT_PROFILE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [findings, setFindings] = useState<ClinicalFindings>(INITIAL_FINDINGS);
  const [currentTopic, setCurrentTopic] = useState<HistoryTopic>('chief_complaint');
  const [progressPercent, setProgressPercent] = useState(12);
  const [completedTests, setCompletedTests] = useState<MiniTestResult[]>([]);
  const [activeInlineTest, setActiveInlineTest] = useState<MiniTestType | null>(null);
  const [readyForDiagnosis, setReadyForDiagnosis] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);

  const [isDoctorThinking, setIsDoctorThinking] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const callConsultStep = async (
    nextProfile: PatientProfile,
    nextMessages: ChatMessage[],
    nextFindings: ClinicalFindings,
    nextTests: MiniTestResult[],
    isInitial: boolean
  ): Promise<ConsultStepResponse> => {
    const res = await fetch('/api/consult/step', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientProfile: nextProfile,
        messages: nextMessages,
        findings: nextFindings,
        completedTests: nextTests,
        isInitial,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'حصل مشكلة في التواصل مع د. خليل.');
    }
    return data as ConsultStepResponse;
  };

  const handleStartConsultation = async (newProfile: PatientProfile) => {
    setErrorMessage(null);
    setIsDoctorThinking(true);
    setProfile(newProfile);

    try {
      const step = await callConsultStep(
        newProfile,
        [],
        INITIAL_FINDINGS,
        [],
        true
      );

      const firstMsg: ChatMessage = {
        id: `doc-${Date.now()}`,
        role: 'doctor',
        text: step.doctorReply,
        timestamp: nowTimeLabel(),
        mood: step.doctorMood,
        quickReplies: step.quickReplies,
      };

      setMessages([firstMsg]);
      setFindings(mergeFindings(INITIAL_FINDINGS, step.extractedFindings));
      setCurrentTopic(step.currentTopic || 'chief_complaint');
      setProgressPercent(step.progressPercent || 18);
      setReadyForDiagnosis(Boolean(step.readyForDiagnosis));
      setActiveInlineTest(step.triggerMiniTest || null);
      setStage('consultation');
      setActiveTab('clinic');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'مقدرناش نبدأ الجلسة دلوقتي، جرب تاني.'
      );
    } finally {
      setIsDoctorThinking(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    setErrorMessage(null);
    const patientMsg: ChatMessage = {
      id: `pat-${Date.now()}`,
      role: 'patient',
      text,
      timestamp: nowTimeLabel(),
    };
    const updatedMessages = [...messages, patientMsg];
    setMessages(updatedMessages);
    setIsDoctorThinking(true);

    try {
      const step = await callConsultStep(
        profile,
        updatedMessages,
        findings,
        completedTests,
        false
      );

      const merged = mergeFindings(findings, step.extractedFindings);
      setFindings(merged);
      setCurrentTopic(step.currentTopic);
      setProgressPercent(step.progressPercent);
      setReadyForDiagnosis(Boolean(step.readyForDiagnosis));

      const docMsg: ChatMessage = {
        id: `doc-${Date.now()}`,
        role: 'doctor',
        text: step.doctorReply,
        timestamp: nowTimeLabel(),
        mood: step.doctorMood,
        quickReplies: step.quickReplies,
      };
      setMessages((prev) => [...prev, docMsg]);

      if (
        step.triggerMiniTest &&
        !completedTests.some((t) => t.testType === step.triggerMiniTest)
      ) {
        setActiveInlineTest(step.triggerMiniTest);
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'د. خليل وقع منه القلم، جرب تبعت تاني.'
      );
    } finally {
      setIsDoctorThinking(false);
    }
  };

  const handleCompleteTest = async (result: MiniTestResult) => {
    const updatedTests = [
      ...completedTests.filter((t) => t.testType !== result.testType),
      result,
    ];
    setCompletedTests(updatedTests);
    setActiveInlineTest(null);

    if (stage === 'consultation') {
      const testMsg: ChatMessage = {
        id: `test-${Date.now()}`,
        role: 'system_test',
        text: `أتم المريض ${result.title} بنتيجة ${result.score} من ${result.maxScore}: ${result.details}`,
        timestamp: nowTimeLabel(),
        testSummary: {
          testType: result.testType,
          title: result.title,
          score: result.score,
          maxScore: result.maxScore,
          comment: result.details,
        },
      };

      const updatedMessages = [...messages, testMsg];
      setMessages(updatedMessages);
      setIsDoctorThinking(true);

      try {
        const step = await callConsultStep(
          profile,
          updatedMessages,
          findings,
          updatedTests,
          false
        );
        setFindings((prev) => mergeFindings(prev, step.extractedFindings));
        setCurrentTopic(step.currentTopic);
        setProgressPercent(step.progressPercent);
        setReadyForDiagnosis(Boolean(step.readyForDiagnosis));

        setMessages((prev) => [
          ...prev,
          {
            id: `doc-${Date.now()}`,
            role: 'doctor',
            text: step.doctorReply,
            timestamp: nowTimeLabel(),
            mood: step.doctorMood,
            quickReplies: step.quickReplies,
          },
        ]);
      } catch (err: unknown) {
        setErrorMessage(
          err instanceof Error ? err.message : 'حصل خطأ بعد حفظ نتيجة الاختبار.'
        );
      } finally {
        setIsDoctorThinking(false);
      }
    }
  };

  const handleRequestDiagnosis = async () => {
    setErrorMessage(null);
    setIsDiagnosing(true);

    try {
      const res = await fetch('/api/consult/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientProfile: profile,
          messages,
          findings,
          completedTests,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'مقدرناش نطلع التشخيص دلوقتي.');
      }
      setDiagnosis(data as DiagnosisResult);
      setStage('diagnosis');
      setActiveTab('prescription');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : 'حصل خطأ أثناء كتابة الروشتة.'
      );
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleResetClinic = () => {
    setStage('reception');
    setActiveTab('clinic');
    setProfile(DEFAULT_PROFILE);
    setMessages([]);
    setFindings(INITIAL_FINDINGS);
    setCurrentTopic('chief_complaint');
    setProgressPercent(12);
    setCompletedTests([]);
    setActiveInlineTest(null);
    setReadyForDiagnosis(false);
    setDiagnosis(null);
    setErrorMessage(null);
  };

  const handleSelectTab = (tab: ActiveTab) => {
    if (tab === 'prescription' && !diagnosis) return;
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <TopBar
        stage={stage}
        activeTab={activeTab}
        hasDiagnosis={Boolean(diagnosis)}
        onSelectTab={handleSelectTab}
        onResetClinic={handleResetClinic}
      />

      <main className="flex-1">
        {activeTab === 'tests' && (
          <MemoryMiniTests
            completedTests={completedTests}
            onCompleteTest={handleCompleteTest}
          />
        )}

        {activeTab === 'prescription' && diagnosis && (
          <PrescriptionSheet
            profile={profile}
            diagnosis={diagnosis}
            onStartNewCheckup={handleResetClinic}
          />
        )}

        {activeTab === 'clinic' && stage === 'reception' && (
          <WelcomeReception
            onStartConsultation={handleStartConsultation}
            isLoading={isDoctorThinking}
            errorMessage={errorMessage}
          />
        )}

        {activeTab === 'clinic' && stage === 'consultation' && (
          <ConsultationRoom
            profile={profile}
            messages={messages}
            findings={findings}
            currentTopic={currentTopic}
            progressPercent={progressPercent}
            completedTests={completedTests}
            activeInlineTest={activeInlineTest}
            readyForDiagnosis={readyForDiagnosis}
            isDoctorThinking={isDoctorThinking}
            isDiagnosing={isDiagnosing}
            errorMessage={errorMessage}
            onSendMessage={handleSendMessage}
            onCompleteInlineTest={handleCompleteTest}
            onDismissInlineTest={() => setActiveInlineTest(null)}
            onTriggerTestManually={(type) => setActiveInlineTest(type)}
            onRequestDiagnosis={handleRequestDiagnosis}
          />
        )}

        {activeTab === 'clinic' && stage === 'diagnosis' && diagnosis && (
          <PrescriptionSheet
            profile={profile}
            diagnosis={diagnosis}
            onStartNewCheckup={handleResetClinic}
          />
        )}
      </main>

      <footer className="no-print border-t border-slate-200 bg-white mt-12">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <span>عيادة د. فاكر للمخ والأعصاب والذاكرة</span>
          <span>أداة تفاعلية مرحة للتوعية وتنظيم التاريخ المرضي — لا تغني عن الكشف الطبي المباشر</span>
        </div>
      </footer>
    </div>
  );
}
