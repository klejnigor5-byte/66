const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const { listUsers, showUser } = require("../controllers/userController");

const router = express.Router();

// Reading user records is available only to authenticated users.
router.get("/", requireAuth, listUsers);
router.get("/:userId", requireAuth, showUser);

module.exports = router;
