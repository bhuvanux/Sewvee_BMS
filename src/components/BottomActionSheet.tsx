import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import { Colors, Spacing, Shadow } from '../constants/theme';
import { X } from 'lucide-react-native';

interface ActionItem {
    id: string;
    label: string;
    icon?: any; // Lucide Icon component
    onPress: () => void;
    type?: 'default' | 'danger';
}

interface BottomActionSheetProps {
    visible: boolean;
    onClose: () => void;
    title?: string;
    actions: ActionItem[];
}

const BottomActionSheet = ({ visible, onClose, title, actions }: BottomActionSheetProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableOpacity style={styles.sheet} activeOpacity={1}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.handle} />
                        <View style={styles.headerRow}>
                            <Text style={styles.title}>{title || 'Actions'}</Text>
                            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                                <X size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Actions List */}
                    <ScrollView contentContainerStyle={styles.content}>
                        {actions.map((action, index) => {
                            const Icon = action.icon;
                            const isDanger = action.type === 'danger';
                            const color = isDanger ? Colors.danger : Colors.textPrimary;

                            return (
                                <TouchableOpacity
                                    key={action.id || index}
                                    style={styles.actionItem}
                                    onPress={() => {
                                        onClose();
                                        // Small timeout to allow modal to close smoothly before action triggers (e.g. another modal)
                                        setTimeout(() => action.onPress(), 100);
                                    }}
                                >
                                    <View style={[styles.iconBox, isDanger && styles.iconBoxDanger]}>
                                        {Icon && <Icon size={20} color={color} />}
                                    </View>
                                    <Text style={[styles.actionLabel, isDanger && styles.actionLabelDanger]}>
                                        {action.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: 40,
        ...Shadow.large,
    },
    header: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 12,
        marginTop: 8,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontFamily: 'Inter-Bold',
        fontSize: 18,
        color: Colors.textPrimary,
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        paddingVertical: Spacing.sm,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 18,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconBoxDanger: {
        backgroundColor: '#FEF2F2',
    },
    actionLabel: {
        fontFamily: 'Inter-Medium',
        fontSize: 16,
        color: Colors.textPrimary,
    },
    actionLabelDanger: {
        color: Colors.danger,
        fontFamily: 'Inter-SemiBold',
    },
});

export default BottomActionSheet;
