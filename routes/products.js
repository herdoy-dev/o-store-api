import express from "express";
import Response from "../lib/Response.js";
import logger from "../logger/logger.js";
import auth from "../middlewares/auth.js";
import { Category } from "../models/Category.js";
import { Product, validateProduct } from "../models/Product.js";
import { User } from "../models/User.js";

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

router.get("/", async (req, res) => {
  try {
    const {
      search,
      orderBy,
      categoryId,
      price,
      sortOrder = "asc",
      page = 1,
      pageSize = 10,
      ...filters
    } = req.query;

    const setPrice = price ? parseInt(price) : null;
    // Validate pagination parameters
    const parsedPage = Math.max(1, parseInt(page));
    const parsedPageSize = Math.min(100, Math.max(1, parseInt(pageSize)));

    // Base query - only show products belonging to the authenticated user
    let query = Product.find(categoryId ? { category: categoryId } : {})
      .populate("category", "name")
      .populate("user", "firstName lastName");

    // Apply search filter if provided
    if (search && typeof search === "string") {
      query = query.or([
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ]);
    }

    if (setPrice) {
      query = query.find({
        price: { $lte: setPrice },
      });
    }

    // Apply additional filters
    const allowedFilters = ["name", "colors", "sizes"];
    Object.keys(filters).forEach((key) => {
      if (allowedFilters.includes(key)) {
        query = query.where(key).equals(filters[key]);
      }
    });

    // Apply sorting if specified
    if (orderBy && typeof orderBy === "string") {
      const sortDirection = sortOrder.toLowerCase() === "desc" ? -1 : 1;
      const validSortFields = ["name", "price", "createdAt"];
      if (validSortFields.includes(orderBy)) {
        query = query.sort({ [orderBy]: sortDirection });
      }
    }

    // Apply pagination
    const skip = (parsedPage - 1) * parsedPageSize;
    query = query.skip(skip).limit(parsedPageSize);

    // Execute query
    const products = await query.exec();

    // Get total count for pagination (with same filters)
    const countQuery = Product.find();

    if (search && typeof search === "string") {
      query = query.or([
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ]);
    }

    Object.keys(filters).forEach((key) => {
      if (allowedFilters.includes(key)) {
        countQuery.where(key).equals(filters[key]);
      }
    });

    const totalCount = await countQuery.countDocuments();

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
      pagination: {
        total: totalCount,
        currentPage: parsedPage,
        totalPages: Math.ceil(totalCount / parsedPageSize),
        pageSize: parsedPageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching products",
    });
  }
});

// Get products for authenticated user with filtering, sorting, and pagination
router.get("/my", auth, async (req, res) => {
  try {
    const {
      search,
      orderBy,
      categoryId,
      price,
      sortOrder = "asc",
      page = 1,
      pageSize = 10,
      ...filters
    } = req.query;

    const setPrice = price ? parseInt(price) : null;
    // Validate pagination parameters
    const parsedPage = Math.max(1, parseInt(page));
    const parsedPageSize = Math.min(100, Math.max(1, parseInt(pageSize)));

    // Base query - only show products belonging to the authenticated user
    let query = Product.find(
      categoryId
        ? { category: categoryId, user: req.user._id }
        : { user: req.user._id }
    )
      .populate("category", "name")
      .populate("user", "firstName lastName");

    // Apply search filter if provided
    if (search && typeof search === "string") {
      query = query.or([
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ]);
    }

    if (setPrice) {
      query = query.find({
        price: { $lte: setPrice },
      });
    }

    // Apply additional filters
    const allowedFilters = ["name", "colors", "sizes"];
    Object.keys(filters).forEach((key) => {
      if (allowedFilters.includes(key)) {
        query = query.where(key).equals(filters[key]);
      }
    });

    // Apply sorting if specified
    if (orderBy && typeof orderBy === "string") {
      const sortDirection = sortOrder.toLowerCase() === "desc" ? -1 : 1;
      const validSortFields = ["name", "price", "createdAt"];
      if (validSortFields.includes(orderBy)) {
        query = query.sort({ [orderBy]: sortDirection });
      }
    }

    // Apply pagination
    const skip = (parsedPage - 1) * parsedPageSize;
    query = query.skip(skip).limit(parsedPageSize);

    // Execute query
    const products = await query.exec();

    // Get total count for pagination (with same filters)
    const countQuery = Product.find();

    if (search && typeof search === "string") {
      query = query.or([
        { name: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ]);
    }

    Object.keys(filters).forEach((key) => {
      if (allowedFilters.includes(key)) {
        countQuery.where(key).equals(filters[key]);
      }
    });

    const totalCount = await countQuery.countDocuments();

    res.status(200).json({
      success: true,
      message: "Products retrieved successfully",
      data: products,
      pagination: {
        total: totalCount,
        currentPage: parsedPage,
        totalPages: Math.ceil(totalCount / parsedPageSize),
        pageSize: parsedPageSize,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching products",
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product)
      return res.status(401).send(new Response(false, "Invalid product id"));
    return res.status(200).send(new Response(true, "Success", product));
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching product",
    });
  }
});

router.put("/:id", auth, async (req, res) => {
  try {
    // 1. Validate request body
    const { error } = validateProduct(req.body);
    if (error) {
      return res
        .status(400)
        .send(new Response(false, error.details[0].message));
    }

    // 2. Verify user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).send(new Response(false, "Invalid User"));
    }

    // 3. Verify category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).send(new Response(false, "Invalid Category"));
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        user: user._id,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send(new Response(false, "Product not found"));
    }

    return res
      .status(200)
      .send(new Response(true, "Product updated successfully", updatedProduct));
  } catch (error) {
    logger.error({ message: "Error during product update", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

export default router;
