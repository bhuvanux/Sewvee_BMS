export const MEASUREMENT_ORDER: Record<string, string[]> = {
    'Blouse': [
        'Height',
        'Shoulder Back',
        'Back Neck Depth',
        'Upper Chest',
        'Hook',
        'Points',
        'Back',
        'Shoulder Front',
        'Middle Chest',
        'Arm Round',
        'Arm Length',
        'Front Neck Depth',
        'Waist',
        'Sleeve',
        'Front',
        'Sleeve Breadth',
        'Sleeve Length',
        'Blouse Type'
    ],
    'Chudithar': [
        'Height',
        'Top Length', // Standard alias
        'Sleeve Breadth',
        'Pant',
        'Pant Breadth',
        'Arm Round',
        'Slit',
        'Pant Length',
        'Top',
        'Hip',
        'Front Neck Depth',
        'Arm Length',
        'Seat',
        'Waist',
        'Shoulder Back',
        'Back Neck Depth',
        'Upper Chest',
        'Sleeve Length',
        'Middle Chest'
    ],
    'Lehanga': [
        'Blouse Length',
        'Shoulder',
        'Bust',
        'Waist',
        'Skirt Length',
        'Skirt Waist',
        'Hip',
        'Sleeve Length'
    ]
};

// Helper: Maps varying names to a canonical key for sorting if needed, 
// or simply returns the index.
export const getMeasurementSortIndex = (type: string, key: string): number => {
    // Normalize type (handle 'Chudi' vs 'Chudithar')
    const normalizedType = type === 'Chudi' ? 'Chudithar' : type;

    const orderList = MEASUREMENT_ORDER[normalizedType] || [];
    const index = orderList.indexOf(key);

    // If found, return index. If not, return 999 to put at end.
    return index !== -1 ? index : 999;
};
