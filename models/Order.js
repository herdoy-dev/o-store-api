import Joi from "joi";
import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: [true, "Product reference is required"],
        },
        quantity: {
          type: Number,
          required: [true, "Product quantity is required"],
          min: [1, "Minimum quantity is 1"],
        },
        price: {
          type: Number,
          required: [true, "Product quantity is required"],
          min: [1, "Minimum quantity is 1"],
        },
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },
    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: [true, "Shipping address reference is required"],
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal amount is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Add virtual for total price calculation if needed
OrderSchema.virtual("totalPrice").get(function () {
  return this.subtotal; // Add tax, shipping etc. if needed
});

const orderValidationSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product: Joi.string().hex().length(24).required().messages({
          "string.empty": "Product ID is required",
          "string.hex": "Invalid product ID format",
          "string.length": "Product ID must be 24 characters",
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          "number.base": "Quantity must be a number",
          "number.min": "Minimum quantity is 1",
          "any.required": "Quantity is required",
        }),
        price: Joi.number().integer().min(1).required().messages({
          "number.base": "Quantity must be a number",
          "number.min": "Minimum quantity is 1",
          "any.required": "Quantity is required",
        }),
      })
    )
    .min(1)
    .required(),
  shippingAddress: Joi.string().hex().length(24).required().messages({
    "string.empty": "Shipping address is required",
    "string.hex": "Invalid address ID format",
    "string.length": "Address ID must be 24 characters",
  }),
  status: Joi.string().valid(
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled"
  ),
  paymentStatus: Joi.string().valid("pending", "paid", "failed", "refunded"),
});

const validateOrder = (orderData) => {
  return orderValidationSchema.validate(orderData, {
    abortEarly: false,
    stripUnknown: true,
  });
};

const Order = mongoose.model("Order", OrderSchema);

export { Order, validateOrder };
