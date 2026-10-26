const express = require("express");
const { requireAuth } = require("../middleware/authMiddleware");
const controller = require("../controllers/crudController");

const router = express.Router();
// Keep all CRUD endpoints behind the existing Passport session authentication.
router.use(requireAuth);
router.get("/", controller.findRecords);
router.post("/", controller.insertOne);
router.post("/bulk", controller.insertMany);
router.patch("/bulk", controller.updateMany);
router.delete("/bulk", controller.deleteMany);
router.patch("/:id", controller.updateOne);
router.put("/:id", controller.replaceOne);
router.delete("/:id", controller.deleteOne);
module.exports = router;
