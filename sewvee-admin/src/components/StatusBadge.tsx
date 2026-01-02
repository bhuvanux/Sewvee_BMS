import React from 'react';
import { cn } from '../utils';

type StatusType = 'Active' | 'Inactive' | 'Pending' | 'Trial' | 'At Risk' | 'Paid' | 'Processing' | 'Failed' | 'Completed' | 'Cancelled';

interface StatusBadgeProps {
    status: StatusType | string;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
    const getStatusStyles = (status: string) => {
        const normalizedStatus = status.toLowerCase();

        if (['active', 'paid', 'completed'].includes(normalizedStatus)) {
            return "bg-emerald-50 text-emerald-600";
        }
        if (['inactive', 'cancelled', 'failed'].includes(normalizedStatus)) {
            return "bg-red-50 text-red-500";
        }
        if (['pending', 'processing'].includes(normalizedStatus)) {
            return "bg-purple-50 text-purple-600";
        }
        if (['trial', 'at risk'].includes(normalizedStatus)) {
            return "bg-orange-50 text-orange-600";
        }
        return "bg-gray-100 text-gray-600";
    };

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center justify-center min-w-[80px]",
            getStatusStyles(status),
            className
        )}>
            <div className={cn("w-1.5 h-1.5 rounded-full mr-1.5",
                getStatusStyles(status).replace("bg-", "bg-current-").replace("text-", "text-") // trick to get dot color same as text
                    .split(" ")[1].replace("text-", "bg-") // actually just map text color to bg color for dot
            )}></div>
            {status}
        </span>
    );
};
