import React from 'react';
import { type LucideIcon, ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';
import { cn } from '../../../utils';

interface KPICardProps {
    title: string;
    value: string;
    trend: string;
    trendIsPositive: boolean;
    icon: LucideIcon;
    className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
    title,
    value,
    trend,
    trendIsPositive,
    icon: Icon,
    className
}) => {
    return (
        <div className={cn("bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col justify-between h-[110px] relative group hover:shadow-md transition-shadow duration-200", className)}>
            <div className="flex items-center space-x-2">
                <div className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center",
                    title.includes('Total') || title.includes('Avg User') ? "bg-orange-100 text-[#FF5C00]" :
                        title.includes('Active') || title.includes('NRR') ? "bg-emerald-100 text-emerald-600" :
                            title.includes('Paid') || title.includes('New MRR') ? "bg-purple-100 text-purple-600" :
                                "bg-orange-100 text-[#FF5C00]"
                )}>
                    <Icon size={14} strokeWidth={2.5} />
                </div>
                <span className="text-xs font-medium text-slate-500">{title}</span>
                <Info size={12} className="text-slate-300 ml-auto absolute right-4 top-5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
            </div>

            <div className="flex items-end justify-between mt-2">
                <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
                    {trend && (
                        <div className={cn(
                            "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                            trendIsPositive ? "text-emerald-500 bg-emerald-50" : "text-rose-500 bg-rose-50"
                        )}>
                            {trendIsPositive ? <ArrowUpRight size={10} className="mr-0.5" /> : <ArrowDownRight size={10} className="mr-0.5" />}
                            {trend}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
