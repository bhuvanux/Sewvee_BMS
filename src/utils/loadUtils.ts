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
        // Check main delivery date
        if (order.deliveryDate) {
            // Basic date validation (dd/mm/yyyy)
            const parts = order.deliveryDate.split('/');
            if (parts.length === 3) {
                // const dC = parseInt(parts[0]);
                const mC = parseInt(parts[1]) - 1; // 0-indexed
                const yC = parseInt(parts[2]);

                // If month/year are -1, allow ALL. Else filter.
                if ((month === -1 && year === -1) || (mC === month && yC === year)) {
                    const dateKey = order.deliveryDate;
                    if (!loadMap[dateKey]) {
                        loadMap[dateKey] = { count: 0, status: 'low', urgentCount: 0 };
                    }
                    loadMap[dateKey].count++;

                    // Check Urgency
                    const hasUrgentItem = order.items && order.items.some((i: any) => (i.urgency === 'Urgent' || i.urgency === 'High') && i.status !== 'Cancelled');
                    const isUrgent = (order.urgency === 'Urgent' || order.urgency === 'High' || hasUrgentItem) && order.status !== 'Cancelled';

                    if (isUrgent) {
                        loadMap[dateKey].urgentCount++;
                    }
                }
            }
        }
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
