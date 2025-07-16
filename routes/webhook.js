import express from "express";
import stripe from "../lib/stripe.js";
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";

const router = express.Router();

router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const transactionId = session.metadata?.transactionId;
        const orderId = session.metadata?.orderId;

        await Transaction.findByIdAndUpdate(transactionId, {
          status: "completed",
          gatewayRef: session.id,
        });

        await Order.findByIdAndUpdate(orderId, { paymentStatus: "paid" });
      }

      res.status(200).send();
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

export default router;
