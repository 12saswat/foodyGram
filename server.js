const express = require("express");
const connectToDb = require("./src/config/connectToDb");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const cookieParser = require("cookie-parser");
const userRouter = require("./src/routes/user.route");
const resturantsRouter = require("./src/routes/resturant.route");
const itemsRouter = require("./src/routes/items.route");
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
connectToDb();

app.use("/api/v1/user", userRouter);

app.use("/api/v1/resturants", resturantsRouter);

app.use("/api/v1/items", itemsRouter);

app.listen(port, () =>
  console.log("> Server is up and running on port : " + port)
);
