import Joi from "joi";

export const signupValidation = Joi.object({
  body: Joi.object({
    firstName: Joi.string()
      .min(3)
      .messages({
        "string.min": "firstName should be at least 3 character",
        "any.required": "firstName is required",
      })
      .required(),
    lastName: Joi.string()
      .min(3)
      .messages({
        "string.min": "lastName should be at least 3 character",
        "any.required": "lastName is required",
      })
      .required(),
    email: Joi.string()
      .email()
      .messages({
        "string.email": "invalid email format",
        "any.required": "email is required",
      })
      .required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
      .required()
      .messages({
        "any.required": "password is required",
        "string.pattern.base":
          "Password must contain at least 1 uppercase, 1 lowercase and 1 number",
        "string.min": "Password should be more than 8 character",
      }),
    cPassword: Joi.string().valid(Joi.ref("password")).required().messages({
      "any.only": "Confirm password must match password",
      "any.required": "confirm password is required"
    }),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{7,14}$/)
      .messages({ "string.pattern.base": "invalid phone number" }),
  }).required(),
});
//////////////////////////////////////////////////////
//////////////////////      /////////////////////////
/////////////////////      /////////////////////////
////////////////////      /////////////////////////
///////////////////      /////////////////////////
/////////////////////////////////////////////////

export const confirmEmailValidation = Joi.object({
  body: Joi.object({
    email: Joi.string()
      .email()
      .messages({ "string.email": "invalid email format" })
      .required(),
    otp: Joi.string().length(6).required().messages({
      "string.length": "invalid otp ",
    }),
  }).required(),
});

export const loginValidation = Joi.object({
  body: Joi.object({
    email: Joi.string()
      .email()
      .messages({ "string.email": "invalid email format" })
      .required(),
    password: Joi.string().required(),
  }).required(),
});
export const googleSigninValidation = Joi.object({
  body: Joi.object({
    idToken: Joi.string().required(),
  }),
});
