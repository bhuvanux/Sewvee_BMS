import React, { useRef, useState } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Text
} from 'react-native';
import { Colors, Shadow } from '../constants/theme';

interface PinInputProps {
    value: string;
    onValueChange: (value: string) => void;
    length?: number;
}

const PinInput: React.FC<PinInputProps> = ({ value, onValueChange, length = 4 }) => {
    const inputs = useRef<TextInput[]>([]);

    const handleTextChange = (text: string, index: number) => {
        const newValue = value.split('');
        newValue[index] = text;
        const result = newValue.join('');
        onValueChange(result);

        if (text && index < length - 1) {
            inputs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    return (
        <View style={styles.container}>
            {[...Array(length)].map((_, i) => (
                <View key={i} style={[styles.box, value[i] ? styles.boxActive : null]}>
                    <TextInput
                        ref={(ref) => { if (ref) inputs.current[i] = ref; }}
                        style={styles.input}
                        maxLength={1}
                        keyboardType="number-pad"
                        onChangeText={(text) => handleTextChange(text, i)}
                        onKeyPress={(e) => handleKeyPress(e, i)}
                        value={value[i] || ''}
                        secureTextEntry={true}
                        selectTextOnFocus={true}
                    />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 20,
    },
    box: {
        width: 60,
        height: 60,
        borderRadius: 16,
        backgroundColor: Colors.white,
        borderWidth: 1.5,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadow.subtle,
    },
    boxActive: {
        borderColor: Colors.primary,
        borderWidth: 2,
    },
    input: {
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: Colors.textPrimary,
        textAlign: 'center',
        width: '100%',
        height: '100%',
    }
});

export default PinInput;
