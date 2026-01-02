import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, Flame } from 'lucide-react-native';
import { Colors } from '../constants/theme';
import { DeliveryLoadMap } from '../utils/loadUtils';

interface CalendarViewProps {
    // ... existing interface
}

const CalendarView = ({
    onSelect,
    initialDate,
    deliveryLoad,
    disablePastDates = true,
    minDate,
    showLegend = false,
    style
}: CalendarViewProps) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse initialDate (DD/MM/YYYY) if exists, else today
    let startMonth = today.getMonth();
    let startYear = today.getFullYear();

    if (initialDate && initialDate.includes('/')) {
        const parts = initialDate.split('/');
        if (parts.length === 3) {
            startMonth = parseInt(parts[1]) - 1;
            startYear = parseInt(parts[2]);
        }
    }

    const [currentMonth, setCurrentMonth] = useState(startMonth);
    const [currentYear, setCurrentYear] = useState(startYear);

    // Update state when initialDate changes
    useEffect(() => {
        if (initialDate && initialDate.includes('/')) {
            const parts = initialDate.split('/');
            if (parts.length === 3) {
                const m = parseInt(parts[1]) - 1;
                const y = parseInt(parts[2]);
                setCurrentMonth(m);
                setCurrentYear(y);
            }
        }
    }, [initialDate]);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleDateClick = (day: number) => {
        if (!onSelect) return;
        const d = String(day).padStart(2, '0');
        const m = String(currentMonth + 1).padStart(2, '0');
        const y = currentYear;
        onSelect(`${d}/${m}/${y}`);
    };

    const renderDays = () => {
        const days = [];
        const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

        // Empty slots
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
        }
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${String(i).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
            const cellDate = new Date(currentYear, currentMonth, i);
            cellDate.setHours(0, 0, 0, 0);

            // ...isDisabled logic same as before...
            let isDisabled = false;
            if (minDate) {
                isDisabled = cellDate < minDate;
            } else if (disablePastDates) {
                isDisabled = cellDate < today;
            }

            const isSelected = initialDate === dateStr;
            const isToday = todayStr === dateStr && !isSelected;

            // Delivery Load Logic
            const load = deliveryLoad ? deliveryLoad[dateStr] : null;
            let loadColor = 'transparent';
            if (load) {
                if (load.status === 'low') loadColor = '#10B981'; // Green
                else if (load.status === 'medium') loadColor = '#F59E0B'; // Orange
                else if (load.status === 'high') loadColor = '#EF4444'; // Red
            }

            days.push(
                <TouchableOpacity
                    key={i}
                    style={[
                        styles.calendarDay,
                        isSelected && styles.calendarDaySelected,
                        isToday && styles.calendarDayToday,
                        isDisabled && styles.calendarDayDisabled
                    ]}
                    onPress={() => !isDisabled && handleDateClick(i)}
                    disabled={isDisabled}
                >
                    <Text style={[
                        styles.calendarDayText,
                        isSelected && styles.calendarDayTextSelected,
                        isToday && styles.calendarDayTextToday,
                        isDisabled && styles.calendarDayTextDisabled
                    ]}>{i}</Text>

                    {/* Load Indicator - Badge with Count */}
                    {load && (
                        <View style={[styles.loadBadge, { backgroundColor: loadColor }]}>
                            <Text style={styles.loadCount}>{load.count}</Text>
                            {load.urgentCount > 0 && (
                                <View style={styles.flameIcon}>
                                    <Flame size={8} color="white" fill="white" />
                                </View>
                            )}
                        </View>
                    )}
                </TouchableOpacity>
            );
        }
        return days;
    };

    return (
        <View style={[styles.container, style]}>
            {/* Header ... */}
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={handlePrevMonth} style={{ padding: 8 }}>
                    <ChevronDown size={20} color={Colors.textPrimary} style={{ transform: [{ rotate: '90deg' }] }} />
                </TouchableOpacity>
                <Text style={styles.calendarTitle}>{monthNames[currentMonth]} {currentYear}</Text>
                <TouchableOpacity onPress={handleNextMonth} style={{ padding: 8 }}>
                    <ChevronDown size={20} color={Colors.textPrimary} style={{ transform: [{ rotate: '-90deg' }] }} />
                </TouchableOpacity>
            </View>
            <View style={styles.weekRow}>
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <Text key={i} style={styles.weekDayText}>{d}</Text>
                ))}
            </View>
            <View style={styles.daysGrid}>
                {renderDays()}
            </View>

            {/* Legend Section */}
            {showLegend && (
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.loadBadge, { backgroundColor: '#10B981', minWidth: 20 }]}>
                            <Text style={styles.loadCount}>1</Text>
                        </View>
                        <Text style={styles.legendText}>Low</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.loadBadge, { backgroundColor: '#F59E0B', minWidth: 20 }]}>
                            <Text style={styles.loadCount}>3</Text>
                        </View>
                        <Text style={styles.legendText}>Medium</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.loadBadge, { backgroundColor: '#EF4444', minWidth: 20 }]}>
                            <Text style={styles.loadCount}>6</Text>
                        </View>
                        <Text style={styles.legendText}>High</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.loadBadge, { backgroundColor: '#F59E0B', minWidth: 30 }]}>
                            <Text style={styles.loadCount}>2</Text>
                            <Flame size={8} color="white" fill="white" style={{ marginLeft: 2 }} />
                        </View>
                        <Text style={styles.legendText}>Urgent</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    // ... existing styles ...
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    calendarTitle: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: '#0F172A'
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    weekDayText: {
        width: '14.2%', // 100/7
        textAlign: 'center',
        fontFamily: 'Inter-SemiBold',
        fontSize: 12,
        color: Colors.textSecondary
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start'
    },
    calendarDay: {
        width: '14.2%', // Ensure 7 items fit
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        borderRadius: 12, // Less rounded for squarish look
        paddingVertical: 4
    },
    calendarDayEmpty: {
        width: '14.2%',
        aspectRatio: 1,
        marginBottom: 4
    },
    calendarDaySelected: {
        backgroundColor: Colors.primary,
        borderRadius: 12
    },
    calendarDayToday: {
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 12
    },
    calendarDayText: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: Colors.textPrimary
    },
    calendarDayDisabled: {
        opacity: 0.25
    },
    calendarDayTextDisabled: {
        color: Colors.textSecondary,
        fontFamily: 'Inter-Regular'
    },
    calendarDayTextSelected: {
        color: Colors.white,
        fontFamily: 'Inter-Bold'
    },
    calendarDayTextToday: {
        color: Colors.primary,
        fontFamily: 'Inter-SemiBold'
    },
    // Legend Styles
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        flexWrap: 'wrap', // Allow wrap for small screens
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 16
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    legendText: {
        fontFamily: 'Inter-Medium',
        fontSize: 12,
        color: Colors.textSecondary
    },
    // New Badge Styles
    loadBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        paddingVertical: 1,
        borderRadius: 6,
        marginTop: 2,
        minWidth: 16,
        height: 16
    },
    loadCount: {
        fontFamily: 'Inter-Bold',
        fontSize: 10,
        color: 'white',
        lineHeight: 12
    },
    flameIcon: {
        marginLeft: 2
    }
});

export default CalendarView;
