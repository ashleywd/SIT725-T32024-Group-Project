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

  handleError: (err, _, res, __) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  },

  handle404: (_, res) => {
    res.status(404).send("Sorry can't find that!");
  },
};

module.exports = controller;
