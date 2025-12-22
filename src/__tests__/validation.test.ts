import { validateEmail, validatePhone, validatePin } from '../utils/validation';

describe('Validation Utilities', () => {
    describe('validateEmail', () => {
        it('should return true for valid emails', () => {
            expect(validateEmail('test@example.com')).toBe(true);
            expect(validateEmail('user.name+tag@domain.co.in')).toBe(true);
        });

        it('should return false for invalid emails', () => {
            expect(validateEmail('test@')).toBe(false);
            expect(validateEmail('test@domain')).toBe(false);
            expect(validateEmail('not-an-email')).toBe(false);
        });
    });

    describe('validatePhone', () => {
        it('should return true for valid 10-digit numbers', () => {
            expect(validatePhone('9876543210')).toBe(true);
            expect(validatePhone('1234567890')).toBe(true);
        });

        it('should return false for incorrect lengths', () => {
            expect(validatePhone('123456789')).toBe(false);
            expect(validatePhone('12345678901')).toBe(false);
        });

        it('should return false for non-numeric input', () => {
            expect(validatePhone('12345abcde')).toBe(false);
        });
    });

    describe('validatePin', () => {
        it('should return true for valid 4-digit PINs', () => {
            expect(validatePin('1234')).toBe(true);
            expect(validatePin('0000')).toBe(true);
        });

        it('should return false for incorrect lengths', () => {
            expect(validatePin('123')).toBe(false);
            expect(validatePin('12345')).toBe(false);
        });

        it('should return false for non-numeric input', () => {
            expect(validatePin('12a4')).toBe(false);
        });
    });
});
