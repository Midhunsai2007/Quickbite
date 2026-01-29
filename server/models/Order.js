const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        username: { type: String, default: 'guest' }
    },
    items: [{
        foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
        name: String,
        price: Number,
        quantity: Number,
        weight: String
    }],
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'preparing', 'delivery_15', 'delivery_30', 'delivery_45', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending'
    },
    time: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
