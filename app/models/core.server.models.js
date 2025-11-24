const db = require('../../database');

// CREATE ITEM
const createItem = (data, done) => {
    const sql = `
        INSERT INTO items (name, description, starting_bid, start_date, end_date, creator_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.run(sql, [data.name, data.description, data.starting_bid, data.starting_date, data.end_date, data.creator_id], function(err) {
        if (err) return done(err);
        return done(null, this.lastID);
    });
};

// BID ON ITEM
const bidOnItem = (data, done) => {
    // 1. Get the current highest bid
    const sqlGetHighest = `
        SELECT MAX(amount) as highest_bid 
        FROM bids 
        WHERE item_id = ?
    `;

    db.get(sqlGetHighest, [data.item_id], (err, row) => {
        if (err) return done(err);

        const highest = row?.highest_bid || 0;

        if (data.amount <= highest) {
            return done({ message: 'Bid must be higher than the current highest bid.' });
        }

        // 2. Insert the new bid
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
            if (err) return done(err);
            return done(null, this.lastID);
        });
    });
};

// GET ITEM DETAILS
const getItemDetails = (itemId, done) => {
    const sql = `
        SELECT 
            i.item_id, 
            i.name, 
            i.description, 
            i.starting_bid, 
            i.start_date,
            i.end_date,
            i.creator_id,
            MAX(b.amount) as highest_bid
        FROM items i
        LEFT JOIN bids b ON i.item_id = b.item_id
        WHERE i.item_id = ?
        GROUP BY i.item_id
    `;

    db.get(sql, [itemId], (err, row) => {
        if (err) return done(err);
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
        if (err) return done(err);
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
        if (err) return done(err);
        return done(null, rows);
    });
};

module.exports = {
    createItem,
    bidOnItem,
    getItemDetails,
    searchItems,
    getBidHistory
};