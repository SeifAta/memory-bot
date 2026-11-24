import React, { useState } from 'react';
import { ArrowLeft, Brain, ClipboardList, FileText, Sparkles } from 'lucide-react';
import type { PatientProfile } from '../types/clinic';

interface WelcomeReceptionProps {
  onStartConsultation: (profile: PatientProfile) => void;
  isLoading: boolean;
  errorMessage: string | null;
}

const FORGETFULNESS_LABELS: Record<number, string> = {
  1: 'نسيان خفيف: بنسى الشاي يبرد بس',
  2: 'بسيط: بدخل الأوضة أنسى كنت جاي ليه',
  3: 'وسط: بنسى اسم زميلي وأنا بسلم عليه',
  4: 'ملحوظ: بدور على النضارة وهي على راسي',
  5: 'محير: بحط الموبايل في التلاجة أحياناً',
  6: 'تشتت عالي: بنسى فطرت إيه الصبح',
  7: 'سرحان جامد: بنزل من غير ما أفتكر كنت رايح فين',
  8: 'توهان يومي: بنسى ميعاد الشغل أو الدواء',
  9: 'فاصل شحن: بسأل نفس السؤال 3 مرات',
  10: 'طوارئ: داخل العيادة أسأل أنا مين!',
};

const QUICK_PRESETS: Array<{ label: string; profile: PatientProfile }> = [
  {
    label: 'موظف مسحول وقهوته بردت',
    profile: {
      name: 'كريم',
      age: 32,
      occupation: 'مهندس برمجيات ومطحون شغل',
      selfRatedForgetfulness: 6,
    },
  },
  {
    label: 'طالبة ليالي الامتحانات',
    profile: {
      name: 'سلمى',
      age: 21,
      occupation: 'طالبة جامعة وبسهر بالقهوة',
      selfRatedForgetfulness: 7,
    },
  },
  {
    label: 'أم شايلة هم البيت كله',
    profile: {
      name: 'مدام نادية',
      age: 46,
      occupation: 'ربة منزل ومشغولة طول اليوم',
      selfRatedForgetfulness: 5,
    },
  },
];

