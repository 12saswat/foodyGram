const express = require("express");
const connectToDb = require("./src/config/connectToDb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const cookieParser = require("cookie-parser");
const userRouter = require("./src/routes/user.route");
const resturantsRouter = require("./src/routes/resturant.route");
const itemsRouter = require("./src/routes/items.route");
const orderRouter = require("./src/routes/order.route");
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173", // local dev
  "https://foody-gram-f.vercel.app", // production frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps or curl)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // ✅ needed for cookies
  })
);

connectToDb();

app.use("/api/v1/user", userRouter);

app.use("/api/v1/resturants", resturantsRouter);

app.use("/api/v1/items", itemsRouter);

app.use("/api/v1/orders", orderRouter);

app.listen(port, () =>
  console.log("> Server is up and running on port : " + port)
);
