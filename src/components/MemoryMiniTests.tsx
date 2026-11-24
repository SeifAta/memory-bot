import React, { useEffect, useState } from 'react';
import { CheckCircle2, Clock, RotateCcw, Sparkles } from 'lucide-react';
import type { MiniTestResult, MiniTestType } from '../types/clinic';

interface MemoryMiniTestsProps {
  initialActiveTest?: MiniTestType | null;
  completedTests: MiniTestResult[];
  onCompleteTest: (result: MiniTestResult) => void;
  inlineMode?: boolean;
}

const WORD_SET_POOL = [
  'مفتاح العربية',
  'كيس بسبوسة',
  'فاتورة الكهرباء',
  'نضارة الشمس',
  'شاحن الموبايل',
  'تذكرة المترو',
  'علبة النعناع',
  'كراسة المحاضرات',
];

const TARGET_WORDS = ['مفتاح العربية', 'كيس بسبوسة', 'فاتورة الكهرباء'];

const ERRANDS_ORDER = [
  { id: 'market', label: 'السوبر ماركت (لبن وجبنة)' },
  { id: 'pharmacy', label: 'الصيدلية (فيتامين ب١٢)' },
  { id: 'ironing', label: 'المكوجي (القميص الكحلي)' },
  { id: 'home', label: 'الرجوع للبيت قبل الماتش' },
];

const DAILY_SCENARIOS = [
  {
    q: 'فتحت باب التلاجة ووقفت تبص جواها 20 ثانية ومش فاكر كنت عايز إيه.. بتعمل إيه؟',
    options: [
      { text: 'بشرب بُق مية ساقعة وأقفلها كأني كنت جاي أشرب وخلاص', points: 2 },
      { text: 'برجع خطوتين للأوضة اللي كنت فيها عشان أفتكر الخيط من أوله', points: 3 },
      { text: 'بنادي على أي حد في البيت أسأله أنا كنت جاي أعمل إيه', points: 1 },
    ],
  },
  {
    q: 'حد جديد اتعرف عليك في الشغل وقالك اسمه، بعدها بـ 10 ثواني حصل إيه؟',
    options: [
      { text: 'نسيت اسمه تماماً وبناديله بـ "يا باشا" أو "يا فندم"', points: 1 },
      { text: 'بركز أكرر اسمه في دماغي أو أقوله "تشرفنا يا أستاذ فلان"', points: 3 },
      { text: 'بفتكر شكل وشه بس اسمه بيطير في الهوا', points: 2 },
    ],
  },
  {
    q: 'وأنت خارج من البيت الصبح، كم مرة بترجع تتأكد إنك قفلت البوتاجاز أو خدت المفتاح؟',
    options: [
      { text: 'نادراً، ببقى عامل مكان ثابت للمفاتيح جنب الباب', points: 3 },
      { text: 'مرتين تلاتة أسبوعياً لما بكون مستعجل ومشتت', points: 2 },
      { text: 'كل يوم تقريباً ولازم أصور البوتاجاز بالموبايل كمان!', points: 1 },
    ],
  },
];

