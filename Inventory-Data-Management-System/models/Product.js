const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 0, validate: Number.isInteger },
  reorderLevel: { type: Number, default: 10, min: 0, validate: Number.isInteger },
  supplier: { type: String, required: true, trim: true },
  stockValue: { type: Number, default: 0 }
}, { timestamps: true });

productSchema.pre("validate", function(next) {
  this.stockValue = this.price * this.quantity;
  next();
});
productSchema.pre("findOneAndUpdate", async function() {
  const update = this.getUpdate() || {};
  const current = await this.model.findOne(this.getQuery());
  if (!current) return;
  const fields = update.$set || update;
  const price = fields.price ?? current.price;
  const quantity = fields.quantity ?? current.quantity;
  if (fields.price !== undefined || fields.quantity !== undefined) {
    update.$set = { ...(update.$set || {}), stockValue: price * quantity };
    this.setUpdate(update);
  }
});
module.exports = mongoose.model("Product", productSchema);