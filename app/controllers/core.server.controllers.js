const Joi = require('joi');
const auctionModel = require('../models/core.server.models');

// CREATE ITEM
const create_item = (req, res) => {

    console.log("Incoming request body:", req.body);

    const schema = Joi.object({
        name: Joi.string().min(1).max(255).required(),
        description: Joi.string().max(2000).required(),
        starting_bid: Joi.number().min(0).required(),
        start_date: Joi.date().default(Date.now),
        end_date: Joi.date().greater(Joi.ref('start_date')).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error_message: error.details[0].message });

    const data = {
        ...value,
        creator_id: req.userId   // important fix
    };

    auctionModel.createItem(data, (err, itemId) => {
        if (err) return res.sendStatus(500);
        return res.status(201).json({ item_id: itemId });
    });
};
// BID ON ITEM
const bid_on_item = (req, res) => {
    const schema = Joi.object({ amount: Joi.number().min(0).required() });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error_message: error.details[0].message });

    const data = {
        amount: value.amount,
        item_id: parseInt(req.params.item_id),
        bidder_id: req.userId
    };

    auctionModel.bidOnItem(data, (err, bidId) => {
        if (err) {
            if (err.message) return res.status(400).json({ error_message: err.message });
            return res.sendStatus(500);
        }
        return res.status(201).json({ bid_id: bidId });
    });
};

// GET ITEM DETAILS
const get_item_details = (req, res) => {
    auctionModel.getItemDetails(parseInt(req.params.item_id), (err, item) => {
        if (err) return res.sendStatus(500);
        if (!item) return res.sendStatus(404);
        return res.status(200).json(item);
    });
};

// SEARCH ITEMS
const search = (req, res) => {
    const query = req.query.q || '';
    auctionModel.searchItems(query, (err, items) => {
        if (err) return res.sendStatus(500);
        return res.status(200).json(items);
    });
};

// GET BID HISTORY
const bid_history = (req, res) => {
    auctionModel.getBidHistory(parseInt(req.params.item_id), (err, bids) => {
        if (err) return res.sendStatus(500);
        return res.status(200).json(bids);
    });
};

module.exports = {
    create_item: create_item,
    bid_on_item: bid_on_item,
    get_item_details: get_item_details,
    search: search,
    bid_history: bid_history
}