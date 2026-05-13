const { z } = require("zod");

const validateSignUpData = z.object({
  firstName: z
    .string()
    .trim()
    .min(3, "First name must be at least 3 characters")
    .max(50, "First name cannot exceed 50 characters"),

  lastName: z
    .string()
    .trim()
    .min(3, "Last name must be at least 3 characters")
    .max(50, "Last name cannot exceed 50 characters"),

  email: z.string().trim().toLowerCase().email("Invalid email address"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      "Password must contain uppercase, lowercase, number and special character",
    ),
});

const validateEditProfileData = z.object({
  firstName: z
    .string()
    .min(3, "First name must be at least 3 characters")
    .max(50, "First name cannot exceed 50 characters")
    .optional(),

  lastName: z
    .string()
    .min(3, "Last name must be at least 3 characters")
    .max(50, "Last name cannot exceed 50 characters")
    .optional(),

  age: z.number().min(13, "Age must be at least 13").optional(),

  gender: z
    .enum(["male", "female", "others"], {
      message: "Invalid gender type",
    })
    .optional(),

  photoUrl: z.url("Invalid photo URL").optional(),

  about: z.string().max(500, "About cannot exceed 500 characters").optional(),

  interest: z.array(z.string()).optional(),

  city: z.string().max(100, "City name too long").optional(),

  country: z.string().max(100, "Country name too long").optional(),
});

module.exports = {
  validateSignUpData,
  validateEditProfileData,
};
