const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// GET all reviews
router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find().sort({ time: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET reviews by food ID
router.get('/food/:foodId', async (req, res) => {
    try {
        const reviews = await Review.find({ foodId: req.params.foodId }).sort({ time: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET average rating for food
router.get('/food/:foodId/rating', async (req, res) => {
    try {
        const result = await Review.aggregate([
            { $match: { foodId: req.params.foodId } },
            { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
        ]);

        if (result.length === 0) {
            return res.json({ avgRating: 0, count: 0 });
        }

        res.json({ avgRating: result[0].avgRating, count: result[0].count });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new review
router.post('/', async (req, res) => {
    try {
        const review = new Review({
            ...req.body,
            time: new Date()
        });
        await review.save();
        res.status(201).json(review);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE review
router.delete('/:id', async (req, res) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
