const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const resturantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    address: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String },
    role: { type: String, default: "restaurant" },
    type: { type: String, enum: ["veg", "non-veg", "both"], default: "both" },
    status: { type: String, enum: ["open", "close"], default: "open" },
    avatar: { type: String },
    rating: { type: Number, default: 0, min: 0, max: 5 }, //
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

resturantSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

resturantSchema.methods.comparePassword = function (candidatePassword) {
  console.log(candidatePassword, this.password);
  return bcrypt.compare(candidatePassword, this.password);
};

resturantSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET
  );
};

module.exports = mongoose.model("Resturant", resturantSchema);
