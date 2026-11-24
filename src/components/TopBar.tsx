import React from 'react';
import type { ActiveTab, ConsultationStage } from '../types/clinic';

interface TopBarProps {
  stage: ConsultationStage;
  activeTab: ActiveTab;
  hasDiagnosis: boolean;
  onSelectTab: (tab: ActiveTab) => void;
  onResetClinic: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  stage,
  activeTab,
  hasDiagnosis,
  onSelectTab,
  onResetClinic,
}) => {
  return (
    <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => onSelectTab('clinic')}
          className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 rounded-md px-1"
        >
          عيادة د. فاكر
        </button>

        <nav
          aria-label="أقسام العيادة"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => onSelectTab('clinic')}
            className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
              activeTab === 'clinic'
                ? 'border-teal-700 text-teal-800 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {stage === 'reception' ? 'استقبال العيادة' : 'غرفة الكشف'}
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('tests')}
            className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
              activeTab === 'tests'
                ? 'border-teal-700 text-teal-800 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            تحدي الذاكرة
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('prescription')}
            disabled={!hasDiagnosis}
            className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
              activeTab === 'prescription'
                ? 'border-teal-700 text-teal-800 font-semibold'
                : hasDiagnosis
                  ? 'border-transparent text-slate-600 hover:text-slate-900'
                  : 'border-transparent text-slate-400 cursor-not-allowed'
            }`}
          >
            الروشتة والتشخيص
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onResetClinic}
            className="min-h-[40px] px-4 py-2 text-sm font-semibold text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-900 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 cursor-pointer"
          >
            كشف جديد
          </button>
        </div>
      </div>

      <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center justify-around gap-2 text-xs font-medium bg-slate-50">
        <button
          type="button"
          onClick={() => onSelectTab('clinic')}
          className={`min-h-[36px] px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'clinic'
              ? 'bg-white text-teal-800 font-semibold border border-slate-200'
              : 'text-slate-600'
          }`}
        >
          {stage === 'reception' ? 'الاستقبال' : 'غرفة الكشف'}
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('tests')}
          className={`min-h-[36px] px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'tests'
              ? 'bg-white text-teal-800 font-semibold border border-slate-200'
              : 'text-slate-600'
          }`}
        >
          تحدي الذاكرة
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('prescription')}
          disabled={!hasDiagnosis}
          className={`min-h-[36px] px-3 py-1 rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'prescription'
              ? 'bg-white text-teal-800 font-semibold border border-slate-200'
              : hasDiagnosis
                ? 'text-slate-600'
                : 'text-slate-400'
          }`}
        >
          الروشتة
        </button>
      </div>
    </header>
  );
};
