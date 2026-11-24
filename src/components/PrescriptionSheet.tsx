import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  FlaskConical,
  Lightbulb,
  Printer,
  RotateCcw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import type { CognitiveProfile, DiagnosisResult, PatientProfile } from '../types/clinic';

interface PrescriptionSheetProps {
  profile: PatientProfile;
  diagnosis: DiagnosisResult;
  onStartNewCheckup: () => void;
}

const SEVERITY_STYLES: Record<
  DiagnosisResult['severityLevel'],
  { bg: string; border: string; text: string; label: string }
> = {
  'خفيف ومطمئن': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    label: 'حالة مطمئنة وخفيفة',
  },
  'متوسط ويحتاج متابعة': {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    label: 'متوسط ويستاهل متابعة',
  },
  'يستدعي فحص طبي مباشر': {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-900',
    label: 'مهم نزور دكتور في العيادة',
  },
};

const CognitiveRadarChart: React.FC<{ profile: CognitiveProfile }> = ({ profile }) => {
  const axes = [
    { key: 'shortTermMemory', label: 'الذاكرة القصيرة', value: profile.shortTermMemory },
    { key: 'focusAndAttention', label: 'التركيز والانتباه', value: profile.focusAndAttention },
    { key: 'sleepRecovery', label: 'جودة النوم', value: profile.sleepRecovery },
    { key: 'stressResilience', label: 'التحمل الذهني', value: profile.stressResilience },
  ];

  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = 82;

  const getPoint = (index: number, val: number) => {
    const angle = (Math.PI * 2 * index) / axes.length - Math.PI / 2;
    const r = (Math.max(10, Math.min(100, val)) / 100) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const polygonPoints = axes
    .map((a, i) => {
      const p = getPoint(i, a.value);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0"
        aria-label="خريطة مؤشرات الذاكرة والتركيز"
      >
        {[25, 50, 75, 100].map((ring) => {
          const ringPts = axes
            .map((_, i) => {
              const p = getPoint(i, ring);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={ring}
              points={ringPts}
              fill="none"
              stroke="#E2E8F0"
              strokeWidth={1}
            />
          );
        })}

        {axes.map((_, i) => {
          const end = getPoint(i, 100);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="#CBD5E1"
              strokeWidth={1}
            />
          );
        })}

        <polygon
          points={polygonPoints}
          fill="rgba(15, 118, 110, 0.18)"
          stroke="#0F766E"
          strokeWidth={2}
        />

        {axes.map((a, i) => {
          const p = getPoint(i, a.value);
          return <circle key={a.key} cx={p.x} cy={p.y} r={4} fill="#0F766E" />;
        })}
      </svg>

      <div className="flex-1 w-full space-y-3">
        {axes.map((axis) => (
          <div key={axis.key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">{axis.label}</span>
              <span className="font-mono font-bold text-teal-800 tabular-nums">
                {axis.value}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-700 rounded-full"
                style={{ width: `${Math.max(5, Math.min(100, axis.value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PrescriptionSheet: React.FC<PrescriptionSheetProps> = ({
  profile,
  diagnosis,
  onStartNewCheckup,
}) => {
  const [emblemFailed, setEmblemFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpHistory, setFollowUpHistory] = useState<
    Array<{ q: string; a: string }>
  >([]);
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  const severityMeta =
    SEVERITY_STYLES[diagnosis.severityLevel] || SEVERITY_STYLES['خفيف ومطمئن'];

  const handleCopyPrescription = async () => {
    const text = [
      `روشتة عيادة د. فاكر للمخ والأعصاب`,
      `رقم الروشتة: ${diagnosis.prescriptionCode} | التاريخ: ${diagnosis.issuedDate}`,
      `المريض: ${profile.name} (${profile.age} سنة)`,
      `التشخيص: ${diagnosis.diagnosisTitle} (${diagnosis.clinicalClassification})`,
      ``,
      `الأدوية والمكملات الموصوفة:`,
      ...diagnosis.prescriptions.map(
        (rx, i) =>
          `${i + 1}. ${rx.name} - ${rx.dosage} (${rx.timing}) لمدة ${rx.duration}\n   ملحوظة: ${rx.doctorNote}`
      ),
      ``,
      `التحاليل المقترحة: ${diagnosis.recommendedLabs.join('، ')}`,
      ``,
      `نصايح د. خليل: ${diagnosis.lifestyleTips.join(' | ')}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleAskFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = followUpQuestion.trim();
    if (!q || isAskingFollowUp) return;

    setIsAskingFollowUp(true);
    setFollowUpError(null);
    try {
      const res = await fetch('/api/consult/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientProfile: profile,
          diagnosis,
          question: q,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'حصل خطأ في الرد على سؤالك.');
      }
      setFollowUpHistory((prev) => [...prev, { q, a: data.answer }]);
      setFollowUpQuestion('');
    } catch (err: unknown) {
      setFollowUpError(
        err instanceof Error ? err.message : 'مقدرناش نوصل للدكتور دلوقتي، جرب تاني.'
      );
    } finally {
      setIsAskingFollowUp(false);
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Action Toolbar */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">
            التشخيص النهائي والروشتة الطبية
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            صدرت بتاريخ {diagnosis.issuedDate} · كود الكشف{' '}
            <span className="font-mono tabular-nums">{diagnosis.prescriptionCode}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPrescription}
            className="min-h-[40px] px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم نسخ الروشتة' : 'نسخ الروشتة'}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[40px] px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة</span>
          </button>
          <button
            type="button"
            onClick={onStartNewCheckup}
            className="min-h-[40px] px-4 py-2 text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white rounded-lg flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>كشف جديد</span>
          </button>
        </div>
      </div>

      {/* Main Roshetta Sheet */}
      <article className="print-sheet bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {/* Roshetta Header */}
        <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50/60 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
              {!emblemFailed ? (
                <img
                  src="/src/assets/images/roshetta_emblem_1795546113869.jpg"
                  alt="ختم عيادة د. فاكر للمخ والأعصاب"
                  referrerPolicy="no-referrer"
                  onError={() => setEmblemFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-800 font-bold text-lg">
                  ℞
                </div>
              )}
            </div>
            <div>
              <h2 className="font-display text-xl font-extrabold text-slate-900">
                عيادة د. خليل فاكر
              </h2>
              <p className="text-xs font-medium text-teal-800 mt-0.5">
                استشاري المخ والأعصاب وتقوية الذاكرة · المهندسين، القاهرة
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1.5">
                <span>المريض: {profile.name}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{profile.age} سنة</span>
                <span aria-hidden="true">·</span>
                <span>{profile.occupation}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-left space-y-1">
            <div className="font-mono text-xs font-bold text-slate-700 tabular-nums">
              {diagnosis.prescriptionCode}
            </div>
            <div className="text-xs text-slate-500">{diagnosis.issuedDate}</div>
          </div>
        </div>

        {/* Diagnosis Section */}
        <div className="p-6 sm:p-8 border-b border-slate-200 space-y-4">
          <div
            className={`p-4 rounded-xl border ${severityMeta.bg} ${severityMeta.border} flex flex-wrap items-center justify-between gap-3`}
          >
            <div className="flex items-center gap-2.5">
              {diagnosis.severityLevel === 'يستدعي فحص طبي مباشر' ? (
                <AlertCircle className={`w-5 h-5 shrink-0 ${severityMeta.text}`} />
              ) : (
                <ShieldCheck className={`w-5 h-5 shrink-0 ${severityMeta.text}`} />
              )}
              <div>
                <div className={`text-xs font-bold ${severityMeta.text}`}>
                  {severityMeta.label} · {diagnosis.clinicalClassification}
                </div>
                <h3 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                  {diagnosis.diagnosisTitle}
                </h3>
              </div>
            </div>
          </div>

          <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed">
            {diagnosis.doctorSummary}
          </p>
        </div>

        {/* Cognitive Profile Chart */}
        <div className="p-6 sm:p-8 border-b border-slate-200 space-y-4">
          <h3 className="font-display text-base font-bold text-slate-900">
            مؤشرات الكفاءة الذهنية من الكشف
          </h3>
          <CognitiveRadarChart profile={diagnosis.cognitiveProfile} />
        </div>

        {/* Rx Medications */}
        <div className="p-6 sm:p-8 border-b border-slate-200 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span className="font-serif text-2xl text-teal-800" aria-hidden="true">
                ℞
              </span>
              <span>الروشتة المقترحة</span>
            </h3>
            <span className="text-xs text-slate-500">
              {diagnosis.prescriptions.length} بنود علاجية وسلوكية
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {diagnosis.prescriptions.map((rx, idx) => (
              <div key={`${rx.name}-${idx}`} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs font-bold text-teal-800 tabular-nums">
                      0{idx + 1}.
                    </span>
                    <span className="font-display text-base font-bold text-slate-900">
                      {rx.name}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{rx.category}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-700">
                  <span className="font-semibold text-teal-800">{rx.dosage}</span>
                  <span aria-hidden="true">·</span>
                  <span>{rx.timing}</span>
                  <span aria-hidden="true">·</span>
                  <span>المدة: {rx.duration}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  ملحوظة د. خليل: {rx.doctorNote}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Labs & Lifestyle Tips Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-200 border-b border-slate-200">
          <div className="p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <FlaskConical className="w-4 h-4 text-teal-700" />
              <h3 className="font-display text-base font-bold">التحاليل المطلوبة للاطمئنان</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {diagnosis.recommendedLabs.map((lab) => (
                <li key={lab} className="flex items-start gap-2">
                  <span className="font-mono text-teal-700 mt-0.5">—</span>
                  <span>{lab}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-6 sm:p-8 space-y-3">
            <div className="flex items-center gap-2 text-slate-900">
              <Lightbulb className="w-4 h-4 text-teal-700" />
              <h3 className="font-display text-base font-bold">نصايح د. فاكر اليومية</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-700">
              {diagnosis.lifestyleTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-mono text-xs font-bold text-teal-700 mt-1 tabular-nums">
                    0{i + 1}
                  </span>
                  <span className="leading-relaxed">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Closing Joke & Disclaimer */}
        <div className="p-6 sm:p-8 bg-slate-50/70 space-y-3">
          <p className="text-sm font-bold text-teal-900">
            &ldquo;{diagnosis.followUpJoke}&rdquo;
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            {diagnosis.medicalDisclaimer}
          </p>
        </div>
      </article>

      {/* Post-Roshetta Follow-Up Q&A */}
      <section className="no-print bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="font-display text-base font-bold text-slate-900">
            عندك سؤال لدكتور خليل عن الروشتة أو الأدوية؟
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            اسأله قبل ما تمشي من العيادة (أو قبل ما تنسى السؤال!).
          </p>
        </div>

        {followUpHistory.length > 0 && (
          <div className="space-y-3 pt-2">
            {followUpHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
              >
                <div className="text-xs font-bold text-slate-700">سؤالك: {item.q}</div>
                <div className="text-sm text-slate-900 leading-relaxed">
                  رد د. خليل: {item.a}
                </div>
              </div>
            ))}
          </div>
        )}

        {followUpError && (
          <div role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
            {followUpError}
          </div>
        )}

        <form onSubmit={handleAskFollowUp} className="flex items-center gap-2.5">
          <input
            type="text"
            value={followUpQuestion}
            onChange={(e) => setFollowUpQuestion(e.target.value)}
            disabled={isAskingFollowUp}
            placeholder="مثلاً: ينفع آخد الفيتامين بعد القهوة ولا لأ؟"
            className="flex-1 min-h-[44px] px-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
          />
          <button
            type="submit"
            disabled={!followUpQuestion.trim() || isAskingFollowUp}
            className="min-h-[44px] px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span>{isAskingFollowUp ? 'بيجاوب...' : 'اسأل'}</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>
    </div>
  );
};
