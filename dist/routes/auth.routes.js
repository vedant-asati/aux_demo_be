"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.post('/signup', async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        // Hash password
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'USER' // Default role
            }
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        // Check password
        const validPassword = await bcrypt_1.default.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Logged in successfully',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map