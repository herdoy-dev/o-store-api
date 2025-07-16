import express from "express";
import admin from "../middlewares/admin.js";
import auth from "../middlewares/auth.js";
import Response from "../lib/Response.js";
import { Contact, validateContact } from "../models/Contact.js";

const router = express.Router();

router.get("/", [auth, admin], async (req, res) => {
  const {
    search,
    orderBy,
    sortOrder = "asc",
    page = 1,
    pageSize = 10,
    ...filters
  } = req.query;

  let query = Contact.find();

  if (search) {
    query = query.or([
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
    ]);
  }

  // Apply exact match filters for each field if provided
  Object.keys(filters).forEach((key) => {
    if (["firstName", "lastName", "email", "message"].includes(key)) {
      query = query.where(key).equals(filters[key]);
    }
  });

  // Apply sorting
  if (orderBy) {
    const sortDirection = sortOrder === "desc" ? -1 : 1;
    query = query.sort({ [orderBy]: sortDirection });
  }

  // Apply pagination
  const skip = (page - 1) * pageSize;
  query = query.skip(skip).limit(parseInt(pageSize));

  const contacts = await query.exec();

  let countQuery = Contact.find();

  if (search) {
    countQuery = countQuery.or([
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
    ]);
  }

  Object.keys(filters).forEach((key) => {
    if (["firstName", "lastName", "email", "message"].includes(key)) {
      countQuery = countQuery.where(key).equals(filters[key]);
    }
  });

  const totalCount = await countQuery.countDocuments(); // Fixed: using countQuery instead of Contact

  res
    .status(200)
    .json(new Response(true, "Fetched", contacts, totalCount, page, pageSize));
});

router.get("/:id", [auth, admin], async (req, res) => {
  const _id = req.params.id;
  const contact = await Contact.findById(_id);
  if (!contact)
    return res
      .status(404)
      .send(
        new Response(false, "The contact with the given ID was not found!")
      );

  res.status(200).send(new Response(true, "Success", contact));
});

router.post("/", async (req, res) => {
  const body = req.body;
  const { error } = validateContact(body);
  if (error)
    return res.status(400).send(new Response(false, error.details[0].message));
  const newContact = await Contact.create(body);
  res.status(201).send(new Response(true, "Success", newContact));
});

router.delete("/:id", [auth, admin], async (req, res) => {
  const _id = req.params.id;
  const contact = await Contact.findById(_id);
  if (!contact)
    return res
      .status(404)
      .send(
        new Response(
          false,
          "The contact with the given ID was not found or has already been deleted."
        )
      );

  const deletedContact = await Contact.findByIdAndDelete(_id);

  res.status(200).send(new Response(true, "Delete Success", deletedContact));
});

export default router;
