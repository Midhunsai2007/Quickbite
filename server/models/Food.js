const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/400x300?text=Food+Image'
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: String,
        default: '100g'
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 25
    },
    ingredients: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Food', foodSchema);
