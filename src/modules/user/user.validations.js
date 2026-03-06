import Joi from 'joi';

export const signupValidation = Joi.object({
  body: Joi.object({
    firstName: Joi.string()
      .min(3)
      .messages({
        'string.min': 'firstName should be at least 3 character',
        'any.required': 'firstName is required',
      })
      .required(),
    lastName: Joi.string()
      .min(3)
      .messages({
        'string.min': 'lastName should be at least 3 character',
        'any.required': 'lastName is required',
      })
      .required(),
    email: Joi.string()
      .email()
      .messages({
        'string.email': 'invalid email format',
        'any.required': 'email is required',
      })
      .required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
      .required()
      .messages({
        'any.required': 'password is required',
        'string.pattern.base':
          'Password must contain at least 1 uppercase, 1 lowercase and 1 number',
        'string.min': 'Password should be more than 8 character',
      }),
    cPassword: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Confirm password must match password',
      'any.required': 'confirm password is required',
    }),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{7,14}$/)
      .messages({ 'string.pattern.base': 'invalid phone number' }),
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
      .messages({ 'string.email': 'invalid email format' })
      .required(),
    otp: Joi.string().length(6).required().messages({
      'string.length': 'invalid otp ',
    }),
  }).required(),
});

export const loginValidation = Joi.object({
  body: Joi.object({
    email: Joi.string()
      .email()
      .messages({ 'string.email': 'invalid email format' })
      .required(),
    password: Joi.string().required(),
  }).required(),
});
export const googleSigninValidation = Joi.object({
  body: Joi.object({
    idToken: Joi.string().required(),
  }).required(),
});
export const refreshTokenValidation = Joi.object({
  body: Joi.object({
    refreshToken: Joi.string().required(),
  }).required(),
});
export const uploadProfilePicValidation = Joi.object({
  file: Joi.object({
    fieldname: Joi.string().valid('profile').required().messages({
      'any.only': 'file fieldname must be profile',
      'any.required': 'file is required',
    }),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number().integer().min(1).required(),
    destination: Joi.string().required(),
    filename: Joi.string().required(),
    path: Joi.string().required(),
  })
    .required()
    .messages({
      'any.required': 'file is required',
    }),
});
export const shareProfileValidation = Joi.object({
  params: Joi.object({
    id: Joi.string().hex().length(24).required().messages({
      'string.hex': 'invalid userId',
      'string.length': 'invalid userId Length',
      'any.required': 'userid is required',
    }),
  }).required(),
});
export const updateProfileValidation = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(3).messages({
      'string.min': 'firstName should be at least 3 character',
    }),
    lastName: Joi.string().min(3).messages({
      'string.min': 'lastName should be at least 3 character',
    }),
    email: Joi.string().email().messages({
      'string.email': 'invalid email format',
    }),
    phone: Joi.string()
      .pattern(/^\+?[1-9]\d{7,14}$/)
      .messages({
        'string.pattern.base': 'invalid phone number',
      }),
  }),
});
export const updatePasswordValidation = Joi.object({
  body: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)
      .required()
      .messages({
        'any.required': 'password is required',
        'string.pattern.base':
          'Password must contain at least 1 uppercase, 1 lowercase and 1 number',
        'string.min': 'Password should be more than 8 character',
      }),
    confirmPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'confirm password must match new password',
        'any.required': 'confirm password is required',
      }),
  }).required(),
});
