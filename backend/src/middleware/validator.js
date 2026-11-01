const validator = {
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },
    
    password: (value) => {
        if (!value || value.length < 6) {
            return { valid: false, message: 'Password must be at least 6 characters' };
        }
        if (value.length > 128) {
            return { valid: false, message: 'Password too long' };
        }
        return { valid: true };
    },
    
    phone: (value) => {
        if (!value) return { valid: true };
        const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
        return phoneRegex.test(value) ? { valid: true } : { valid: false, message: 'Invalid phone number format' };
    },
    
    name: (value) => {
        if (!value || value.trim().length < 1) {
            return { valid: false, message: 'Name is required' };
        }
        if (value.trim().length > 100) {
            return { valid: false, message: 'Name too long' };
        }
        return { valid: true };
    },
    
    price: (value) => {
        const price = parseFloat(value);
        if (isNaN(price) || price < 0) {
            return { valid: false, message: 'Price must be a positive number' };
        }
        if (price > 999999999) {
            return { valid: false, message: 'Price too high' };
        }
        return { valid: true };
    },
    
    quantity: (value) => {
        const qty = parseInt(value);
        if (isNaN(qty) || qty < 0) {
            return { valid: false, message: 'Quantity must be a positive integer' };
        }
        if (qty > 999999) {
            return { valid: false, message: 'Quantity too high' };
        }
        return { valid: true };
    },
    
    sanitizeString: (value) => {
        if (typeof value !== 'string') return value;
        return value.trim().replace(/[<>]/g, '');
    },
    
    validateRegistration: (data) => {
        const errors = [];
        
        if (!data.email && !data.phone) {
            errors.push('Phone number or email is required');
        } else if (data.email && !validator.email(data.email)) {
            errors.push('Invalid email format');
        }
        
        const passwordResult = validator.password(data.password);
        if (!passwordResult.valid) {
            errors.push(passwordResult.message);
        }
        
        const firstNameResult = validator.name(data.firstName);
        if (!firstNameResult.valid) {
            errors.push('First name ' + firstNameResult.message.toLowerCase());
        }
        
        if (data.lastName !== undefined && data.lastName !== null && data.lastName !== '') {
            const lastNameResult = validator.name(data.lastName);
            if (!lastNameResult.valid) {
                errors.push('Last name ' + lastNameResult.message.toLowerCase());
            }
        }
        
        if (data.phone) {
            const phoneResult = validator.phone(data.phone);
            if (!phoneResult.valid) {
                errors.push(phoneResult.message);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },
    
    validateProduct: (data) => {
        const errors = [];
        
        if (!data.name || data.name.trim().length < 1) {
            errors.push('Product name is required');
        } else if (data.name.length > 200) {
            errors.push('Product name too long');
        }
        
        const priceResult = validator.price(data.price);
        if (!priceResult.valid) {
            errors.push(priceResult.message);
        }
        
        if (data.stock_quantity !== undefined && data.stock_quantity !== '') {
            const qtyResult = validator.quantity(data.stock_quantity);
            if (!qtyResult.valid) {
                errors.push(qtyResult.message);
            }
        }
        
        if (data.description && data.description.length > 2000) {
            errors.push('Description too long');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    },
    
    validateOrder: (data) => {
        const errors = [];
        
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
            errors.push('Order must have at least one item');
        }
        
        if (!data.shipping_address || data.shipping_address.trim().length < 10) {
            errors.push('Valid shipping address is required');
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
};

module.exports = validator;