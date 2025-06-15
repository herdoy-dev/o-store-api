import express from "express";
import Response from "../lib/Response.js";
import logger from "../logger/logger.js";
import { Category, validateCategory } from "../models/Category.js";

const router = express.Router();

router.post("/", async (req, res) => {
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

export default router;
