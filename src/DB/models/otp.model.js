import { model, Schema, Types } from 'mongoose';
import { hashSecurity, otpTypes } from '../../utils/index.js';

const otpSchema = new Schema(
  {
    otpType: {
      type: String,
      required: true,
      enum: Object.values(otpTypes),
    },
    otp: {
      type: String,
      required: true,
    },
    userId: {
      type: Types.ObjectId,
      ref:'user',
      required: true,
    },
    expireAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    strictQuery: true,
  },
);
otpSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
otpSchema.pre('save', async function () {
  this.otp = await hashSecurity.hash(this.otp, 'bcrypt');
});
const OTP = model('otp', otpSchema);
export default OTP;
