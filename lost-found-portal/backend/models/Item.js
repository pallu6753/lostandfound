const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Item title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['electronics', 'documents', 'keys', 'wallets', 'bags', 'clothing', 'books', 'other']
    },
    type: {
        type: String,
        enum: ['lost', 'found'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'claimed'],
        default: 'active'
    },
    location: {
        type: String,
        required: [true, 'Location is required']
    },
    contactEmail: {
        type: String,
        required: [true, 'Contact email is required']
    },
    color: String,
    brand: String,
    images: [String],
    dateLostFound: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create text index for search
itemSchema.index({
    title: 'text',
    description: 'text', 
    location: 'text',
    color: 'text',
    brand: 'text'
});

module.exports = mongoose.model('Item', itemSchema);