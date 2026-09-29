const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: 'Role must be user or admin',
      },
      default: 'user',
    },
    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password with hash
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Exclude password from JSON output
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

// Unique email index for login
userSchema.index({ email: 1 }, { unique: true });

// Multikey index for interests aggregation
userSchema.index({ interests: 1 });

// Default _id index supports cursor pagination (descending sort)
module.exports = mongoose.model('User', userSchema);