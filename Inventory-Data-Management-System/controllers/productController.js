const mongoose = require("mongoose");
const Product = require("../models/Product");
const asyncHandler = require("../utils/asyncHandler");

const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, data: product });
});

const getProducts = asyncHandler(async (req, res) => {
  const {
    search, name, category, supplier, minPrice, maxPrice,
    minQuantity, maxQuantity, lowStock, sort = "name", page = 1, limit = 10
  } = req.query;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const filter = {};
  if (name) filter.name = { $regex: name, $options: "i" };
  if (category) filter.category = { $regex: category, $options: "i" };
  if (supplier) filter.supplier = { $regex: supplier, $options: "i" };
  if (search) {
    filter.$or = ["name", "sku", "category", "supplier"].map(field => ({
      [field]: { $regex: search, $options: "i" }
    }));
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }
  if (minQuantity !== undefined || maxQuantity !== undefined) {
    filter.quantity = {};
    if (minQuantity !== undefined) filter.quantity.$gte = Number(minQuantity);
    if (maxQuantity !== undefined) filter.quantity.$lte = Number(maxQuantity);
  }
  if (lowStock === "true") filter.$expr = { $lte: ["$quantity", "$reorderLevel"] };

  const allowedSort = ["name", "sku", "category", "price", "quantity", "reorderLevel", "supplier", "stockValue", "createdAt"];
  const sortField = sort.startsWith("-") ? sort.slice(1) : sort;
  const sortOption = allowedSort.includes(sortField) ? { [sortField]: sort.startsWith("-") ? -1 : 1 } : { name: 1 };

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip((pageNum - 1) * limitNum).limit(limitNum),
    Product.countDocuments(filter)
  ]);
  res.json({ success: true, count: products.length, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum), data: products });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const allowed = ["name", "sku", "category", "price", "quantity", "reorderLevel", "supplier"];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const product = await Product.findByIdAndUpdate(req.params.id, { $set: updates }, {
    new: true, runValidators: true, context: "query"
  });
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.json({ success: true, data: product });
});

const adjustStock = asyncHandler(async (req, res) => {
  const change = Number(req.body.change);
  if (!Number.isInteger(change) || change === 0) {
    return res.status(400).json({ success: false, message: "change must be a non-zero whole number" });
  }
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  if (product.quantity + change < 0) {
    return res.status(400).json({ success: false, message: "Stock quantity cannot become negative" });
  }
  product.quantity += change;
  product.stockValue = product.price * product.quantity;
  await product.save();
  res.json({ success: true, message: "Stock updated successfully", data: product });
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  res.json({ success: true, message: "Product deleted successfully", data: product });
});

const getLowStock = asyncHandler(async (req, res) => {
  const products = await Product.find({ $expr: { $lte: ["$quantity", "$reorderLevel"] } }).sort({ quantity: 1 });
  res.json({ success: true, count: products.length, data: products });
});

const getSummary = asyncHandler(async (req, res) => {
  const summary = await Product.aggregate([
    { $group: {
      _id: "$category",
      productCount: { $sum: 1 },
      totalQuantity: { $sum: "$quantity" },
      totalStockValue: { $sum: "$stockValue" },
      lowStockCount: { $sum: { $cond: [{ $lte: ["$quantity", "$reorderLevel"] }, 1, 0] } }
    }},
    { $project: { _id: 0, category: "$_id", productCount: 1, totalQuantity: 1, totalStockValue: 1, lowStockCount: 1 } },
    { $sort: { category: 1 } }
  ]);
  res.json({ success: true, data: summary });
});

module.exports = { createProduct, getProducts, getProduct, updateProduct, adjustStock, deleteProduct, getLowStock, getSummary };