const bcrypt = require("bcryptjs");
const passport = require("passport");
const User = require("../models/User");

function showRegister(req, res) {
  res.render("register", { title: "Реєстрація", error: null });
}

async function register(req, res, next) {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").toLowerCase().trim();
    const password = String(req.body.password || "");

    if (!name || !email || password.length < 8) {
      return res.status(400).render("register", {
        title: "Реєстрація",
        error: "Вкажіть ім’я, email і пароль щонайменше з 8 символів."
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).render("register", {
        title: "Реєстрація",
        error: "Користувач з таким email уже існує."
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    req.login(user, (error) => {
      if (error) return next(error);
      return res.redirect("/users");
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).render("register", {
        title: "Реєстрація",
        error: "Користувач з таким email уже існує."
      });
    }
    next(error);
  }
}

function showLogin(req, res) {
  res.render("login", { title: "Вхід", error: null });
}

function login(req, res, next) {
  passport.authenticate("local", (error, user, info) => {
    if (error) return next(error);
    if (!user) {
      return res.status(401).render("login", {
        title: "Вхід",
        error: (info && info.message) || "Не вдалося увійти."
      });
    }
    req.logIn(user, (loginError) => {
      if (loginError) return next(loginError);
      res.redirect("/users");
    });
  })(req, res, next);
}

function logout(req, res, next) {
  req.logout((error) => {
    if (error) return next(error);
    req.session.destroy((sessionError) => {
      if (sessionError) return next(sessionError);
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
}

module.exports = { showRegister, register, showLogin, login, logout };
