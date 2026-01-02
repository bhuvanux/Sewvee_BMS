import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Shadow } from '../constants/theme';
import { DeliveryLoadMap } from '../utils/loadUtils';
import CalendarView from './CalendarView';

const CalendarModal = ({ visible, onClose, onSelect, initialDate, disablePastDates = true, minDate, deliveryLoad }: {
    visible: boolean;
    onClose: () => void;
    onSelect: (date: string) => void;
    initialDate?: string;
    disablePastDates?: boolean;
    minDate?: Date;
    deliveryLoad?: DeliveryLoadMap;
}) => {
    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.calendarContainer}>
                    <CalendarView
                        onSelect={(date) => {
                            onSelect(date);
                            onClose();
                        }}
                        initialDate={initialDate}
                        disablePastDates={disablePastDates}
                        minDate={minDate}
                        deliveryLoad={deliveryLoad}
                        showLegend={true}
                    />
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
    }
});

export default CalendarModal;
