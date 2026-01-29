const express = require('express');
const router = express.Router();
const Food = require('../models/Food');

// Default food items to seed database
const DEFAULT_FOODS = [
    {
        name: "Classic Burger",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
        price: 199,
        quantity: "250g",
        stock: 25,
        ingredients: "Beef patty, Lettuce, Tomato, Cheese, Pickles, Onions"
    },
    {
        name: "Margherita Pizza",
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500",
        price: 299,
        quantity: "300g",
        stock: 20,
        ingredients: "Tomato sauce, Mozzarella, Fresh basil, Olive oil"
    },
    {
        name: "Chicken Biryani",
        image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500",
        price: 249,
        quantity: "400g",
        stock: 30,
        ingredients: "Basmati rice, Chicken, Spices, Saffron, Fried onions"
    },
    {
        name: "Caesar Salad",
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500",
        price: 149,
        quantity: "200g",
        stock: 15,
        ingredients: "Romaine lettuce, Croutons, Parmesan, Caesar dressing"
    },
    {
        name: "Chocolate Brownie",
        image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500",
        price: 99,
        quantity: "100g",
        stock: 40,
        ingredients: "Dark chocolate, Butter, Sugar, Eggs, Walnuts"
    },
    {
        name: "Masala Dosa",
        image: "https://images.unsplash.com/photo-1668236543090-82eb5eace0f7?w=500",
        price: 89,
        quantity: "200g",
        stock: 35,
        ingredients: "Rice batter, Potato masala, Sambar, Chutney"
    }
];

// GET all foods
router.get('/', async (req, res) => {
    try {
        let foods = await Food.find().sort({ createdAt: -1 });

        // Seed database if empty
        if (foods.length === 0) {
            foods = await Food.insertMany(DEFAULT_FOODS);
            console.log('✅ Seeded database with default foods');
        }

        res.json(foods);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET single food by ID
router.get('/:id', async (req, res) => {
    try {
        const food = await Food.findById(req.params.id);
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }
        res.json(food);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST create new food
router.post('/', async (req, res) => {
    try {
        const food = new Food(req.body);
        await food.save();
        res.status(201).json(food);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// PUT update food
router.put('/:id', async (req, res) => {
    try {
        const food = await Food.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }
        res.json(food);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE food
router.delete('/:id', async (req, res) => {
    try {
        const food = await Food.findByIdAndDelete(req.params.id);
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }
        res.json({ message: 'Food deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH update stock
router.patch('/:id/stock', async (req, res) => {
    try {
        const { quantity } = req.body;
        const food = await Food.findById(req.params.id);
        if (!food) {
            return res.status(404).json({ error: 'Food not found' });
        }
        food.stock = Math.max(0, food.stock - quantity);
        await food.save();
        res.json(food);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
