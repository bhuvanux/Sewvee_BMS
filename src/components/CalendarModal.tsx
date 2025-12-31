import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Colors, Shadow } from '../constants/theme';

const CalendarModal = ({ visible, onClose, onSelect, initialDate, disablePastDates = true, minDate }: any) => {
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

    // Update state when visible or initialDate changes
    useEffect(() => {
        if (visible) {
            let m = today.getMonth();
            let y = today.getFullYear();
            if (initialDate && initialDate.includes('/')) {
                const parts = initialDate.split('/');
                if (parts.length === 3) {
                    m = parseInt(parts[1]) - 1;
                    y = parseInt(parts[2]);
                }
            }
            setCurrentMonth(m);
            setCurrentYear(y);
        }
    }, [visible, initialDate]);

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
        const d = String(day).padStart(2, '0');
        const m = String(currentMonth + 1).padStart(2, '0');
        const y = currentYear;
        onSelect(`${d}/${m}/${y}`);
        onClose();
    };

    const renderDays = () => {
        const days = [];
        const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

        // Empty slots for previous month
        for (let i = 0; i < firstDay; i++) {
            days.push(<View key={`empty-${i}`} style={styles.calendarDayEmpty} />);
        }
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${String(i).padStart(2, '0')}/${String(currentMonth + 1).padStart(2, '0')}/${currentYear}`;
            const cellDate = new Date(currentYear, currentMonth, i);
            cellDate.setHours(0, 0, 0, 0);

            // Check if date is in the past
            // If minDate is provided (Date object), use it. Else use "disablePastDates" flag against today.
            let isDisabled = false;

            if (minDate) {
                isDisabled = cellDate < minDate;
            } else if (disablePastDates) {
                isDisabled = cellDate < today;
            }

            // Highlight if matches initialDate
            const isSelected = initialDate === dateStr;
            const isToday = todayStr === dateStr && !isSelected;

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
                </TouchableOpacity>
            );
        }
        return days;
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.calendarContainer}>
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
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    calendarContainer: {
        backgroundColor: Colors.white,
        margin: 20,
        borderRadius: 24,
        padding: 24,
        ...Shadow.large,
        width: '90%',
        maxWidth: 360
    },
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
        borderRadius: 20 // Circular-ish
    },
    calendarDayEmpty: {
        width: '14.2%',
        aspectRatio: 1,
        marginBottom: 4
    },
    calendarDaySelected: {
        backgroundColor: Colors.primary,
        borderRadius: 999
    },
    calendarDayToday: {
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 999
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
});

export default CalendarModal;
