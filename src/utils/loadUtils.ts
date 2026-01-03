import { Order } from '../types';

export type LoadStatus = 'low' | 'medium' | 'high';

export interface DeliveryLoad {
    count: number;
    status: LoadStatus;
    urgentCount: number;
}

export interface DeliveryLoadMap {
    [date: string]: DeliveryLoad;
}

export const getDeliveryLoad = (orders: Order[], month: number = -1, year: number = -1): DeliveryLoadMap => {
    const loadMap: DeliveryLoadMap = {};

    // Filter relevant orders
    const activeOrders = orders.filter(o =>
        o.status !== 'Cancelled' &&
        o.status !== 'Delivered' &&
        o.status !== 'Completed'
    );

    activeOrders.forEach(order => {
        // Collect all relevant dates for this order
        const relevantDates = new Set<string>();
        const dateToUrgency = new Map<string, boolean>();

        // Check Items first
        let hasItemDates = false;
        if (order.items && order.items.length > 0) {
            order.items.forEach((item: any) => {
                if (item.status !== 'Cancelled' && item.deliveryDate) {
                    hasItemDates = true;
                    relevantDates.add(item.deliveryDate);

                    const orderUrgency = order.urgency === 'Urgent' || order.urgency === 'High';
                    const itemUrgency = item.urgency === 'Urgent' || item.urgency === 'High';

                    if (itemUrgency || orderUrgency) {
                        dateToUrgency.set(item.deliveryDate, true);
                    }
                }
            });
        }

        // Fallback to order delivery date if no items have specific dates
        // OR if the order itself has a date but items don't override it completely (business rule ambiguous, assuming mixed usage)
        // User request implies "I changed item date", so item date is truth.
        // If NO active items have dates, use order date.
        if (!hasItemDates && order.deliveryDate) {
            relevantDates.add(order.deliveryDate);
            const orderUrgent = order.urgency === 'Urgent' || order.urgency === 'High';
            if (orderUrgent) {
                dateToUrgency.set(order.deliveryDate, true);
            }
        }

        // Process found dates
        relevantDates.forEach(dateStr => {
            // Basic date validation (dd/mm/yyyy) expected format from existing code
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const mC = parseInt(parts[1]) - 1; // 0-indexed
                const yC = parseInt(parts[2]);

                // Filter by requested month/year
                if ((month === -1 && year === -1) || (mC === month && yC === year)) {
                    if (!loadMap[dateStr]) {
                        loadMap[dateStr] = { count: 0, status: 'low', urgentCount: 0 };
                    }
                    loadMap[dateStr].count++; // We count 1 load per order-date occurrence? Or per item?
                    // "Count" usually means number of orders due. 
                    // If one order has 2 items on same day, relevantDates Set handles uniqueness, so count increments by 1.
                    // If one order has items on Day A and Day B, both increment. This is correct.

                    if (dateToUrgency.get(dateStr)) {
                        loadMap[dateStr].urgentCount++;
                    }
                }
            }
        });
    });

    // Determine status based on count
    Object.keys(loadMap).forEach(key => {
        const count = loadMap[key].count;
        if (count <= 2) loadMap[key].status = 'low';
        else if (count <= 5) loadMap[key].status = 'medium';
        else loadMap[key].status = 'high';
    });

    return loadMap;
};
