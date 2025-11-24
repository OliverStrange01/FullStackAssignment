const auctionController = require("../controllers/core.server.controllers");
const isAuthenticated = require("../lib/authentication");

module.exports = function(app) {

    app.route("/item")
        .post(isAuthenticated, auctionController.create_item) // 401 if not logged in
        .get(auctionController.search); // optional: search all items

    // GET ITEM DETAILS
    app.route("/item/:item_id")
        .get(auctionController.get_item_details);

    // BID ON ITEM
    app.route("/item/:item_id/bid")
        .get(auctionController.bid_history) // show bid history
        .post(isAuthenticated, auctionController.bid_on_item); // place bid
};