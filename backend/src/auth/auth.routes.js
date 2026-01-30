const express = require("express");
const router = express.Router();
const { login } = require("./auth.controller");

router.post("/login", login);

router.get("/login", (req, res) => {
    res.send("Login route working. Use POST with email.");
});

module.exports = router;
