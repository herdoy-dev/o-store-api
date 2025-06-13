import bcrypt from "bcryptjs";
import express from "express";
import Response from "../lib/Response.js";
import cookieOptions from "../config/cookieOptions.js";
import { User, validateLoginData, validateUser } from "../models/User.js";

const router = express.Router();

router.post("/sign-up", async (req, res) => {
  try {
    const { error } = validateUser(req.body);
    if (error) {
      return res
        .status(400)
        .send(new Response(false, error.details[0].message));
    }

    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .send(new Response(false, "User with this email already exists"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    const token = newUser.generateAuthToken();

    res
      .status(201)
      .cookie("token", token, cookieOptions)
      .send(new Response(true, "User created"));
  } catch (err) {
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

router.post("/log-in", async (req, res) => {
  try {
    const { error } = validateLoginData(req.body);
    if (error) {
      return res
        .status(400)
        .send(new Response(false, error.details[0].message));
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .send(new Response(false, "Invalid email or password"));
    }

    const checkPassword = await bcrypt.compare(password, user.password);

    if (!checkPassword) {
      return res
        .status(400)
        .send(new Response(false, "Invalid email or password"));
    }

    const token = user.generateAuthToken();

    res
      .status(201)
      .cookie("token", token, cookieOptions)
      .send(new Response(true, "Login success"));
  } catch (err) {
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

export default router;
