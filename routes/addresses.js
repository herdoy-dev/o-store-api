import express from "express";
import Response from "../lib/Response.js";
import logger from "../logger/logger.js";
import auth from "../middlewares/auth.js";
import { Address, validateAddress } from "../models/Address.js";
import { User } from "../models/User.js";

const router = express.Router();

// Create a new address
router.post("/", auth, async (req, res) => {
  try {
    const { error } = validateAddress(req.body);
    if (error) {
      return res
        .status(400)
        .send(new Response(false, error.details[0].message));
    }

    const address = await Address.create({
      ...req.body,
      user: req.user._id,
    });

    return res
      .status(201)
      .send(new Response(true, "Address created successfully", address));
  } catch (error) {
    logger.error({ message: "Error during address creation", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

// Get all addresses (with optional filtering and pagination)
router.get("/", auth, async (req, res) => {
  try {
    const {
      search,
      orderBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      pageSize = 10,
      ...filters
    } = req.query;

    // Validate pagination parameters
    const parsedPage = Math.max(1, parseInt(page));
    const parsedPageSize = Math.min(100, Math.max(1, parseInt(pageSize)));

    // Base query - only show addresses belonging to the authenticated user
    let query = Address.find({ user: req.user._id }).populate(
      "user",
      "firstName lastName email"
    );

    // Apply search filter if provided
    if (search && typeof search === "string") {
      const searchRegex = new RegExp(search.trim(), "i");
      query = query.or([
        { street: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { postalCode: searchRegex },
        { country: searchRegex },
      ]);
    }

    // Apply additional filters
    const allowedFilters = ["city", "state", "country", "isDefault"];
    Object.keys(filters).forEach((key) => {
      if (allowedFilters.includes(key)) {
        query = query.where(key).equals(filters[key]);
      }
    });

    // Apply sorting
    const sortDirection = sortOrder.toLowerCase() === "desc" ? -1 : 1;
    const validSortFields = [
      "city",
      "state",
      "country",
      "createdAt",
      "updatedAt",
    ];
    if (validSortFields.includes(orderBy)) {
      query = query.sort({ [orderBy]: sortDirection });
    }

    // Apply pagination
    const skip = (parsedPage - 1) * parsedPageSize;
    query = query.skip(skip).limit(parsedPageSize);

    // Execute query
    const addresses = await query.exec();

    // Get total count for pagination (with same filters)
    const countQuery = Address.find({ user: req.user._id });

    if (search && typeof search === "string") {
      const searchRegex = new RegExp(search.trim(), "i");
      countQuery.or([
        { street: searchRegex },
        { city: searchRegex },
        { state: searchRegex },
        { postalCode: searchRegex },
        { country: searchRegex },
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
      message: "Addresses retrieved successfully",
      data: addresses,
      pagination: {
        total: totalCount,
        currentPage: parsedPage,
        totalPages: Math.ceil(totalCount / parsedPageSize),
        pageSize: parsedPageSize,
      },
    });
  } catch (error) {
    logger.error({ message: "Error fetching addresses", error });
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching addresses",
    });
  }
});

// Get single address by ID
router.get("/my", auth, async (req, res) => {
  try {
    const address = await Address.findOne({
      user: req.user._id,
    });
    if (!address) {
      return res.status(404).send(new Response(false, "Address not found"));
    }
    return res.status(200).send(new Response(true, "Success", address));
  } catch (error) {
    logger.error({ message: "Error fetching address", error });
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching address",
    });
  }
});

// Update an address
router.put("/:id", auth, async (req, res) => {
  try {
    // 1. Validate request body
    const { error } = validateAddress(req.body);
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

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: req.params.id, user: user._id },
      req.body,
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).send(new Response(false, "Address not found"));
    }

    return res
      .status(200)
      .send(new Response(true, "Address updated successfully", updatedAddress));
  } catch (error) {
    logger.error({ message: "Error during address update", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

// Delete an address
router.delete("/:id", auth, async (req, res) => {
  try {
    const deletedAddress = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!deletedAddress) {
      return res.status(404).send(new Response(false, "Address not found"));
    }

    return res
      .status(200)
      .send(new Response(true, "Address deleted successfully"));
  } catch (error) {
    logger.error({ message: "Error during address deletion", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

export default router;
