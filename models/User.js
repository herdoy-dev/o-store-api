import Joi from "joi";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
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
    image: {
      type: String,
      minLength: 5,
      maxLength: 1000,
      default: "https://i.ibb.co/pBFLMc0m/placeholder.jpg",
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
    email: {
      type: String,
      minLength: 5,
      maxLength: 255,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      minLength: 8,
      maxLength: 1000,
      required: true,
    },
  },
  { timestamps: true }
);

UserSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      image: this.image,
    },
    process.env.JWT_PRIVATE_KEY
  );
  return token;
};

const validateUser = (user) => {
  const passwordComplexity = (value, helpers) => {
    if (!/[A-Z]/.test(value)) {
      return helpers.message(
        "Password must contain at least one uppercase letter"
      );
    }
    if (!/[a-z]/.test(value)) {
      return helpers.message(
        "Password must contain at least one lowercase letter"
      );
    }
    if (!/[0-9]/.test(value)) {
      return helpers.message("Password must contain at least one number");
    }
    if (!/[^A-Za-z0-9]/.test(value)) {
      return helpers.message(
        "Password must contain at least one special character"
      );
    }
    return value;
  };
  const schema = Joi.object({
    firstName: Joi.string()
      .min(1)
      .max(255)
      .regex(/^[a-zA-Z]+$/)
      .required()
      .messages({
        "string.empty": "First name is required and cannot be empty",
        "string.min": "First name is required and cannot be empty",
        "string.max": "First name cannot exceed 255 characters",
        "string.pattern.base": "First name can only contain letters",
      }),
    lastName: Joi.string()
      .min(1)
      .max(255)
      .regex(/^[a-zA-Z]+$/)
      .required()
      .messages({
        "string.empty": "Last name is required and cannot be empty",
        "string.min": "Last name is required and cannot be empty",
        "string.max": "Last name cannot exceed 255 characters",
        "string.pattern.base": "Last name can only contain letters",
      }),
    image: Joi.string().uri().max(1000).optional().messages({
      "string.uri": "Image must be a valid URL",
      "string.max": "Image URL cannot exceed 1000 characters",
    }),
    email: Joi.string().min(5).max(255).required().email().messages({
      "string.min": "Email must be at least 5 characters long",
      "string.max": "Email cannot exceed 255 characters",
      "string.email": "Please provide a valid email address",
      "string.empty": "Email is required and cannot be empty",
    }),
    password: Joi.string()
      .min(8)
      .max(1000)
      .required()
      .custom(passwordComplexity)
      .messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 8 characters long",
        "string.max": "Password cannot exceed 1000 characters",
      }),
  });

  return schema.validate(user);
};

const validateLoginData = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email().messages({
      "string.min": "Email must be at least 5 characters long",
      "string.max": "Email cannot exceed 255 characters",
      "string.email": "Please provide a valid email address",
    }),
    password: Joi.string().min(8).max(100).required().messages({
      "string.min": "Password must be at least 8 characters long",
      "string.max": "Password cannot exceed 100 characters",
    }),
  });

  return schema.validate(data);
};

const User = mongoose.model("User", UserSchema);

export { User, validateLoginData, validateUser };
