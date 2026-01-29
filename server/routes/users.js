const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Admin credentials (hardcoded as per requirement)
const ADMIN_USERNAME = 'midhun';
const ADMIN_PASSWORD = '1234';

// POST login
router.post('/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Admin login check
        if (role === 'admin') {
            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                return res.json({
                    success: true,
                    user: { username, role: 'admin' }
                });
            } else {
                return res.status(401).json({ error: 'Invalid admin credentials' });
            }
        }

        // Customer login
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'User not found. Please sign up first.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.json({
            success: true,
            user: { username: user.username, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username exists
        const existingUser = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Prevent registering as admin
        if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase()) {
            return res.status(400).json({ error: 'This username is reserved' });
        }

        const user = new User({
            username,
            password,
            role: 'customer'
        });

        await user.save();

        res.status(201).json({
            success: true,
            user: { username: user.username, role: user.role }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// GET all users (admin only)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
