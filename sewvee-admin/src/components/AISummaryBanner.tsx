import React from 'react';
import { Sparkles } from 'lucide-react';

interface AISummaryBannerProps {
    title: string;
    items: string[];
}

export const AISummaryBanner: React.FC<AISummaryBannerProps> = ({ title, items }) => {
    return (
        <div className="bg-purple-50 rounded-2xl p-6 mb-8 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <Sparkles className="text-purple-600" size={20} />
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                </div>
                {/* Chevron up could go here if collapsible */}
            </div>
            <div className="flex flex-wrap gap-3">
                {items.map((item, index) => (
                    <div key={index} className="bg-purple-100 px-4 py-2 rounded-lg text-sm font-semibold text-purple-700">
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
};
