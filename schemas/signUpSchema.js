const Joi = require("joi");

const strongPasswordRegex =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;

const SignUpSchema = Joi.object({
  firstName: Joi.string().alphanum().required().messages({
    "string.base": "nickname should be a type of text",
    "string.empty": "nickname cannot be an empty field",
    "any.required": "nickname is a required field",
  }),
  password: Joi.string().pattern(new RegExp(strongPasswordRegex)).messages({
    "string.pattern.base":
      "Password must be strong. At least one upper case alphabet. At least one lower case alphabet. At least one digit. At least one special character. Minimum eight in length",
  }),
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.email": "Email must be a valid email",
      "any.required": "Email is a required field",
    }),
  lastName: Joi.string().required().messages({
    "string.base": "Fullname should be a type of text",
    "string.empty": "Fullname cannot be an empty field",
    "any.required": "Fullname is a required field",
  }),
  provider: Joi.string().messages({
    "string.base": "provider should be a type of text",
  }),
  phone: Joi.string()
    .allow("")
    .pattern(new RegExp("^([0|+[0-9]{1,5})?([0-9]{10})$"))
    .messages({
      "string.pattern.base":
        "Phone number must be a valid number and start with country code",
    }),
});

module.exports = SignUpSchema;