export const MemoryMiniTests: React.FC<MemoryMiniTestsProps> = ({
  initialActiveTest,
  completedTests,
  onCompleteTest,
  inlineMode = false,
}) => {
  const [selectedTest, setSelectedTest] = useState<MiniTestType>(
    initialActiveTest || 'word_recall'
  );

  // Test 1: Word Recall state
  const [wordPhase, setWordPhase] = useState<'memorize' | 'distract' | 'recall' | 'done'>(
    'memorize'
  );
  const [countdown, setCountdown] = useState(6);
  const [distractAnswer, setDistractAnswer] = useState('');
  const [selectedWords, setSelectedWords] = useState<string[]>([]);

  // Test 2: Sequence Match state
  const [seqPhase, setSeqPhase] = useState<'memorize' | 'arrange' | 'done'>('memorize');
  const [seqCountdown, setSeqCountdown] = useState(6);
  const [shuffledErrands, setShuffledErrands] = useState(() =>
    [...ERRANDS_ORDER].sort(() => Math.random() - 0.5)
  );
  const [pickedOrder, setPickedOrder] = useState<string[]>([]);

  // Test 3: Daily Scenario state
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [scenarioPoints, setScenarioPoints] = useState(0);
  const [scenarioDone, setScenarioDone] = useState(false);

  useEffect(() => {
    if (initialActiveTest) {
      setSelectedTest(initialActiveTest);
    }
  }, [initialActiveTest]);

  // Timer for Word Recall memorize phase
  useEffect(() => {
    if (selectedTest !== 'word_recall' || wordPhase !== 'memorize') return;
    if (countdown <= 0) {
      setWordPhase('distract');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [selectedTest, wordPhase, countdown]);

  // Timer for Sequence Match memorize phase
  useEffect(() => {
    if (selectedTest !== 'sequence_match' || seqPhase !== 'memorize') return;
    if (seqCountdown <= 0) {
      setShuffledErrands([...ERRANDS_ORDER].sort(() => Math.random() - 0.5));
      setSeqPhase('arrange');
      return;
    }
    const timer = setTimeout(() => setSeqCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [selectedTest, seqPhase, seqCountdown]);

  const getCompleted = (type: MiniTestType) =>
    completedTests.find((t) => t.testType === type);

  const toggleWord = (word: string) => {
    if (selectedWords.includes(word)) {
      setSelectedWords((prev) => prev.filter((w) => w !== word));
    } else if (selectedWords.length < 3) {
      setSelectedWords((prev) => [...prev, word]);
    }
  };

  const finishWordRecall = () => {
    const score = selectedWords.filter((w) => TARGET_WORDS.includes(w)).length;
    setWordPhase('done');
    onCompleteTest({
      testType: 'word_recall',
      title: 'اختبار التلات حاجات',
      score,
      maxScore: 3,
      details:
        score === 3
          ? 'افتكر التلات حاجات صح بالظبط (بما فيهم كيس البسبوسة)!'
          : `افتكر ${score} من أصل 3 حاجات بعد سؤال التشتيت.`,
      completedAt: new Date().toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
  };

  const resetWordRecall = () => {
    setWordPhase('memorize');
    setCountdown(6);
    setDistractAnswer('');
    setSelectedWords([]);
  };

  const handlePickErrand = (id: string) => {
    if (pickedOrder.includes(id)) return;
    const next = [...pickedOrder, id];
    setPickedOrder(next);

    if (next.length === ERRANDS_ORDER.length) {
      let score = 0;
      next.forEach((pickedId, idx) => {
        if (ERRANDS_ORDER[idx].id === pickedId) score++;
      });
      setSeqPhase('done');
      onCompleteTest({
        testType: 'sequence_match',
        title: 'اختبار ترتيب المشاوير',
        score,
        maxScore: 4,
        details:
          score === 4
            ? 'رتب المشاوير الأربعة صح 100% من غير ما ينسى المكوجي!'
            : `رتب ${score} من 4 مشاوير في مكانهم الصحيح.`,
        completedAt: new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }
  };

  const resetSequenceMatch = () => {
    setSeqPhase('memorize');
    setSeqCountdown(6);
    setPickedOrder([]);
  };

  const handleAnswerScenario = (points: number) => {
    const updated = scenarioPoints + points;
    if (scenarioIdx + 1 < DAILY_SCENARIOS.length) {
      setScenarioPoints(updated);
      setScenarioIdx((i) => i + 1);
    } else {
      setScenarioPoints(updated);
      setScenarioDone(true);
      onCompleteTest({
        testType: 'daily_scenario',
        title: 'اختبار مواقف النسيان اليومية',
        score: updated,
        maxScore: 9,
        details:
          updated >= 7
            ? 'استراتيجيات تعامل ذكية مع السرحان اليومي.'
            : 'تشتت متكرر في المواقف اليومية بيحتاج تنظيم وتثبيت روتين.',
        completedAt: new Date().toLocaleTimeString('ar-EG', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    }
  };

  const resetScenarios = () => {
    setScenarioIdx(0);
    setScenarioPoints(0);
    setScenarioDone(false);
  };

  return (
    <div className={inlineMode ? 'space-y-4' : 'max-w-[1000px] mx-auto px-4 sm:px-6 py-8 space-y-6'}>
      {!inlineMode && (
        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-900">
            معمل تحديات الذاكرة السريعة
          </h1>
          <p className="text-sm text-slate-600">
            تلات اختبارات عملية دمهم خفيف عشان د. خليل يقيس الذاكرة قصيرة المدى والتركيز والترتيب،
            ونتائجهم بتتضاف فوراً لملفك الطبي.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 border border-slate-200 rounded-xl w-fit">
        {(
          [
            { id: 'word_recall', label: '١. اختبار التلات حاجات' },
            { id: 'sequence_match', label: '٢. ترتيب المشاوير' },
            { id: 'daily_scenario', label: '٣. مواقف التلاجة' },
          ] as const
        ).map((tab) => {
          const done = Boolean(getCompleted(tab.id));
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTest(tab.id)}
              className={`min-h-[38px] px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                selectedTest === tab.id
                  ? 'bg-white text-teal-800 border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>{tab.label}</span>
              {done && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        {selectedTest === 'word_recall' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  اختبار التلات حاجات (قياس الذاكرة قصيرة المدى)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  احفظ التلات حاجات دول كويس.. هنشغل دماغك بسؤال سريع وبعدها نسألك عليهم!
                </p>
              </div>
              {wordPhase === 'memorize' && (
                <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-amber-700 tabular-nums">
                  <Clock className="w-4 h-4" />
                  <span>{countdown} ثانية</span>
                </div>
              )}
            </div>

            {wordPhase === 'memorize' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {TARGET_WORDS.map((word, idx) => (
                    <div
                      key={word}
                      className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center"
                    >
                      <span className="block text-xs font-mono text-teal-700 mb-1 tabular-nums">
                        0{idx + 1}
                      </span>
                      <span className="font-display text-base font-bold text-teal-950">
                        {word}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setWordPhase('distract')}
                    className="min-h-[40px] px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    حفظتهم خلاص، هات السؤال!
                  </button>
                </div>
              </div>
            )}

            {wordPhase === 'distract' && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-800">
                  سؤال تمويه سريع عشان نشوف الذاكرة بتصمد ولا لأ:
                  <span className="block text-teal-800 mt-1">
                    لو جبت عيش بـ ١٥ جنيه وكوباية شاي بـ ١٠ جنيه، ودفعت ١٠٠ جنيه.. الباقي كام؟
                  </span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {['75 جنيه', '65 جنيه', '85 جنيه'].map((ans) => (
                    <button
                      key={ans}
                      type="button"
                      onClick={() => {
                        setDistractAnswer(ans);
                        setWordPhase('recall');
                      }}
                      className="min-h-[42px] px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-800 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {ans}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {wordPhase === 'recall' && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-800">
                  {distractAnswer === '75 جنيه'
                    ? 'شاطر في الحساب! دلوقتي اختار التلات حاجات اللي شوفتهم من شوية:'
                    : 'الباقي ٧٥ يا فندم، واضح إننا محتاجين شوية تركيز! اختار التلات حاجات اللي شوفتهم من شوية:'}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {WORD_SET_POOL.map((word) => {
                    const active = selectedWords.includes(word);
                    return (
                      <button
                        key={word}
                        type="button"
                        onClick={() => toggleWord(word)}
                        className={`min-h-[44px] px-3 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
                          active
                            ? 'bg-teal-700 text-white border-teal-700 font-semibold'
                            : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {word}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500 tabular-nums">
                    المختار: {selectedWords.length} / 3
                  </span>
                  <button
                    type="button"
                    disabled={selectedWords.length !== 3}
                    onClick={finishWordRecall}
                    className="min-h-[42px] px-5 py-2 text-sm font-bold bg-teal-700 hover:bg-teal-800 disabled:bg-slate-300 text-white rounded-lg transition-colors cursor-pointer"
                  >
                    تأكيد الإجابة
                  </button>
                </div>
              </div>
            )}

            {wordPhase === 'done' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    نتيجتك: {selectedWords.filter((w) => TARGET_WORDS.includes(w)).length} من 3
                  </p>
                  <p className="text-xs text-emerald-800 mt-1">
                    {selectedWords.filter((w) => TARGET_WORDS.includes(w)).length === 3
                      ? 'الله ينور! البسبوسة محفوظة في الحفظ والصون وملفك اتحدث بالنتيجة.'
                      : 'كويس إننا بنسجل كل حاجة في الملف، النتيجة وصلت لد. خليل خلاص.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetWordRecall}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة الاختبار</span>
                </button>
              </div>
            )}
          </div>
        )}

        {selectedTest === 'sequence_match' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  اختبار ترتيب المشاوير (الذاكرة التنفيذية)
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  احفظ خط سير المشاوير الأربعة بالترتيب، وبعدها رتبهم من غير ما تتوه في الزحمة!
                </p>
              </div>
              {seqPhase === 'memorize' && (
                <div className="flex items-center gap-1.5 text-sm font-mono font-bold text-amber-700 tabular-nums">
                  <Clock className="w-4 h-4" />
                  <span>{seqCountdown} ثانية</span>
                </div>
              )}
            </div>

            {seqPhase === 'memorize' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ERRANDS_ORDER.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3"
                    >
                      <span className="w-7 h-7 rounded-lg bg-teal-700 text-white font-mono text-xs font-bold flex items-center justify-center shrink-0 tabular-nums">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShuffledErrands([...ERRANDS_ORDER].sort(() => Math.random() - 0.5));
                      setSeqPhase('arrange');
                    }}
                    className="min-h-[40px] px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    حفظت الترتيب، ابدأ!
                  </button>
                </div>
              </div>
            )}

            {seqPhase === 'arrange' && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-slate-800">
                  اضغط على المشاوير بالترتيب من الأول للآخر ({pickedOrder.length} / 4):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shuffledErrands.map((item) => {
                    const orderIdx = pickedOrder.indexOf(item.id);
                    const isPicked = orderIdx !== -1;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isPicked}
                        onClick={() => handlePickErrand(item.id)}
                        className={`min-h-[48px] p-3.5 rounded-xl border text-right flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                          isPicked
                            ? 'bg-teal-50 border-teal-300 text-teal-900'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <span className="text-sm font-medium">{item.label}</span>
                        {isPicked && (
                          <span className="w-6 h-6 rounded-md bg-teal-700 text-white font-mono text-xs font-bold flex items-center justify-center tabular-nums">
                            {orderIdx + 1}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {seqPhase === 'done' && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    جبت{' '}
                    {pickedOrder.filter((id, idx) => ERRANDS_ORDER[idx].id === id).length} من 4 في الترتيب!
                  </p>
                  <p className="text-xs text-emerald-800 mt-1">
                    النتيجة اتسجلت في ملف المريض عشان د. خليل ياخدها في الاعتبار.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetSequenceMatch}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة التحدي</span>
                </button>
              </div>
            )}
          </div>
        )}

        {selectedTest === 'daily_scenario' && (
          <div className="space-y-5">
            <div className="pb-4 border-b border-slate-200">
              <h2 className="font-display text-lg font-bold text-slate-900">
                اختبار مواقف النسيان اليومية
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                تلات مواقف بتحصل لكل مصري.. اختار رد فعلك الحقيقي!
              </p>
            </div>

            {!scenarioDone ? (
              <div className="space-y-4">
                <div className="text-xs font-mono text-slate-500 tabular-nums">
                  موقف {scenarioIdx + 1} من {DAILY_SCENARIOS.length}
                </div>
                <p className="text-base font-bold text-slate-900">
                  {DAILY_SCENARIOS[scenarioIdx].q}
                </p>
                <div className="space-y-2.5">
                  {DAILY_SCENARIOS[scenarioIdx].options.map((opt) => (
                    <button
                      key={opt.text}
                      type="button"
                      onClick={() => handleAnswerScenario(opt.points)}
                      className="w-full min-h-[46px] p-3.5 text-right text-sm font-medium bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-slate-800 transition-colors cursor-pointer"
                    >
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900 tabular-nums">
                      تقييم المواقف اليومية: {scenarioPoints} / 9
                    </p>
                    <p className="text-xs text-emerald-800 mt-1">
                      ممتاز! د. خليل سجل أسلوب تعاملك مع مواقف السرحان في الملف الطبي.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetScenarios}
                  className="min-h-[38px] px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>أعد الاختبار</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
