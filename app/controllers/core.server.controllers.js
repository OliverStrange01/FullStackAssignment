const Joi = require('joi');
const auctionModel = require('../models/core.server.models');
const usersModel = require('../models/user.server.models');

const create_item = (req, res) => {
    const schema = Joi.object({
        name: Joi.string().min(1).max(255).required(),
        description: Joi.string().max(2000).required(),
        starting_bid: Joi.number().min(0).required(),
        start_date: Joi.date().default(Date.now),
        end_date: Joi.date().greater(Joi.ref('start_date')).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error_message: error.details[0].message });

    if (!req.userId) {
        return res.status(400).json({ error_message: 'You must be logged in to create an item.' });
    }

    const data = { ...value, creator_id: req.userId };

    auctionModel.createItem(data, (err, itemId) => {
        if (err) return res.status(err.status || 500).json({ error_message: err.message });
        return res.status(201).json({ item_id: itemId });
    });
};

const bid_on_item = (req, res) => {
    const schema = Joi.object({ amount: Joi.number().min(0).required() });
    const { error, value } = schema.validate(req.body);
    if (error) return res.status(400).json({ error_message: error.details[0].message });

    if (!req.userId) {
        return res.status(400).json({ error_message: 'You must be logged in to place a bid.' });
    }

    const data = {
        amount: value.amount,
        item_id: parseInt(req.params.item_id),
        bidder_id: req.userId
    };

    auctionModel.bidOnItem(data, (err, bidId) => {
        if (err) {
            return res.status(err.status || 400).json({ error_message: err.message });
        }
        return res.status(201).json({ bid_id: bidId });
    });
};


const get_item_details = (req, res) => {
    auctionModel.getItemDetails(parseInt(req.params.item_id), (err, item) => {
        if (err) return res.status(err.status || 500).json({ error_message: err.message });
        if (!item) return res.sendStatus(404);
        return res.status(200).json(item);
    });
};


const search = (req, res) => {
    const q = req.query.q || "";
    const status = req.query.status || null;
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;

    const validStatuses = ["OPEN", "BID", "ARCHIVE"];

    
    if (status && !validStatuses.includes(status)) {
        return res.sendStatus(400);
    }

    const token = req.get("X-Authorization");

    usersModel.idFromToken(token, (err, userId) => {
        if (err) return res.sendStatus(500);

        
        if ((status === "OPEN" || status === "BID") && !userId) {
            return res.sendStatus(400);
        }

        auctionModel.searchItems(
            {
                q,
                status,
                userId,
                limit,
                offset
            },
            (err, items) => {
                if (err) return res.sendStatus(500);
                return res.status(200).json(items);
            }
        );
    });
};


const bid_history = (req, res) => {
    const itemId = parseInt(req.params.item_id);

    auctionModel.getBidHistory(itemId, (err, bids) => {
        if (err) {
            return res.status(err.status || 500).json({ error_message: err.message });
        }
        return res.status(200).json(bids);
    });
};

module.exports = {
    create_item,
    bid_on_item,
    get_item_details,
    search,
    bid_history
}