const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
    res.json({ message: "API Routes working!" });
});

module.exports = router;