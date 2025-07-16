import express from "express";
import Response from "../lib/Response.js";
import logger from "../logger/logger.js";
import auth from "../middlewares/auth.js";
import { Address } from "../models/Address.js";
import { Order, validateOrder } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import stripe from "../lib/stripe.js";

const router = express.Router();

// Create a new order by pay on delivery
router.post("/pay-on-delivery", auth, async (req, res) => {
  try {
    const { error } = validateOrder(req.body);
    if (error)
      return res
        .status(400)
        .json(new Response(false, error.details[0].message));

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(new Response(false, "User not found"));
    }

    // Validate all products in the order
    const products = await Product.find({
      _id: { $in: req.body.items.map((item) => item.product) },
    });

    if (products.length !== req.body.items.length) {
      return res
        .status(400)
        .json(new Response(false, "One or more products not found"));
    }

    const address = await Address.findOne({
      _id: req.body.shippingAddress,
      user: req.user._id,
    });

    if (!address) {
      return res
        .status(400)
        .json(new Response(false, "Invalid shipping address"));
    }

    // Calculate subtotal
    const subtotal = req.body.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    const transaction = await Transaction.create({
      user: user._id,
      type: "checkout",
      amount: subtotal,
      status: "pending",
    });

    const order = new Order({
      user: user._id,
      items: req.body.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: address._id,
      subtotal,
      status: "pending",
      paymentStatus: "pending",
    });

    await order.save();

    // Populate the order data before sending response
    const populatedOrder = await Order.populate(order, [
      { path: "user", select: "firstName lastName email" },
      { path: "items.product", select: "name price images" },
      { path: "shippingAddress" },
    ]);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Checkout",
            },
            unit_amount: Math.round(subtotal * 100),
          },
          quantity: order.items.length,
        },
      ],
      mode: "payment",
      success_url: `${process.env.ORIGIN}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.ORIGIN}/payment-cancelled`,
      metadata: {
        transactionId: transaction._id.toString(),
        orderId: populatedOrder._id.toString(),
      },
    });

    return res.json({ url: session.url });
  } catch (error) {
    logger.error("Order creation failed", { error });
    return res.status(500).json(new Response(false, "Internal server error"));
  }
});

// Create a new order by cash on delivery
router.post("/cash-on-delivery", auth, async (req, res) => {
  try {
    const { error } = validateOrder(req.body);
    if (error)
      return res
        .status(400)
        .json(new Response(false, error.details[0].message));

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json(new Response(false, "User not found"));
    }

    // Validate all products in the order
    const products = await Product.find({
      _id: { $in: req.body.items.map((item) => item.product) },
    });

    if (products.length !== req.body.items.length) {
      return res
        .status(400)
        .json(new Response(false, "One or more products not found"));
    }

    const address = await Address.findOne({
      _id: req.body.shippingAddress,
      user: req.user._id,
    });

    if (!address) {
      return res
        .status(400)
        .json(new Response(false, "Invalid shipping address"));
    }

    // Calculate subtotal
    const subtotal = req.body.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);

    const order = new Order({
      user: user._id,
      items: req.body.items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        price: item.price,
      })),
      shippingAddress: address._id,
      subtotal,
      status: "pending",
      paymentStatus: "pending",
    });

    await order.save();

    // Populate the order data before sending response
    const populatedOrder = await Order.populate(order, [
      { path: "user", select: "firstName lastName email" },
      { path: "items.product", select: "name price images" },
      { path: "shippingAddress" },
    ]);

    return res
      .status(201)
      .json(new Response(true, "Order created successfully", populatedOrder));
  } catch (error) {
    logger.error("Order creation failed", { error });
    return res.status(500).json(new Response(false, "Internal server error"));
  }
});

// Get all orders with filtering and pagination
router.get("/", auth, async (req, res) => {
  try {
    const {
      status,
      productId,
      startDate,
      endDate,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Validate and parse query parameters
    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * pageSize;

    // Build the base query
    const query = { user: req.user._id };

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (productId) {
      query["items.product"] = productId;
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Build sort object
    const sortOptions = {};
    const validSortFields = ["createdAt", "updatedAt", "subtotal", "status"];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    }

    // Execute query with pagination
    const orders = await Order.find(query)
      .populate("user", "firstName lastName email")
      .populate("items.product", "name price images")
      .populate("shippingAddress")
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    return res
      .status(200)
      .json(new Response(true, "Orders retrieved successfully", orders));
  } catch (error) {
    logger.error("Failed to fetch orders", { error });
    return res.status(500).json(new Response(false, "Internal server error"));
  }
});

// Get order by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate("user", "firstName lastName email")
      .populate("items.product", "thumbnail price images colors sizes")
      .populate("shippingAddress");
    if (!order) {
      return res.status(404).json(new Response(false, "Order not found"));
    }

    return res
      .status(200)
      .json(new Response(true, "Order retrieved successfully", order));
  } catch (error) {
    logger.error("Failed to fetch order", { error });
    return res.status(500).json(new Response(false, "Internal server error"));
  }
});

// Update order status
router.patch("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json(new Response(false, "Invalid status value"));
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status },
      { new: true }
    )
      .populate("user", "firstName lastName email")
      .populate("items.product", "name price images")
      .populate("shippingAddress");

    if (!order) {
      return res.status(404).json(new Response(false, "Order not found"));
    }

    return res
      .status(200)
      .json(new Response(true, "Order status updated successfully", order));
  } catch (error) {
    logger.error("Failed to update order status", { error });
    return res.status(500).json(new Response(false, "Internal server error"));
  }
});

// Cancel order
router.patch("/:id/cancel", auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json(new Response(false, "Order not found"));
    }

    // Check if order can be cancelled
    if (!["pending", "processing"].includes(order.status)) {
      return res
        .status(400)
        .json(new Response(false, "Order cannot be cancelled at this stage"));
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: "cancelled" },
      { new: true }
    )
      .populate("user", "firstName lastName email")
      .populate("items.product", "name price images")
      .populate("shippingAddress");

    return res
      .status(200)
      .json(new Response(true, "Order cancelled successfully", updatedOrder));
  } catch (error) {
    logger.error("Failed to cancel order", { error });
    return res.status(500).json(new Response(false, "Internal server error"));
  }
});

export default router;
