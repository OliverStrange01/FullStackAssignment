const db = require('../../database');

// CREATE ITEM
const createItem = (data, done) => {
    const sql = `
        INSERT INTO items (name, description, starting_bid, start_date, end_date, creator_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.run(sql, [
        data.name,
        data.description,
        data.starting_bid,
        data.start_date,
        data.end_date,
        data.creator_id
    ], function(err) {
        if (err) return done({ status: 500, message: err.message });
        return done(null, this.lastID);
    });
};

// BID ON ITEM
const bidOnItem = (data, done) => {
    const sqlGetItem = `SELECT creator_id, starting_bid FROM items WHERE item_id = ?`;
    db.get(sqlGetItem, [data.item_id], (err, item) => {
        if (err) return done({ status: 500, message: err.message });
        if (!item) return done({ status: 404, message: 'Item not found' });

        if (item.creator_id === data.bidder_id) {
            return done({ status: 403, message: 'Cannot bid on your own item' });
        }

        const sqlGetHighest = `
            SELECT amount FROM bids WHERE item_id = ? ORDER BY amount DESC LIMIT 1
        `;
        db.get(sqlGetHighest, [data.item_id], (err, row) => {
            if (err) return done({ status: 500, message: err.message });

            const highest = row ? row.amount : item.starting_bid;

            if (data.amount <= highest) {
                return done({ status: 400, message: 'Bid must be higher than the current highest bid.' });
            }

            const sqlInsert = `
                INSERT INTO bids (item_id, bidder_id, amount, bid_time)
                VALUES (?, ?, ?, ?)
            `;
            db.run(sqlInsert, [
                data.item_id,
                data.bidder_id,
                data.amount,
                Date.now()
            ], function(err) {
                if (err) return done({ status: 500, message: err.message });
                return done(null, this.lastID);
            });
        });
    });
};

// GET ITEM DETAILS
const getItemDetails = (itemId, done) => {
    const sql = `
        SELECT i.item_id, i.name, i.description, i.starting_bid, i.start_date, i.end_date, i.creator_id,
               MAX(b.amount) as highest_bid
        FROM items i
        LEFT JOIN bids b ON i.item_id = b.item_id
        WHERE i.item_id = ?
        GROUP BY i.item_id
    `;
    db.get(sql, [itemId], (err, row) => {
        if (err) return done({ status: 500, message: err.message });
        return done(null, row);
    });
};

// SEARCH ITEMS
const searchItems = (query, done) => {
    const sql = `
        SELECT item_id, name, description, starting_bid
        FROM items
        WHERE name LIKE ? OR description LIKE ?
    `;
    const pattern = `%${query}%`;
    db.all(sql, [pattern, pattern], (err, rows) => {
        if (err) return done({ status: 500, message: err.message });
        return done(null, rows);
    });
};

// GET BID HISTORY
const getBidHistory = (itemId, done) => {
    const sql = `
        SELECT bidder_id, amount, bid_time
        FROM bids
        WHERE item_id = ?
        ORDER BY bid_time DESC
    `;
    db.all(sql, [itemId], (err, rows) => {
        if (err) return done({ status: 500, message: err.message });
        return done(null, rows);
    });
};

// GET ITEM BY ID
const getItemById = (itemId, done) => {
    const sql = `
        SELECT item_id, name, description, starting_bid, start_date, end_date, creator_id
        FROM items
        WHERE item_id = ?
    `;
    db.get(sql, [itemId], (err, row) => {
        if (err) return done({ status: 500, message: err.message });
        return done(null, row || null);
    });
};

module.exports = {
    createItem,
    bidOnItem,
    getItemDetails,
    searchItems,
    getBidHistory,
    getItemById
};