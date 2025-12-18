
const users = require("../controllers/user.server.controllers")
const isAuthenticated = require('../lib/authentication')

module.exports = function(app) {
    app.route("/users")
        .post(users.create_account);

    app.route("/login")
        .post(users.login);

    app.route("/logout")
        .post(isAuthenticated, users.logout);

    app.route("/users/:user_id")
        .get(users.getUserDetails)
}

