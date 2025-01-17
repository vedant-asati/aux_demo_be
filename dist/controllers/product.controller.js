"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = void 0;
const client_1 = require("@prisma/client");
const library_1 = require("@prisma/client/runtime/library");
const error_middleware_1 = require("../middleware/error.middleware");
const prisma = new client_1.PrismaClient();
const getAllProducts = async (req, res, next) => {
    try {
        const products = await prisma.product.findMany();
        res.json(products);
    }
    catch (error) {
        next(error);
    }
};
exports.getAllProducts = getAllProducts;
const getProductById = async (req, res, next) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                auctions: true
            }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    }
    catch (error) {
        next(error);
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res, next) => {
    try {
        const product = await prisma.product.create({
            data: {
                ...req.body,
                price: new library_1.Decimal(req.body.price)
            }
        });
        res.status(201).json(product);
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res, next) => {
    try {
        const productId = Number(req.params.id);
        const updateData = req.body;
        const updateFields = {};
        if (updateData.description !== undefined)
            updateFields.description = updateData.description;
        if (updateData.name !== undefined)
            updateFields.name = updateData.name;
        if (updateData.category !== undefined)
            updateFields.category = updateData.category;
        if (updateData.photoUrl !== undefined)
            updateFields.photoUrl = updateData.photoUrl;
        if (updateData.price !== undefined) {
            updateFields.price = new library_1.Decimal(updateData.price.toString());
        }
        updateFields.updatedAt = new Date();
        const product = await prisma.product.update({
            where: { id: productId },
            data: updateFields
        });
        res.json(product);
    }
    catch (error) {
        next(error);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res, next) => {
    try {
        const productId = Number(req.params.id);
        const productWithAuctions = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                auctions: true
            }
        });
        if (!productWithAuctions) {
            throw new error_middleware_1.ProductDeletionError('Product not found', 404);
        }
        if (productWithAuctions.auctions.length > 0) {
            throw new error_middleware_1.ProductDeletionError('Cannot delete product as it is associated with existing auctions. ' +
                `Product is used in ${productWithAuctions.auctions.length} auction(s).`, 409);
        }
        await prisma.product.delete({
            where: { id: productId }
        });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=product.controller.js.map