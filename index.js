import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "./logger/logger.js";

dotenv.config();
const app = express();

const port = process.env.PORT || 7000;

app.listen(port, () => logger.info(`Listening on port ${port}...`));

mongoose
  .connect(process.env.DB_URL)
  .then(() => logger.info("Connected to database..."))
  .catch((err) => logger.error(err));
