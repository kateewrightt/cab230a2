const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();

const options = require("./knexfile");
const knex = require("knex")(options);
const swaggerUI = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");

var volcanosRouter = require("./routes/volcanos");
var usersRouter = require("./routes/users");

var app = express();

app.use((req, res, next) => {
  req.db = knex;
  next();
});
app.use(cors());

app.use(logger("tiny"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

logger.token("res", (req, res) => {
  const headers = {};
  res.getHeaderNames().map((h) => (headers[h] = res.getHeader(h)));
  return JSON.stringify(headers);
});

app.use("/docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// contains "/countries" "/volcano" "/volcanos" routes
// in the real world we should have "/volcanos/:id" instead
app.use("/", volcanosRouter);
app.use("/user", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
