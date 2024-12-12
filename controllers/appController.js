const path = require("path");

const controller = {
  renderHome: (_, res) => {
    res.render("../views/login");
  },

  renderDashboard: (_, res) => {
    res.render("../views/dashboard");
  },

  renderLogin: (_, res) => {
    res.render("../views/login");
  },

  renderRegister: (_, res) => {
    res.sendFile(path.join(__dirname, "../public", "register.html"));
  },

  handleError: (err, _, res) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
  },

  handle404: (_, res) => {
    res.status(404).json({ error: "Route not found" });
  },
};

module.exports = controller;
