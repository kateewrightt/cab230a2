var express = require("express");
var router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secretKey = "SUPER SECRET KEY DO NOT STEAL";

function parseJwt(token) {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  const payload = JSON.parse(jsonPayload);

  const payloadEmail = payload.email;
  return payloadEmail;
}

const authorize = function (req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || typeof auth === "undefined") {
    next();
  } else if (auth.split(" ").length !== 2) {
    res.status(401).json({
      error: true,
      message: "Authorization header is malformed",
    });
    return;
  } else {
    const token = auth.split(" ")[1];
    try {
      const payload = jwt.verify(token, secretKey);

      if (Date.now() > payload.exp) {
        res.status(401).json({
          error: true,
          message: "JWT token has expired",
        });
        return;
      }

      next();
    } catch (e) {
      res.status(401).json({
        error: true,
        message: "Invalid JWT token",
      });
      return;
    }
  }
};

module.exports = { parseJwt, authorize };
