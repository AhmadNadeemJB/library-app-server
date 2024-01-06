const Joi = require("joi");

module.exports.registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .email({ tlds: { allow: true } })
    .required()
    .messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .min(8)
    .max(30)
    .regex(/^(?=.*[a-z])/)
    .message("Password should contain at least one lowercase letter")
    .regex(/^(?=.*[A-Z])/)
    .message("Password should contain at least one uppercase letter")
    .regex(/^(?=.*\d)/)
    .message("Password should contain at least one number")
    .required()
    .messages({
      "string.min": "Password must be at least {#limit} characters long",
      "string.max": "Password must be at most {#limit} characters long",
      "any.required": "Password is required",
    }),

  username: Joi.string()
    .min(3)
    .max(40)
    .trim()
    .regex(/^([^\s]+)\s+([^\s]+)(\s+[^\s]+)*$/)
    .message("Full Name must contain at least two words")
    .required()
    .messages({
      "any.required": "Full Name is required",
    }),
});

module.exports.updateSchema = Joi.object({
  email: Joi.string()
    .email()
    .trim()
    .email({ tlds: { allow: true } })
    .messages({
      "string.email": "Invalid email format",
    }),

  newPassword: Joi.string()
    .min(8)
    .max(30)
    .regex(/^(?=.*[a-z])/)
    .message("Password should contain at least one lowercase letter")
    .regex(/^(?=.*[A-Z])/)
    .message("Password should contain at least one uppercase letter")
    .regex(/^(?=.*\d)/)
    .message("Password should contain at least one number")
    .messages({
      "string.min": "Password must be at least {#limit} characters long",
      "string.max": "Password must be at most {#limit} characters long",
    }),

  username: Joi.string()
    .min(3)
    .max(40)
    .trim()
    .regex(/^([^\s]+)\s+([^\s]+)(\s+[^\s]+)*$/)
    .message("Full Name must contain at least two words"),
  currentPassword: Joi.string()
    .min(8)
    .message("Incorrect current password")
    .max(30)
    .message("Incorrect current password")
    .required()
    .messages({ "any.required": "Current Password is required" }),
});

module.exports.loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .trim()
    .email({ tlds: { allow: true } })
    .required()
    .messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .min(8)
    .message("Incorrect Password")
    .max(30)
    .message("Incorrect Password")
    .required()
    .messages({
      "any.required": "Password is required",
    }),
});
