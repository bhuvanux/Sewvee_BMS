import React from 'react';
import { Sparkles } from 'lucide-react';

interface AISummaryBannerProps {
    summaries: string[];
}

export const AISummaryBanner: React.FC<AISummaryBannerProps> = ({ summaries }) => {
    return (
        <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-6 relative overflow-hidden group">
            {/* Decorative sparkle background elements */}
            <div className="absolute top-[-10px] right-[-10px] opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles size={120} className="text-purple-600" />
            </div>

            <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                    <Sparkles size={20} className="text-purple-600 fill-purple-200" />
                </div>
                <h3 className="font-bold text-slate-800 tracking-tight">AI Summary of Client Activity</h3>
                <div className="flex-1 border-b border-purple-100 border-dashed ml-4"></div>
                <button className="text-purple-400 hover:text-purple-600 transform group-hover:rotate-180 transition-transform duration-500">
                    <svg width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            <div className="flex flex-wrap gap-3">
                {summaries.map((text, idx) => (
                    <div
                        key={idx}
                        className="bg-white/80 backdrop-blur-sm border border-purple-200 px-4 py-2 rounded-full text-sm font-medium text-purple-700 shadow-sm hover:shadow-md transition-all cursor-default"
                    >
                        {text}
                    </div>
                ))}
            </div>
        </div>
    );
};
