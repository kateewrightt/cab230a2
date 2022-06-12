var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secretKey = "SUPER SECRET KEY DO NOT STEAL";
const middleware = require("../middleware/middleware.js");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

router.post("/register", function (req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required",
    });
    return;
  }
  if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
    res.status(400).json({
      error: true,
      message: "Invalid format email address",
    });
    return;
  }

  req.db
    .from("users")
    .select("*")
    .where({ email })
    .then((users) => {
      if (users.length > 0) {
        res.status(409).json({
          error: true,
          message: "User already exists",
        });
        return;
      }

      const hash = bcrypt.hashSync(password, 10);
      req.db
        .from("Users")
        .insert({ email, hash })
        .then(() => {
          res.status(201).json({
            message: "User created",
          });
        })
        .catch((err) => {
          console.log(err);
          res.status(500).json({
            error: true,
            message: "Error in MySQL query",
          });
        });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: true,
        message: "Error in MySQL query",
      });
    });
});

router.post("/login", function (req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required",
    });
    return;
  }
  req.db
    .from("users")
    .select("*")
    .where({ email })
    .then((users) => {
      if (users.length === 0) {
        res.status(401).json({
          error: true,
          message: "User not registered",
        });
        return;
      }

      const { hash } = users[0];

      if (!bcrypt.compareSync(password, hash)) {
        res.status(401).json({
          error: true,
          message: "Incorrect password",
        });
        return;
      }
      const expires_in = 60 * 60 * 24;

      const exp = Date.now() + expires_in * 1000;
      const token = jwt.sign({ email, exp }, secretKey);

      res.status(200).json({
        token,
        token_type: "Bearer",
        expires_in,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: true,
        message: "Error in MySQL query",
      });
    });
});

router.get("/:email/profile", middleware.authorize, function (req, res, next) {
  const email = req.params.email;
  const auth = req.headers.authorization;
  var userEmail = "";

  if (!auth || auth.split(" ").length !== 2 || typeof auth === "undefined") {
    userEmail = "";
  } else {
    const token = auth.split(" ")[1];
    userEmail = middleware.parseJwt(token);
  }

  if (email === userEmail) {
    req.db
      .from("users")
      .select("email", "firstName", "lastName", "dob", "address")
      .where("email", "=", email)
      .then((rows) => {
        if (rows.length === 0) {
          res.status(404).json({
            error: true,
            message: "User not found",
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
      .from("users")
      .select("email", "firstName", "lastName")
      .where("email", "=", email)
      .then((rows) => {
        if (rows.length === 0) {
          res.status(404).json({
            error: true,
            message: "User not found",
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

function dateCheck(dob) {
  let isLeap = false;
  const date = dob.split("-");
  const yyyy = date[0];
  const mm = date[1];
  const dd = date[2];

  const y = parseInt(yyyy);
  const m = parseInt(mm);
  const d = parseInt(dd);

  if (y % 4 === 0 && y % 100 !== 0 && y % 400 === 0) {
    isLeap = true;
  } else {
    isLeap = false;
  }
  if (m === 2) {
    if (isLeap) {
      if (d > 29) {
        return false;
      }
    } else {
      if (d > 28) {
        return false;
      }
    }
  } else if (m === 4 || m === 6 || m === 9 || m === 11) {
    if (d > 30) {
      return false;
    }
  }
  return true;
}

router.put("/:email/profile", middleware.authorize, function (req, res, next) {
  const email = req.params.email;
  const { firstName, lastName, dob, address } = req.body;
  const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;

  let today = new Date();
  const dd = String(today.getDate()).padStart(2, "0");
  const mm = String(today.getMonth() + 1).padStart(2, "0"); //January is 0!
  const yyyy = today.getFullYear();
  today = yyyy + "-" + mm + "-" + dd;

  const auth = req.headers.authorization;
  var userEmail = "";

  if (
    typeof firstName == "undefined" ||
    typeof lastName === "undefined" ||
    typeof dob === "undefined" ||
    typeof address === "undefined"
  ) {
    res.status(400).json({
      error: true,
      message:
        "Request body incomplete: firstName, lastName, dob and address are required.",
    });
  } else if (
    typeof firstName !== "string" ||
    typeof lastName !== "string" ||
    typeof dob !== "string" ||
    typeof address !== "string"
  ) {
    res.status(400).json({
      error: true,
      message:
        "Request body invalid: firstName, lastName and address must be strings only.",
    });
  } else if (dob.match(dateRegex) === null) {
    res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
    });
  } else if (dob > today) {
    res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a date in the past.",
    });
  } else if (!dateCheck(dob)) {
    res.status(400).json({
      error: true,
      message: "Invalid input: dob must be a real date in format YYYY-MM-DD.",
    });
  } else if (
    !auth ||
    auth.split(" ").length !== 2 ||
    typeof auth === "undefined"
  ) {
    userEmail = "";
  } else {
    const token = auth.split(" ")[1];
    userEmail = middleware.parseJwt(token);
  }

  if (email === userEmail) {
    req.db
      .from("Users")
      .where("email", "=", email)
      .update({
        firstName: firstName,
        lastname: lastName,
        dob: dob,
        address: address,
      })
      .then((rows) => {
        res.status(200).json({
          email: email,
          firstName: firstName,
          lastName: lastName,
          dob: dob,
          address: address,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: true,
          message: "Error in MySQL query",
        });
      });
  } else if (userEmail === "") {
    res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    });
  } else {
    res.status(403).json({
      error: true,
      message: "Forbidden",
    });
  }
});

module.exports = router;
