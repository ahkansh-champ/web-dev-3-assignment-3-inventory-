const express = require("express");
const {
  createProduct, getProducts, getProduct, updateProduct,
  adjustStock, deleteProduct, getLowStock, getSummary
} = require("../controllers/productController");

const router = express.Router();
router.post("/", createProduct);
router.get("/", getProducts);
router.get("/low-stock", getLowStock);
router.get("/summary", getSummary);
router.get("/:id", getProduct);
router.put("/:id", updateProduct);
router.patch("/:id/stock", adjustStock);
router.delete("/:id", deleteProduct);
module.exports = router;