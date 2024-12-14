const appController = {
  renderHome: (_, res) => {
    res.render("../views/dashboard", {
      title: "Dashboard",
      viewScript: "dashboard.js",
      viewStyle: "dashboard.css",
    });
  },

  renderDashboard: (_, res) => {
    res.render("../views/dashboard", {
      title: "Dashboard",
      viewScript: "dashboard.js",
      viewStyle: "dashboard.css",
    });
  },

  renderLogin: (_, res) => {
    res.render("../views/login", {
      title: "Login",
      viewScript: "login.js",
      viewStyle: "login.css",
    });
  },

  renderRegister: (_, res) => {
    res.render("../views/register", {
      title: "Register",
      viewScript: "register.js",
      viewStyle: "register.css",
    });
  },

  handleError: (err, _, res, __) => {
    console.error(err.stack);
    res.status(500).send("Something broke!");
  },

  handle404: (_, res) => {
    res.status(404).send("Sorry can't find that!");
  },
};

module.exports = appController;
