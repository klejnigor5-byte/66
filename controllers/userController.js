const mongoose = require("mongoose");
const User = require("../models/User");

async function listUsers(req, res, next) {
  try {
    // Never return password hashes to the page.
    const users = await User.find().select("name email createdAt").sort({ createdAt: -1 }).lean();
    res.render("users/index", { title: "Користувачі", users });
  } catch (error) {
    next(error);
  }
}

async function showUser(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.userId)) {
      return res.status(400).render("error", {
        title: "Некоректний ID",
        status: 400,
        message: "Передано некоректний ID користувача."
      });
    }

    const user = await User.findById(req.params.userId)
      .select("name email createdAt")
      .lean();

    if (!user) {
      return res.status(404).render("error", {
        title: "Не знайдено",
        status: 404,
        message: "Користувача не знайдено."
      });
    }

    res.render("users/show", { title: user.name, user });
  } catch (error) {
    next(error);
  }
}

module.exports = { listUsers, showUser };
