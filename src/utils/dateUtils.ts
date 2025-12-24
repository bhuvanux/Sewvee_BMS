/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Formats a date string or Date object to DD/MM/YYYY
 * @param date Formal string or Date object
 * @returns Formatted date string (e.g., 25/12/2025)
 */
export const formatDate = (date?: string | Date | null): string => {
    if (!date) return '';

    let d: Date | null = null;

    if (typeof date === 'string') {
        // Strict DD/MM/YYYY parsing
        if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date)) {
            const parts = date.split('/').map(Number);
            let [p1, p2, year] = parts;

            // Heuristic to detect MM/DD/YYYY
            // If the first number is <= 12 and second is > 12, it's likely MM/DD/YYYY
            if (p1 <= 12 && p2 > 12) {
                // It's MM/DD/YYYY, swap them to get [day, month, year]
                d = new Date(year, p1 - 1, p2);
            } else {
                // Assume it's DD/MM/YYYY
                d = new Date(year, p2 - 1, p1);
            }
        }
        // Handle ISO or other formats
        else {
            d = new Date(date);
        }
    } else {
        // Handle Firestore Timestamp or similar objects with toDate()
        if (date && typeof (date as any).toDate === 'function') {
            d = (date as any).toDate();
        } else {
            d = date as Date;
        }
    }

    // Check for invalid date
    if (!d || isNaN(d.getTime())) {
        return typeof date === 'string' ? date : '';
    }

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();

    return `${day}/${month}/${year}`;
};

/**
 * Safely parses a date string (DD/MM/YYYY or ISO) into a Date object
 */
export const parseDate = (dateStr: string): Date => {
    if (!dateStr) return new Date();
    if (dateStr.includes('T')) return new Date(dateStr);

    if (dateStr.includes('/')) {
        const parts = dateStr.split('/').map(Number);
        if (parts.length === 3) {
            let [p1, p2, y] = parts;
            // Detect MM/DD/YYYY vs DD/MM/YYYY
            if (p1 <= 12 && p2 > 12) {
                return new Date(y, p1 - 1, p2); // MM/DD/YYYY
            }
            return new Date(y, p2 - 1, p1); // DD/MM/YYYY
        }
    }

    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
};

/**
 * Gets the current date in DD/MM/YYYY format
 */
export const getCurrentDate = (): string => {
    return formatDate(new Date());
};

/**
 * Gets the current time in HH:MM AM/PM format
 */
export const getCurrentTime = (): string => {
    return new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};
