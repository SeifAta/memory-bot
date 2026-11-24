import React, { useEffect, useRef, useState } from 'react';
import { FileCheck2, Send, Sparkles, X } from 'lucide-react';
import type {
  ChatMessage,
  ClinicalFindings,
  DoctorMood,
  HistoryTopic,
  MiniTestResult,
  MiniTestType,
  PatientProfile,
} from '../types/clinic';
import { MemoryMiniTests } from './MemoryMiniTests';
import { PatientChartSidebar } from './PatientChartSidebar';

interface ConsultationRoomProps {
  profile: PatientProfile;
  messages: ChatMessage[];
  findings: ClinicalFindings;
  currentTopic: HistoryTopic;
  progressPercent: number;
  completedTests: MiniTestResult[];
  activeInlineTest: MiniTestType | null;
  readyForDiagnosis: boolean;
  isDoctorThinking: boolean;
  isDiagnosing: boolean;
  errorMessage: string | null;
  onSendMessage: (text: string) => void;
  onCompleteInlineTest: (result: MiniTestResult) => void;
  onDismissInlineTest: () => void;
  onTriggerTestManually: (type: MiniTestType) => void;
  onRequestDiagnosis: () => void;
}

const TOPICS_LIST: Array<{ id: HistoryTopic; label: string }> = [
  { id: 'chief_complaint', label: '١. الشكوى' },
  { id: 'onset_duration', label: '٢. البداية' },
  { id: 'lifestyle_sleep', label: '٣. النوم والضغط' },
  { id: 'medical_history', label: '٤. التاريخ الطبي' },
  { id: 'memory_check', label: '٥. الاختبار' },
  { id: 'ready_for_diagnosis', label: '٦. التشخيص' },
];

const MOOD_LABELS: Record<DoctorMood, string> = {
  welcoming: 'مبتسم وبيرحّب بيك',
  curious: 'مركز وبيسمع باهتمام',
  amused: 'بيضحك على الموقف',
  focused: 'بيدون في الملف الطبي',
  reassuring: 'بيطمنك وبيهدّي بالك',
};

