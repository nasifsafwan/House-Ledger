import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/register', asyncHandler(async (req, res) => {
    const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6)
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
    }

    const exists = await User.findOne({ email: parsed.data.email });
    if (exists) {
        return res.status(400).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await User.create({ name: parsed.data.name, email: parsed.data.email, passwordHash });
    res.json({ message: "User registered successfully" });
}));

router.post('/login', asyncHandler(async (req, res) => {
    const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6)
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
    }

    const user = await User.findOne({ email: parsed.data.email });
    if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) {
        return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
}));

export default router;


