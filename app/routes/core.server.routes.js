const auctionController = require("../controllers/core.server.controllers");
const isAuthenticated = require("../lib/authentication");

module.exports = function(app) {

    app.route("/items")
        .get(auctionController.search);
    

    app.route("/search")
        .get(auctionController.search);

    
    app.route("/item")
        .post(isAuthenticated, auctionController.create_item);

    
    app.route("/item/:item_id")
        .get(auctionController.get_item_details);


    app.route("/item/:item_id/bid")
        .get(auctionController.bid_history)
        .post(isAuthenticated, auctionController.bid_on_item);

};