export const ConsultationRoom: React.FC<ConsultationRoomProps> = ({
  profile,
  messages,
  findings,
  currentTopic,
  progressPercent,
  completedTests,
  activeInlineTest,
  readyForDiagnosis,
  isDoctorThinking,
  isDiagnosing,
  errorMessage,
  onSendMessage,
  onCompleteInlineTest,
  onDismissInlineTest,
  onTriggerTestManually,
  onRequestDiagnosis,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [avatarFailed, setAvatarFailed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const patientTurnsCount = messages.filter((m) => m.role === 'patient').length;
  const lastDoctorMsg = [...messages].reverse().find((m) => m.role === 'doctor');
  const currentMood: DoctorMood = lastDoctorMsg?.mood || 'welcoming';
  const quickReplies = lastDoctorMsg?.quickReplies || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, isDoctorThinking, activeInlineTest]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isDoctorThinking || isDiagnosing) return;
    setInputValue('');
    onSendMessage(trimmed);
  };

  const canDiagnoseEarly = patientTurnsCount >= 3;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
          {/* Doctor Header & 6-Step Progress */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
                  {!avatarFailed ? (
                    <img
                      src="/src/assets/images/dr_khalil_portrait_1795546523890.jpg"
                      alt="د. خليل فاكر"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarFailed(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-800 font-bold text-sm">
                      د.خ
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-base sm:text-lg font-bold text-slate-900">
                      د. خليل فاكر
                    </h1>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-xs font-medium text-teal-800">
                      {isDoctorThinking ? 'بيفكر وبيكتب في النوتة...' : MOOD_LABELS[currentMood]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    جلسة أخذ التاريخ المرضي لضعف الذاكرة
                  </p>
                </div>
              </div>

              {(readyForDiagnosis || canDiagnoseEarly) && (
                <button
                  type="button"
                  onClick={onRequestDiagnosis}
                  disabled={isDiagnosing || isDoctorThinking}
                  className={`min-h-[40px] px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    readyForDiagnosis
                      ? 'bg-teal-700 hover:bg-teal-800 text-white'
                      : 'bg-white hover:bg-teal-50 text-teal-800 border border-teal-300'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4 shrink-0" />
                  <span>
                    {isDiagnosing
                      ? 'د. خليل بيكتب الروشتة...'
                      : readyForDiagnosis
                        ? 'اعرض التشخيص والروشتة'
                        : 'اكتفيت، شخّصني دلوقتي'}
                  </span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {TOPICS_LIST.map((topic) => {
                const isActive = topic.id === currentTopic;
                return (
                  <div
                    key={topic.id}
                    className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap shrink-0 transition-colors ${
                      isActive
                        ? 'bg-teal-700 text-white font-semibold'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {topic.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conversation Stream */}
          <div className="p-4 sm:p-6 space-y-5 min-h-[380px] max-h-[540px] overflow-y-auto bg-[#F8FAFC]/60">
            {messages.map((msg) => {
              if (msg.role === 'system_test' && msg.testSummary) {
                return (
                  <div
                    key={msg.id}
                    className="mx-auto max-w-md p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1"
                  >
                    <div className="text-xs font-bold text-emerald-900">
                      نتيجة {msg.testSummary.title}:{' '}
                      <span className="font-mono tabular-nums">
                        {msg.testSummary.score} / {msg.testSummary.maxScore}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800">{msg.testSummary.comment}</p>
                  </div>
                );
              }

              const isDoctor = msg.role === 'doctor';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isDoctor ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-2 mb-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {isDoctor ? 'د. خليل فاكر' : profile.name}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{msg.timestamp}</span>
                  </div>
                  <div
                    className={`max-w-[88%] sm:max-w-[80%] px-4 py-3 rounded-2xl text-sm sm:text-[15px] leading-relaxed ${
                      isDoctor
                        ? 'bg-white border border-slate-200 text-slate-900 rounded-tr-sm'
                        : 'bg-teal-700 text-white rounded-tl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}

            {isDoctorThinking && (
              <div className="flex flex-col items-start">
                <div className="text-xs font-semibold text-slate-500 mb-1">د. خليل فاكر</div>
                <div className="px-4 py-3 rounded-2xl rounded-tr-sm bg-white border border-slate-200 text-sm text-slate-500">
                  ثانية واحدة بشرب بُق شاي بالنعناع وبكتب في الملف...
                </div>
              </div>
            )}

            {activeInlineTest && (
              <div className="bg-white border border-teal-300 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-800">
                    <Sparkles className="w-4 h-4" />
                    <span>اختبار سريع طلبه د. خليل دلوقتي</span>
                  </div>
                  <button
                    type="button"
                    onClick={onDismissInlineTest}
                    className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>تخطي مؤقتاً</span>
                  </button>
                </div>
                <MemoryMiniTests
                  inlineMode
                  initialActiveTest={activeInlineTest}
                  completedTests={completedTests}
                  onCompleteTest={onCompleteInlineTest}
                />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div
              role="alert"
              className="mx-4 mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800"
            >
              {errorMessage}
            </div>
          )}

          {/* Quick Replies + Free Text Input */}
          <div className="p-4 sm:p-5 border-t border-slate-200 bg-white space-y-3">
            {!isDoctorThinking && !isDiagnosing && quickReplies.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    اختار رد سريع أو اكتب إجابتك بنفسك:
                  </span>
                  {completedTests.length < 2 && !activeInlineTest && (
                    <button
                      type="button"
                      onClick={() =>
                        onTriggerTestManually(
                          completedTests.some((t) => t.testType === 'word_recall')
                            ? 'sequence_match'
                            : 'word_recall'
                        )
                      }
                      className="text-xs font-semibold text-teal-800 hover:underline cursor-pointer"
                    >
                      اعمل اختبار ذاكرة سريع دلوقتي
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((reply) => (
                    <button
                      key={reply}
                      type="button"
                      onClick={() => onSendMessage(reply)}
                      className="min-h-[38px] px-3 py-1.5 text-xs sm:text-sm font-medium text-slate-800 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-lg transition-colors text-right cursor-pointer"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-center gap-2.5">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isDoctorThinking || isDiagnosing}
                placeholder="احكي لدكتور خليل اللي بيحصل معاك بالظبط..."
                className="flex-1 min-h-[44px] px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isDoctorThinking || isDiagnosing}
                aria-label="إرسال الرد للدكتور"
                className="min-h-[44px] px-4 py-2 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span className="hidden sm:inline">ابعت</span>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-4 lg:sticky lg:top-22">
          <PatientChartSidebar
            profile={profile}
            findings={findings}
            completedTests={completedTests}
            progressPercent={progressPercent}
          />
        </div>
      </div>
    </div>
  );
};
