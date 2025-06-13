import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import logger from "./logger/logger.js";
import auth from "./routes/auth.js";

dotenv.config();
const app = express();
app.use(
  cors({
    origin: process.env.ORIGIN,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", auth);

const port = process.env.PORT || 7000;

app.listen(port, () => logger.info(`Listening on port ${port}...`));

mongoose
  .connect(process.env.DB_URL)
  .then(() => logger.info("Connected to database..."))
  .catch((err) => logger.error(err));
