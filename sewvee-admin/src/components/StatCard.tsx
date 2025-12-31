import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '../utils';

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: {
        value: string;
        isUp: boolean;
    };
    icon: LucideIcon;
    subLabel?: string;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    trend,
    icon: Icon,
    subLabel,
    className
}) => {
    return (
        <div className={cn("bg-white p-6 rounded-2xl border border-gray-100 shadow-sm", className)}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        <Icon size={18} />
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
                    <div className="h-4 w-4 rounded-full border border-gray-200 flex items-center justify-center text-[10px] text-slate-300 font-bold cursor-help" title="Information about this metric">i</div>
                </div>
            </div>

            <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</span>
                {trend && (
                    <span className={cn(
                        "text-xs font-bold flex items-center",
                        trend.isUp ? "text-emerald-500" : "text-rose-500"
                    )}>
                        {trend.isUp ? '↑' : '↓'} {trend.value} <span className="text-slate-400 ml-1 font-normal">{subLabel || 'vs last month'}</span>
                    </span>
                )}
            </div>
        </div>
    );
};