export const WelcomeReception: React.FC<WelcomeReceptionProps> = ({
  onStartConsultation,
  isLoading,
  errorMessage,
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [occupation, setOccupation] = useState('');
  const [selfRated, setSelfRated] = useState<number>(5);
  const [imgFailed, setImgFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim() || 'يا بطل';
    onStartConsultation({
      name: cleanName,
      age: Math.max(12, Math.min(100, age || 30)),
      occupation: occupation.trim() || 'مواطن مصري مكافح',
      selfRatedForgetfulness: selfRated,
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
              <span>عيادة المخ والأعصاب والذاكرة</span>
              <span aria-hidden="true">·</span>
              <span>المهندسين، القاهرة</span>
              <span aria-hidden="true">·</span>
              <span>كشف تفاعلي بالعامية المصرية</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight [text-wrap:balance]">
              أهلاً بيك في عيادة د. فاكر.. فاكر جيت ليه النهاردة ولا تحب أفكرك؟
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
              من غير تعقيد ولا مصطلحات طبية تخضك. د. خليل هياخد منك التاريخ المرضي دردشة واحدة بواحدة،
              يعملك كام اختبار ذاكرة لطيف، وفي الآخر يطلعلك التشخيص والروشتة اللي تروق بالك.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 pt-6 border-t border-slate-200 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800">
                سجّل كارت الكشف السريع
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setName(preset.profile.name);
                      setAge(preset.profile.age);
                      setOccupation(preset.profile.occupation);
                      setSelfRated(preset.profile.selfRatedForgetfulness);
                    }}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label
                  htmlFor="patient-name"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  الاسم أو اسم الدلع
                </label>
                <input
                  id="patient-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: كريم / سارة"
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div>
                <label
                  htmlFor="patient-age"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  السن (لو فاكره)
                </label>
                <input
                  id="patient-age"
                  type="number"
                  min={12}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono tabular-nums focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                />
              </div>

              <div>
                <label
                  htmlFor="patient-job"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  بتشتغل إيه؟
                </label>
                <input
                  id="patient-job"
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  placeholder="محاسب، طالب، أم بطلة..."
                  className="w-full min-h-[42px] px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="forgetfulness-slider"
                  className="text-xs font-semibold text-slate-700"
                >
                  تقييمك الشخصي لنسيانك اليومين دول
                </label>
                <span className="text-sm font-mono font-bold text-teal-800 tabular-nums">
                  {selfRated} / 10
                </span>
              </div>
              <input
                id="forgetfulness-slider"
                type="range"
                min={1}
                max={10}
                value={selfRated}
                onChange={(e) => setSelfRated(Number(e.target.value))}
                className="w-full accent-teal-700 cursor-pointer"
              />
              <p className="text-xs font-medium text-slate-600">
                {FORGETFULNESS_LABELS[selfRated]}
              </p>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
              >
                {errorMessage}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <p className="text-xs text-slate-500">
                مدة الكشف التفاعلي: ٣ إلى ٤ دقايق · سري ومخصص ليك
              </p>
              <button
                type="submit"
                disabled={isLoading}
                className="min-h-[44px] px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:bg-teal-400 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                <span>{isLoading ? 'د. خليل بيجهز الملف...' : 'ادخل غرفة الكشف'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="relative flex-1 min-h-[260px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
            {!imgFailed ? (
              <img
                src="/src/assets/images/clinic_waiting_hero_1795546113775.jpg"
                alt="مكتب د. خليل فاكر في عيادة المخ والأعصاب بالقاهرة"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-teal-50 to-slate-100 text-slate-700">
                <Brain className="w-12 h-12 text-teal-700 mb-3" />
                <span className="font-display font-bold text-lg">عيادة د. فاكر للمخ والأعصاب</span>
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent p-5 text-white">
              <p className="text-sm font-semibold">
                &ldquo;مفيش حاجة اسمها ذاكرة بايظة.. فيه مخ محتاج تظبيط زوايا وكوباية نعناع!&rdquo;
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
              {!avatarFailed ? (
                <img
                  src="/src/assets/images/dr_khalil_portrait_1795546523890.jpg"
                  alt="صورة دكتور خليل فاكر استشاري المخ والأعصاب"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-teal-50 text-teal-700 font-bold text-xl">
                  د.خ
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-base font-bold text-slate-900">
                د. خليل فاكر
              </h2>
              <p className="text-xs font-medium text-teal-800 mt-0.5">
                استشاري أمراض المخ والأعصاب وتقوية الذاكرة
              </p>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                بيسمع حكايتك للآخر، بيفهم روتين يومك في مصر، وبيفرّق بين النسيان العادي بتاع الزحمة والحاجة اللي تستاهل تحليل.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section aria-label="خطوات الكشف في العيادة" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="font-mono text-xs font-semibold tabular-nums">01</span>
            <ClipboardList className="w-4 h-4 text-teal-700" />
          </div>
          <h3 className="font-display text-sm font-bold text-slate-900">تاريخ مرضي ذكي</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            أسئلة متدرجة عن نوع النسيان، نومك، قهوتك، والأمراض المزمنة من غير ملل.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="font-mono text-xs font-semibold tabular-nums">02</span>
            <Brain className="w-4 h-4 text-teal-700" />
          </div>
          <h3 className="font-display text-sm font-bold text-slate-900">اختبارات ذاكرة تفاعلية</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            تحدي التلات حاجات وترتيب المشاوير عشان نقيس الذاكرة قصيرة المدى عملياً.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="font-mono text-xs font-semibold tabular-nums">03</span>
            <Sparkles className="w-4 h-4 text-teal-700" />
          </div>
          <h3 className="font-display text-sm font-bold text-slate-900">تشخيص بدم خفيف</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            ملخص طبي مفهوم باللهجة المصرية يحدد سبب التشتت أو النسيان بدقة ومرح.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="font-mono text-xs font-semibold tabular-nums">04</span>
            <FileText className="w-4 h-4 text-teal-700" />
          </div>
          <h3 className="font-display text-sm font-bold text-slate-900">روشتة وتحاليل جاهزة</h3>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            فيتامينات مقترحة، تحاليل معملية، ونصايح يومية قابلة للطباعة أو النسخ فوراً.
          </p>
        </div>
      </section>
    </div>
  );
};
