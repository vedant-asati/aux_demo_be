import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
// import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// export const registerUser = async (req: Request, res: Response) => {
//     try {
//         const { email, password, name } = req.body;

//         const existingUser = await prisma.user.findUnique({
//             where: { email }
//         });

//         if (existingUser) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         const hashedPassword = await bcrypt.hash(password, 10);

//         const user = await prisma.user.create({
//             data: {
//                 email,
//                 password: hashedPassword,
//                 name,
//                 role: 'USER'
//             }
//         });

//         const token = jwt.sign(
//             { id: user.id, role: user.role }, 
//             process.env.JWT_SECRET!,
//             { expiresIn: '24h' }
//         );

//         res.status(201).json({ 
//             user: {
//                 id: user.id,
//                 email: user.email,
//                 name: user.name,
//                 role: user.role
//             },
//             token 
//         });
//     } catch (error) {
//         res.status(500).json({
//             message: error instanceof Error ? error.message : 'Error creating user'
//         });
//     }
// };

// export const loginUser = async (req: Request, res: Response) => {
//     try {
//         const { email, password } = req.body;

//         const user = await prisma.user.findUnique({
//             where: { email }
//         });

//         if (!user || !(await bcrypt.compare(password, user.password))) {
//             return res.status(401).json({ message: 'Invalid credentials' });
//         }

//         const token = jwt.sign(
//             { id: user.id, role: user.role },
//             process.env.JWT_SECRET!,
//             { expiresIn: '24h' }
//         );

//         res.json({ 
//             user: {
//                 id: user.id,
//                 email: user.email,
//                 name: user.name,
//                 role: user.role
//             },
//             token 
//         });
//     } catch (error) {
//         res.status(500).json({
//             message: error instanceof Error ? error.message : 'Error during login'
//         });
//     }
// };

export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.body.user;

        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error fetching profile'
        });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { id } = req.body.user;
        const { name, email } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { name, email }
        });

        res.json({
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            role: updatedUser.role
        });
    } catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error updating profile'
        });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany();

        res.json(users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        })));
    } catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error fetching users'
        });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: Number(id) }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        });
    } catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error fetching user'
        });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.user.delete({
            where: { id: Number(id) }
        });

        res.status(204).send();
    } catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error deleting user'
        });
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.body.user;
        const { currentPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({
            where: { id }
        });

        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(401).json({ message: 'Invalid current password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({
            message: error instanceof Error ? error.message : 'Error changing password'
        });
    }
};

// @DEV Fix
// export const forgotPassword = async (req: Request, res: Response) => {
//     try {
//         const { email } = req.body;
//         const user = await prisma.user.findUnique({ where: { email } });

//         if (!user) {
//             return res.json({ message: 'If an account exists, a reset link will be sent' });
//         }

//         const resetToken = jwt.sign(
//             { id: user.id },
//             process.env.JWT_SECRET!,
//             { expiresIn: '1h' }
//         );

//         await prisma.user.update({
//             where: { id: user.id },
//             data: {
//                 resetToken,
//                 resetTokenExpiry: new Date(Date.now() + 3600000)
//             }
//         });

//         // TODO: Implement email sending
//         res.json({ message: 'Password reset instructions sent', resetToken });
//     } catch (error) {
//         res.status(500).json({
//             message: error instanceof Error ? error.message : 'Error processing request'
//         });
//     }
// };

// export const resetPassword = async (req: Request, res: Response) => {
//     try {
//         const { token, newPassword } = req.body;
//         const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

//         const user = await prisma.user.findFirst({
//             where: {
//                 id: decoded.id,
//                 resetToken: token,
//                 resetTokenExpiry: { gt: new Date() }
//             }
//         });

//         if (!user) {
//             return res.status(400).json({ message: 'Invalid or expired reset token' });
//         }

//         const hashedPassword = await bcrypt.hash(newPassword, 10);
//         await prisma.user.update({
//             where: { id: user.id },
//             data: {
//                 password: hashedPassword,
//                 resetToken: null,
//                 resetTokenExpiry: null
//             }
//         });

//         res.json({ message: 'Password reset successful' });
//     } catch (error) {
//         res.status(500).json({
//             message: error instanceof Error ? error.message : 'Error resetting password'
//         });
//     }
// };

// model User {
//     // ... existing fields
//     resetToken      String?
//     resetTokenExpiry DateTime?
//   }