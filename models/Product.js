import Joi from "joi";
import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      minLength: 1,
      maxLength: 255,
      required: true,
    },
    thumbnail: {
      type: String,
      minLength: 5,
      maxLength: 1000,
      validate: {
        validator: (v) => {
          try {
            new URL(v);
            return true;
          } catch {
            return false;
          }
        },
        message: "Thumbnail must be a valid URL",
      },
    },
    images: [
      {
        type: String,
        minLength: 5,
        maxLength: 1000,
        validate: {
          validator: (v) => {
            try {
              new URL(v);
              return true;
            } catch {
              return false;
            }
          },
          message: "Image must be a valid URL",
        },
      },
    ],
    description: {
      type: String,
      minLength: 1,
      maxLength: 10000,
      required: true,
    },
    colors: [
      {
        name: {
          type: String,
          minLength: 3,
          maxLength: 255,
        },
        code: {
          type: String,
          min: 4,
          max: 7,
        },
      },
    ],
    sizes: [
      {
        type: String,
        enum: [
          "M",
          "L",
          "S",
          "XL",
          "XXXL",
          "XS",
          "XXL",
          "SMALL",
          "MEDIUM",
          "LARGE",
        ],
      },
    ],
    price: {
      type: Number,
      min: 1,
      max: 10000,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const validateProduct = (product) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(255).required().messages({
      "string.empty": "Product name is required and cannot be empty",
      "string.min": "Product name is required and cannot be empty",
      "string.max": "Product name cannot exceed 255 characters",
    }),
    thumbnail: Joi.string().uri().min(5).max(1000).messages({
      "string.uri": "Thumbnail must be a valid URL",
      "string.min": "Thumbnail URL must be at least 5 characters long",
      "string.max": "Thumbnail URL cannot exceed 1000 characters",
    }),
    images: Joi.array().items(
      Joi.string().uri().min(5).max(1000).messages({
        "string.uri": "Image must be a valid URL",
        "string.min": "Image URL must be at least 5 characters long",
        "string.max": "Image URL cannot exceed 1000 characters",
      })
    ),
    description: Joi.string().min(1).max(10000).required().messages({
      "string.empty": "Description is required and cannot be empty",
      "string.min": "Description is required and cannot be empty",
      "string.max": "Description cannot exceed 10000 characters",
    }),
    colors: Joi.array().items(
      Joi.object({
        name: Joi.string().min(3).max(255),
        code: Joi.string().min(4).max(7),
      })
    ),
    sizes: Joi.array().items(
      Joi.string().valid(
        "M",
        "L",
        "S",
        "XL",
        "XXXL",
        "XS",
        "XXL",
        "SMALL",
        "MEDIUM",
        "LARGE"
      )
    ),
    price: Joi.number().min(1).max(10000).required().messages({
      "number.base": "Price must be a number",
      "number.min": "Price must be at least 1",
      "number.max": "Price cannot exceed 10000",
      "any.required": "Price is required",
    }),
    category: Joi.string().required().messages({
      "string.length": "Category ID must be 24 characters long",
      "any.required": "Category is required",
    }),
  });
  return schema.validate(product);
};

const Product = mongoose.model("Product", CategorySchema);

export { Product, validateProduct };
