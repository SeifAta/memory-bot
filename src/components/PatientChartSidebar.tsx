import React from 'react';
import { ClipboardCheck, Coffee, AlertTriangle, Brain, User } from 'lucide-react';
import type { ClinicalFindings, MiniTestResult, PatientProfile } from '../types/clinic';

interface PatientChartSidebarProps {
  profile: PatientProfile;
  findings: ClinicalFindings;
  completedTests: MiniTestResult[];
  progressPercent: number;
}

export const PatientChartSidebar: React.FC<PatientChartSidebarProps> = ({
  profile,
  findings,
  completedTests,
  progressPercent,
}) => {
  const rows: Array<{ label: string; value: string; icon: React.ReactNode }> = [
    {
      label: 'الشكوى الأساسية',
      value: findings.chiefComplaint || 'لسه بنسمع الحكاية...',
      icon: <Brain className="w-4 h-4 text-teal-700 shrink-0" />,
    },
    {
      label: 'المدة والتطور',
      value: findings.duration || 'قيد السؤال',
      icon: <ClipboardCheck className="w-4 h-4 text-teal-700 shrink-0" />,
    },
    {
      label: 'النوم والقهوة والتوتر',
      value:
        [findings.sleepPattern, findings.stressAndMood, findings.caffeineAndHabits]
          .filter(Boolean)
          .join(' · ') || 'لسه مسألناش عن النوم والشاي',
      icon: <Coffee className="w-4 h-4 text-teal-700 shrink-0" />,
    },
    {
      label: 'التاريخ المرضي والأدوية',
      value: findings.medicalAndMeds || 'قيد المراجعة',
      icon: <User className="w-4 h-4 text-teal-700 shrink-0" />,
    },
  ];

  return (
    <aside className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900">
            ملف المريض عند د. فاكر
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {profile.name} · <span className="tabular-nums">{profile.age}</span> سنة · {profile.occupation}
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-teal-800 tabular-nums shrink-0">
          {progressPercent}%
        </span>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-700 transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(8, progressPercent))}%` }}
        />
      </div>

      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="py-3 first:pt-0 last:pb-0 flex items-start gap-3">
            <div className="mt-0.5">{row.icon}</div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-500">{row.label}</div>
              <div className="text-sm text-slate-800 mt-0.5 leading-relaxed">
                {row.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {findings.forgetfulnessTriggers.length > 0 && (
        <div className="pt-3 border-t border-slate-200">
          <div className="text-xs font-semibold text-slate-500 mb-1.5">
            حاجات بتتنسي كتير
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            {findings.forgetfulnessTriggers.join(' · ')}
          </p>
        </div>
      )}

      {findings.redFlagsCheck && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold block">فحص علامات الخطر:</span>
            {findings.redFlagsCheck}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-slate-200 space-y-2">
        <div className="text-xs font-semibold text-slate-500">نتائج اختبارات الذاكرة</div>
        {completedTests.length === 0 ? (
          <p className="text-xs text-slate-400">لسه مفيش اختبارات اتعملت في الجلسة دي.</p>
        ) : (
          <div className="space-y-2">
            {completedTests.map((t) => (
              <div
                key={t.testType}
                className="flex items-center justify-between gap-2 text-xs py-1.5 border-b border-slate-100 last:border-none"
              >
                <span className="font-medium text-slate-800">{t.title}</span>
                <span className="font-mono font-bold text-teal-800 tabular-nums">
                  {t.score}/{t.maxScore}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {findings.doctorWittyNote && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs font-semibold text-teal-800 mb-1">
            ملحوظة د. خليل على جنب
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            &ldquo;{findings.doctorWittyNote}&rdquo;
          </p>
        </div>
      )}
    </aside>
  );
};
