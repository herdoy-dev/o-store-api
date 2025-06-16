import express from "express";
import Response from "../lib/Response.js";
import logger from "../logger/logger.js";
import { Category, validateCategory } from "../models/Category.js";
import auth from "../middlewares/auth.js";

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

router.get("/", auth, async (req, res) => {
  try {
    const categorys = await Category.find();
    return res
      .status(200)
      .send(new Response(true, "Category Created", categorys));
  } catch (error) {
    logger.error({ message: "During Fetch Categorys", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

export default router;
