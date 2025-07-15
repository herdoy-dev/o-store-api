import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import logger from "./logger/logger.js";
import addresses from "./routes/addresses.js";
import auth from "./routes/auth.js";
import categorys from "./routes/categorys.js";
import orders from "./routes/orders.js";
import products from "./routes/products.js";

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
app.use("/api/categorys", categorys);
app.use("/api/products", products);
app.use("/api/addresses", addresses);
app.use("/api/orders", orders);

const port = process.env.PORT || 7000;

app.listen(port, () => logger.info(`Listening on port ${port}...`));

mongoose
  .connect(process.env.DB_URL)
  .then(() => logger.info("Connected to database..."))
  .catch((err) => logger.error(err));
