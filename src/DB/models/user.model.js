import { model, Schema } from 'mongoose';
import {
  provider,
  hashSecurity,
  asymmetric,
  ApiError,
  authEnum,
} from '../../utils/index.js';
import jwt from 'jsonwebtoken';
import { env } from '../../config/index.js';
const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'invalid email format',
      ],
    },

    password: {
      type: String,
      required: function () {
        return this.provider == provider.sys;
      },
      minLength: [8, 'password length should be more than 8'],
      validate: {
        validator: function (val) {
          const checkPasswordFormat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
          return checkPasswordFormat.test(val);
        },
        message:
          'password must include uppercase, lowercase letters and a number',
      },
    },
    phone: {
      type: String,
      match: [
        /^\+?[1-9]\d{7,14}$/,
        // /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
        'invalid phone number',
      ],
    },
    provider: {
      type: String,
      enum: Object.values(provider),
      default: provider.sys,
    },
    isConfirmed: {
      type: Boolean,
      enum: [true],
    },
    role: {
      type: String,
      enum: Object.values(authEnum),
      default: authEnum.user,
    },
    expireAt: {
      type: Date,
    },
    profilePic: {
      type: String,
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    strictQuery: true,
  },
);
userSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
userSchema
  .virtual('fullName')
  .get(function () {
    return (this.fullName = this.firstName + ' ' + this.lastName);
  })
  .set(function (val) {
    const parts = val.split(' ');
    this.firstName = parts[0];
    this.lastName = parts.slice(1).join(' ');
  });

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const algo = 'argon';
    this.password = await hashSecurity.hash(this.password, algo);
  }
  if (this.isModified('phone')) {
    this.phone = await asymmetric.Encryption(this.phone);
  }
});
userSchema.methods.generateToken = async function () {
  const { JWT_SECRET } = env;
  const token = await jwt.sign({ id: this._id }, JWT_SECRET, {
    expiresIn: '7d',
  });
  return token;
};
const USER = model('user', userSchema);
export default USER;
