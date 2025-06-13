import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import * as z from "zod";

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
  const schema = z.object({
    firstName: z
      .string()
      .min(1, { message: "First name is required and cannot be empty" })
      .max(255, { message: "First name cannot exceed 255 characters" })
      .regex(/^[a-zA-Z]+$/, {
        message: "First name can only contain letters",
      }),
    lastName: z
      .string()
      .min(1, { message: "Last name is required and cannot be empty" })
      .max(255, { message: "Last name cannot exceed 255 characters" })
      .regex(/^[a-zA-Z]+$/, {
        message: "Last name can only contain letters",
      }),
    image: z
      .string()
      .url({ message: "Image must be a valid URL" })
      .max(1000, { message: "Image URL cannot exceed 1000 characters" })
      .optional(),
    email: z
      .string()
      .min(5, { message: "Email must be at least 5 characters long" })
      .max(255, { message: "Email cannot exceed 255 characters" })
      .email({ message: "Please provide a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(100, { message: "Password cannot exceed 100 characters" })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter",
      })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number" })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character",
      }),
  });

  return schema.parse(user);
};

const validateLoginData = (data) => {
  const schema = z.object({
    email: z
      .string()
      .min(5, { message: "Email must be at least 5 characters long" })
      .max(255, { message: "Email cannot exceed 255 characters" })
      .email({ message: "Please provide a valid email address" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" })
      .max(100, { message: "Password cannot exceed 100 characters" }),
  });

  return schema.parse(data);
};

const User = mongoose.model("User", UserSchema);

export { validateUser, validateLoginData, User };
