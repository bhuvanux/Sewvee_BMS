import React from 'react';
import { onboardingDropoffData } from '../mockData';

export const OnboardingDropoffChart: React.FC = () => {
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 flex flex-col h-full justify-center">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Client Onboarding Drop-Off Points</h3>
                <div className="px-3 py-1.5 bg-gray-50 rounded-lg text-xs font-bold text-slate-600">
                    This Month
                </div>
            </div>

            <div className="relative">
                {/* Scale Lines */}
                <div className="absolute top-0 bottom-0 left-[20%] right-0 flex justify-between text-[10px] font-bold text-slate-400 pointer-events-none">
                    <span>0</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>100%</span>
                </div>
                <div className="absolute top-6 bottom-0 left-[20%] right-0 flex justify-between border-l border-gray-100 pointer-events-none">
                    <div className="h-full border-r border-gray-100 border-dashed"></div>
                    <div className="h-full border-r border-gray-100 border-dashed"></div>
                    <div className="h-full border-r border-gray-100 border-dashed"></div>
                    <div className="h-full border-r border-gray-100 border-dashed"></div>
                </div>

                <div className="space-y-6 pt-8 relative z-10">
                    {onboardingDropoffData.map((item, idx) => (
                        <div key={idx} className="flex items-center">
                            <div className="w-[20%] pr-4 text-right">
                                <span className="text-xs font-bold text-slate-800">{item.stage}</span>
                            </div>
                            <div className="flex-1 h-8 bg-gray-50 rounded-r-lg relative">
                                <div
                                    className="h-full rounded-r-lg transition-all duration-1000"
                                    style={{ width: `${item.value}%`, backgroundColor: item.color }}
                                ></div>
                            </div>
                            <div className="w-[10%] pl-4">
                                <span className="text-xs font-bold text-slate-900">{item.value}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
