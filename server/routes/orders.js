const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Food = require('../models/Food');

// GET all orders
router.get('/', async (req, res) => {
    try {
        const orders = await Order.find().sort({ time: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET orders by username
router.get('/user/:username', async (req, res) => {
    try {
        const orders = await Order.find({ 'customer.username': req.params.username }).sort({ time: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single order
router.get('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new order
router.post('/', async (req, res) => {
    try {
        const { customer, items } = req.body;

        // Calculate total and update stock
        let total = 0;
        const orderItems = [];

        for (const item of items) {
            const food = await Food.findById(item.foodId);
            if (!food) {
                return res.status(400).json({ error: `Food item ${item.foodId} not found` });
            }
            if (food.stock < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${food.name}` });
            }

            // Update stock
            food.stock -= item.quantity;
            await food.save();

            // Add to order items
            orderItems.push({
                foodId: food._id,
                name: food.name,
                price: food.price,
                quantity: item.quantity,
                weight: food.quantity
            });

            total += food.price * item.quantity;
        }

        const order = new Order({
            customer,
            items: orderItems,
            total,
            status: 'pending',
            time: new Date()
        });

        await order.save();
        res.status(201).json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PATCH update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE order
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
