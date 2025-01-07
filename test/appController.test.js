const appController = require("../controllers/appController");

describe("appController", () => {
    describe("Render methods", () => {
        it("should render the home view correctly", () => {
            const res = { render: jest.fn() };

            appController.renderHome(null, res);

            expect(res.render).toHaveBeenCalledWith("../views/login", {
                title: "Login",
                viewScript: "login.js",
                viewStyle: "login.css",
            });
        });

        it("should render the dashboard view correctly", () => {
            const res = { render: jest.fn() };

            appController.renderDashboard(null, res);

            expect(res.render).toHaveBeenCalledWith("../views/dashboard", {
                title: "Dashboard",
                viewScript: "dashboard.js",
                viewStyle: "dashboard.css",
            });
        });

        it("should render the my-posts view correctly", () => {
            const res = { render: jest.fn() };

            appController.renderMyPosts(null, res);

            expect(res.render).toHaveBeenCalledWith("../views/my-posts", {
                title: "My Posts",
                viewScript: "my-posts.js",
                viewStyle: "my-post.css",
            });
        });

        it("should render the login view correctly", () => {
            const res = { render: jest.fn() };

            appController.renderLogin(null, res);

            expect(res.render).toHaveBeenCalledWith("../views/login", {
                title: "Login",
                viewScript: "login.js",
                viewStyle: "login.css",
            });
        });

        it("should render the register view correctly", () => {
            const res = { render: jest.fn() };

            appController.renderRegister(null, res);

            expect(res.render).toHaveBeenCalledWith("../views/register", {
                title: "Register",
                viewScript: "register.js",
                viewStyle: "register.css",
            });
        });

        it("should render the account view correctly", () => {
            const res = { render: jest.fn() };

            appController.renderAccount(null, res);

            expect(res.render).toHaveBeenCalledWith("../views/account", {
                title: "Account",
                viewScript: "account.js",
                viewStyle: "account.css",
            });
        });
    });

    describe("Error handling methods", () => {
        it("should handle 404 errors", () => {
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };

            appController.handle404(null, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith("Sorry can't find that!");
        });

        it("should handle server errors", () => {
            const err = new Error("Test error");
            const res = {
                status: jest.fn().mockReturnThis(),
                send: jest.fn(),
            };

            appController.handleError(err, null, res, null);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith("Something broke!");
        });
    });
});
