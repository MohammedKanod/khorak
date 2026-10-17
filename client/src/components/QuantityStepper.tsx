import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 99999,
  step = 1,
  unit = '',
  label,
  size = 'md',
}) => {
  const handleDecrement = () => {
    const next = Math.max(min, Number((value - step).toFixed(2)));
    onChange(next);
  };

  const handleIncrement = () => {
    const next = Math.min(max, Number((value + step).toFixed(2)));
    onChange(next);
  };

  const isLg = size === 'lg';

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={value <= min}
          className={`flex items-center justify-center rounded-xl border border-slate-300 bg-white font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95 disabled:opacity-40 ${
            isLg ? 'h-14 w-14 text-xl' : 'h-11 w-11 text-lg'
          }`}
          aria-label="Decrease quantity"
        >
          <Minus className={isLg ? 'w-6 h-6' : 'w-5 h-5'} />
        </button>

        <div
          className={`flex-1 flex items-center justify-center rounded-xl border border-slate-300 bg-white shadow-inner font-bold text-slate-900 ${
            isLg ? 'h-14 text-2xl' : 'h-11 text-xl'
          }`}
        >
          <span>{value}</span>
          {unit && <span className="ml-1.5 text-xs font-medium text-slate-500">{unit}</span>}
        </div>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={value >= max}
          className={`flex items-center justify-center rounded-xl border border-forest-600 bg-forest-700 font-bold text-white shadow-sm transition hover:bg-forest-800 active:scale-95 disabled:opacity-40 ${
            isLg ? 'h-14 w-14 text-xl' : 'h-11 w-11 text-lg'
          }`}
          aria-label="Increase quantity"
        >
          <Plus className={isLg ? 'w-6 h-6' : 'w-5 h-5'} />
        </button>
      </div>
    </div>
  );
};
