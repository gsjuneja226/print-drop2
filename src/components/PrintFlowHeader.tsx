'use client';

import React from 'react';
import { Upload, Sliders, CreditCard, CheckCircle } from 'lucide-react';

interface PrintFlowHeaderProps {
  currentStep: 'upload' | 'options' | 'payment' | 'success';
}

export default function PrintFlowHeader({ currentStep }: PrintFlowHeaderProps) {
  const steps = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'options', label: 'Options', icon: Sliders },
    { key: 'payment', label: 'Payment', icon: CreditCard },
    { key: 'success', label: 'Collect', icon: CheckCircle },
  ];

  return (
    <div className="w-full bg-surface border-b border-customBorder py-3 px-4 sticky top-0 z-40">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.key === currentStep;
          const isDone = steps.findIndex(s => s.key === currentStep) > index;

          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-xs font-semibold ${
                    isActive
                      ? 'bg-brandBlue text-white ring-4 ring-brandBlue/20 scale-110'
                      : isDone
                      ? 'bg-brandCyan/20 text-brandCyan border border-brandCyan'
                      : 'bg-ink text-customSecondary border border-customBorder'
                  }`}
                >
                  {isDone ? '✓' : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-medium transition-colors ${
                    isActive ? 'text-primaryTxt' : 'text-customSecondary'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-[1px] w-6 sm:w-10 mb-5 border-t transition-colors ${
                    isDone ? 'border-brandCyan/50' : 'border-customBorder'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
