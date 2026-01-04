// Validation Service - All validation logic

class ValidationService {
    // Validate VPA format (UPI ID)
    static isValidVPA(vpa) {
        if (!vpa || typeof vpa !== 'string') return false;
        const vpaRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
        return vpaRegex.test(vpa);
    }

    // Validate card number using Luhn algorithm
    static isValidCardNumber(cardNumber) {
        if (!cardNumber || typeof cardNumber !== 'string') return false;

        const cleaned = cardNumber.replace(/[\s-]/g, '');

        // Check if only digits
        if (!/^\d+$/.test(cleaned)) return false;

        // Check length (13-19 digits)
        if (cleaned.length < 13 || cleaned.length > 19) return false;

        // Luhn algorithm
        let sum = 0;
        let isSecondDigit = false;

        for (let i = cleaned.length - 1; i >= 0; i--) {
            let digit = parseInt(cleaned[i], 10);

            if (isSecondDigit) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }

            sum += digit;
            isSecondDigit = !isSecondDigit;
        }

        return sum % 10 === 0;
    }

    // Detect card network by BIN
    static detectCardNetwork(cardNumber) {
        if (!cardNumber || typeof cardNumber !== 'string') return 'unknown';

        const cleaned = cardNumber.replace(/[\s-]/g, '');
        const firstDigit = parseInt(cleaned[0], 10);
        const twoDigits = parseInt(cleaned.substring(0, 2), 10);

        if (firstDigit === 4) return 'visa';
        if (twoDigits >= 51 && twoDigits <= 55) return 'mastercard';
        if (firstDigit === 3) {
            if (cleaned[1] === '4' || cleaned[1] === '7') return 'amex';
        }
        if (cleaned[0] === '6' && (cleaned[1] === '0' || cleaned[1] === '5')) return 'rupay';
        if (twoDigits >= 81 && twoDigits <= 89) return 'rupay';

        return 'unknown';
    }

    // Validate card expiry
    static isValidCardExpiry(month, year) {
        if (!month || !year) return false;

        const monthNum = parseInt(month, 10);
        const yearStr = year.toString();
        let yearNum = parseInt(yearStr, 10);

        // Convert 2-digit year to 4-digit
        if (yearStr.length === 2) {
            yearNum += 2000;
        }

        if (monthNum < 1 || monthNum > 12) return false;

        const expiryDate = new Date(yearNum, monthNum, 0);
        const now = new Date();

        // Set to end of expiry month
        expiryDate.setHours(23, 59, 59, 999);

        return expiryDate >= now;
    }

    // Extract last 4 digits
    static getCardLast4(cardNumber) {
        if (!cardNumber || typeof cardNumber !== 'string') return '';
        const cleaned = cardNumber.replace(/[\s-]/g, '');
        return cleaned.substring(cleaned.length - 4);
    }
}

module.exports = ValidationService;