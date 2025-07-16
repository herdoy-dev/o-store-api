import Joi from "joi";
import mongoose from "mongoose";

// Define the Contact schema
const contactSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      minLength: 1,
      maxLength: 255,
      required: true,
    },
    lastName: {
      type: String,
      minLength: 1,
      maxLength: 255,
      required: true,
    },
    email: {
      type: String,
      minLength: 5,
      maxLength: 255,
      required: true,
    },
    message: {
      type: String,
      minLength: 20,
      maxLength: 10000,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create the Contact model
export const Contact = mongoose.model("Contact", contactSchema);

// Define the Joi validation schema for a contact
export const validateContact = (contact) => {
  const schema = Joi.object({
    firstName: Joi.string().min(1).max(255).required().label("First Name"),
    lastName: Joi.string().min(1).max(255).required().label("Last Name"),
    email: Joi.string().min(5).max(255).email().required().label("Email"),
    message: Joi.string().min(20).max(10000).required().label("Message"),
  });

  return schema.validate(contact);
};
