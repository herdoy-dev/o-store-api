import mongoose from "mongoose";
import Joi from "joi";

const AddressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
      maxlength: [255, "Street address cannot exceed 255 characters"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      maxlength: [100, "City name cannot exceed 100 characters"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      maxlength: [100, "State name cannot exceed 100 characters"],
    },
    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
      maxlength: [20, "Postal code cannot exceed 20 characters"],
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
      maxlength: [100, "Country name cannot exceed 100 characters"],
    },
  },
  {
    timestamps: true,
  }
);

const validateAddress = (address) => {
  const schema = Joi.object({
    street: Joi.string().max(255).required().messages({
      "string.empty": "Street address is required",
      "string.max": "Street address cannot exceed 255 characters",
      "any.required": "Street address is required",
    }),
    city: Joi.string().max(100).required().messages({
      "string.empty": "City is required",
      "string.max": "City name cannot exceed 100 characters",
      "any.required": "City is required",
    }),
    state: Joi.string().max(100).required().messages({
      "string.empty": "State is required",
      "string.max": "State name cannot exceed 100 characters",
      "any.required": "State is required",
    }),
    postalCode: Joi.string().max(20).required().messages({
      "string.empty": "Postal code is required",
      "string.max": "Postal code cannot exceed 20 characters",
      "any.required": "Postal code is required",
    }),
    country: Joi.string().max(100).required().messages({
      "string.empty": "Country is required",
      "string.max": "Country name cannot exceed 100 characters",
      "any.required": "Country is required",
    }),
  });

  return schema.validate(address, { abortEarly: false });
};

const Address = mongoose.model("Address", AddressSchema);

export { Address, validateAddress };
