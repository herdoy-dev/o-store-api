import express from "express";
import Response from "../lib/Response.js";
import logger from "../logger/logger.js";
import { Product, validateProduct } from "../models/Product.js";
import auth from "../middlewares/auth.js";
import { User } from "../models/User.js";
import { Category } from "../models/Category.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { error } = validateProduct(req.body);
    if (error) {
      return res
        .status(400)
        .send(new Response(false, error.details[0].message));
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(400).send(new Response(false, "Invalid User"));

    const category = await Category.findById(req.body.category);
    if (!category)
      return res.status(400).send(new Response(false, "Invalid Category"));

    // Create new product
    const product = await Product.create({
      ...req.body,
      user: user._id,
    });

    return res
      .status(201)
      .send(new Response(true, "Product created successfully", product));
  } catch (error) {
    logger.error({ message: "Error during product creation", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

export default router;
