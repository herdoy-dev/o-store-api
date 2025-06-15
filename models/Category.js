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
  },
  { timestamps: true }
);

const validateCategory = (category) => {
  const schema = Joi.object({
    name: Joi.string().min(1).max(255).required().messages({
      "string.empty": "Category name is required and cannot be empty",
      "string.min": "Category name is required and cannot be empty",
      "string.max": "Category name cannot exceed 255 characters",
    }),
  });
  return schema.validate(category);
};

const Category = mongoose.model("Category", CategorySchema);

export { Category, validateCategory };
