import bcrypt from "bcryptjs";
import express from "express";
import cookieOptions from "../config/cookieOptions.js";
import Response from "../lib/Response.js";
import logger from "../logger/logger.js";
import auth from "../middlewares/auth.js";
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
  } catch (error) {
    logger.error({ message: "During Sign-up", error });
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

    return res
      .status(200)
      .cookie("token", token, cookieOptions)
      .send(new Response(true, "Login success"));
  } catch (error) {
    logger.error({ message: "During Login", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

router.post("/log-out", async (req, res) => {
  try {
    res
      .status(200)
      .cookie("token", "", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 0,
      })
      .send(new Response(true, "Logout successful"));
  } catch (error) {
    logger.error({ message: "During Logout", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

router.post("/refresh-session", auth, async (req, res) => {
  try {
    const requestUser = req.user;
    const user = await User.findById(requestUser._id);

    if (!user) {
      return res.status(404).send(new Response(false, "User not found"));
    }

    const token = user.generateAuthToken();

    return res
      .status(200)
      .cookie("token", token, cookieOptions)
      .send(new Response(true, "Session refreshed"));
  } catch (error) {
    logger.error({ message: "During Session Refresh", error });
    return res.status(500).send(new Response(false, "Internal server error"));
  }
});

export default router;
