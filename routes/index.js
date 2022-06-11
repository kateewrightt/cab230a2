var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secretKey = "SUPER SECRET KEY DO NOT STEAL";
const middleware = require("./middleware");

router.get("/countries", function (req, res, next) {
  req.db
    .from("data")
    .select("country")

      res.status(500).json({
        error: true,
        message: "Error in MySQL query",
      });
    });
});

router.get("/volcanoes", function (req, res, next) {
  const validQuery = ["country", "populatedWithin", undefined];
  const country = req.query.country;
  const populatedWithin = req.query.populatedWithin;
  const validPop = [
    "population_undefined",
    "population_5km",
    "population_10km",
    "population_30km",
    "population_100km",
  ];
  const popVal = "population_" + populatedWithin;

  if (
    Object.keys(req.query).length > 2 ||
    Object.keys(req.query).length < 1 ||
    !validPop.includes(popVal) ||
    !validQuery.includes(Object.keys(req.query)[0]) ||
    !validQuery.includes(Object.keys(req.query)[1])
  ) {
    res.status(400).json({
      error: true,
      message:
        "Invalid query parameters. Only country and populatedWithin are permitted.",
    });
  } else if (popVal === "population_undefined") {
    req.db
      .from("data")
      .select("id", "name", "country", "region", "subregion")
      .where("country", "=", country)
      //.where("populatedWithinSearch", ">", 0)
      .then((rows) => {
        res.status(200).json(rows);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: true,
          message: "Error in MySQL query",
        });
      });
  } else {
    req.db
      .from("data")
      .select("id", "name", "country", "region", "subregion")
      .where("country", "=", country)
      .where(popVal, ">", 0)
      //.where("populatedWithinSearch", ">", 0)
      .then((rows) => {
        {
          res.status(200).json(rows);
        }
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: true,
          message: "Error in MySQL query",
        });
      });
  }
});

router.get("/volcano/:id", middleware.authorize, function (req, res, next) {
  const id = req.params.id;
  const auth = req.headers.authorization;
  var userEmail = "";

  if (!auth || auth.split(" ").length !== 2 || typeof auth === "undefined") {
    userEmail = "";
  } else {
    const token = auth.split(" ")[1];
    userEmail = middleware.parseJwt(token);
  }

  if (Object.keys(req.params).length !== 1) {
    res.status(404).json({
      error: true,
      message:
        "Invalid query parameters. Only country and populatedWithin are permitted.",
    });
  } else if (userEmail === "") {
    req.db
      .from("data")
      .select(
        "id",
        "name",
        "country",
        "region",
        "subregion",
        "last_eruption",
        "summit",
        "elevation",
        "latitude",
        "longitude"
      )
      .where("id", "=", id)
      .then((rows) => {
        if (rows.length === 0) {
          res.status(404).json({
            error: true,
            message: "Volcano with ID: " + id + " not found.",
          });
        }
        res.status(200).json(rows[0]);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: true,
          message: "Error in MySQL query",
        });
      });
  } else {
    req.db
      .from("data")
      .select(
        "id",
        "name",
        "country",
        "region",
        "subregion",
        "last_eruption",
        "summit",
        "elevation",
        "latitude",
        "longitude",
        "population_5km",
        "population_10km",
        "population_30km",
        "population_100km"
      )
      .where("id", "=", id)
      .then((rows) => {
        if (rows.length === 0) {
          res.status(404).json({
            error: true,
            message: "Volcano with ID: " + id + " not found.",
          });
        }
        res.status(200).json(rows[0]);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: true,
          message: "Error in MySQL query",
        });
      });
  }
});

router.get("/me", function (req, res, next) {
  res.status(200).json({
    name: "Kate Wright",
    student_number: "n10998349",
  });
});

module.exports = router;
