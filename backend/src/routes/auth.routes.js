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
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6)
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
    }

    const existingUsername = await User.findOne({ username: parsed.data.username });
    if (existingUsername) {
        return res.status(400).json({ message: "Username already in use" });
    }

    const existingEmail = await User.findOne({ email: parsed.data.email });
    if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await User.create({
        name: parsed.data.name,
        username: parsed.data.username,
        email: parsed.data.email,
        passwordHash
    });
    res.json({ message: "User registered successfully" });
}));

router.post('/login', asyncHandler(async (req, res) => {
    const schema = z.object({
        identifier: z.string().min(1),
        password: z.string().min(6)
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
    }

    const identifier = parsed.data.identifier.toLowerCase().trim();

    // Allow login with either username or email
    const user = await User.findOne({
        $or: [{ username: identifier }, { email: identifier }]
    });

    if (!user) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!ok) {
        return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token, user: { id: user._id, name: user.name, username: user.username } });
}));

export default router;
