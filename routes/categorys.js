import express from "express";
import Response from "../lib/Response.js";
import logger from "../logger/logger.js";
import auth from "../middlewares/auth.js";
import { Category, validateCategory } from "../models/Category.js";

const router = express.Router();

router.post("/", auth, async (req, res) => {
  try {
    const { error } = validateCategory(req.body);
    if (error)
      return res
        .status(400)
        .send(new Response(false, error.details[0].message));
    const category = await Category.findOne({ name: req.body.name });
    if (category)
      return res
        .status(400)
        .send(new Response(false, "This category is already exist."));
    const newCategory = await Category.create(req.body);
    return res
      .status(201)
      .send(new Response(true, "Category Created", newCategory));
  } catch (error) {
    logger.error({ message: "During Create Category", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

router.get("/", async (req, res) => {
  try {
    const categorys = await Category.find();
    return res.status(200).send(new Response(true, "Success", categorys));
  } catch (error) {
    logger.error({ message: "During Fetch Categorys", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

router.get("/:id", async (req, res) => {
  try {
    const categroy = await Category.findById(req.params.id);
    if (!categroy)
      return res.status(401).send(new Response(false, "Invalid category id"));
    return res.status(200).send(new Response(true, "Success", categroy));
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching category",
    });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    const { error } = validateCategory(req.body);
    if (error) {
      return res
        .status(400)
        .send(new Response(false, error.details[0].message));
    }

    const updatedProduct = await Category.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send(new Response(false, "Product not found"));
    }

    return res
      .status(200)
      .send(
        new Response(true, "Category updated successfully", updatedProduct)
      );
  } catch (error) {
    logger.error({ message: "Error during Category update", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

export default router;
