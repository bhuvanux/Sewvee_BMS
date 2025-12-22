export const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePhone = (phone: string): boolean => {
    return phone.length === 10 && /^\d+$/.test(phone);
};

export const validatePin = (pin: string): boolean => {
    return pin.length === 4 && /^\d+$/.test(pin);
};
