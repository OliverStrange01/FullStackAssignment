const db = require('../../database');


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
                INSERT INTO bids (item_id, user_id, amount, timestamp)
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

            COALESCE(b.amount, i.starting_bid) AS current_bid,

            cu.first_name AS first_name,
            cu.last_name  AS last_name,

            b.user_id     AS current_bid_user_id,
            bu.first_name AS current_bid_first_name,
            bu.last_name  AS current_bid_last_name

        FROM items i
        JOIN users cu
            ON cu.user_id = i.creator_id

        LEFT JOIN bids b
            ON b.item_id = i.item_id
        AND b.amount = (
            SELECT amount
            FROM bids
            WHERE item_id = i.item_id
            ORDER BY amount DESC
            LIMIT 1
        )

        LEFT JOIN users bu
            ON bu.user_id = b.user_id

        WHERE i.item_id = ?;
    `;
    db.get(sql, [itemId], (err, row) => {
        if (err) return done({ status: 500, message: err.message });
        if (!row) return done({ status: 404, message: "Auction not found" });

        return done(null, {
            item_id: row.item_id,
            name: row.name,
            description: row.description,
            starting_bid: row.starting_bid,
            start_date: row.start_date,
            end_date: row.end_date,
            creator_id: row.creator_id,
            current_bid: row.current_bid,
            first_name: row.first_name,
            last_name: row.last_name,
            current_bid_holder: row.current_bid_user_id
                ? {
                    user_id: row.current_bid_user_id,
                    first_name: row.current_bid_first_name,
                    last_name: row.current_bid_last_name
                }
                : null
        });
    });
};


const searchItems = (options, done) => {
    const {
        q,
        status,
        userId,
        limit,
        offset
    } = options;

    let sql = `
        SELECT DISTINCT
            i.item_id,
            i.name,
            i.description,
            i.end_date,
            i.creator_id,
            u.first_name,
            u.last_name
        FROM items i
        JOIN users u ON i.creator_id = u.user_id
        LEFT JOIN bids b ON b.item_id = i.item_id
        WHERE (i.name LIKE ? OR i.description LIKE ?)
    `;

    const params = [`%${q}%`, `%${q}%`];

    const now = Date.now();

    if (status === "OPEN") {
        sql += `
            AND i.creator_id = ?
            AND i.end_date > ?
        `;
        params.push(userId, now);
    }

    if (status === "BID") {
        sql += `
            AND b.user_id = ?
        `;
        params.push(userId);
    }

    if (status === "ARCHIVE") {
        sql += `
            AND i.end_date < ?
        `;
        params.push(now);
    }

    sql += `
        ORDER BY i.item_id ASC
        LIMIT ?
        OFFSET ?
    `;

    params.push(limit, offset);

    db.all(sql, params, (err, rows) => {
        if (err) return done(err);
        return done(null, rows);
    });
};


const getBidHistory = (itemId, done) => {
    const checkSql = `SELECT item_id FROM items WHERE item_id = ?`;
    db.get(checkSql, [itemId], (err, item) => {
        if (err) return done({ status: 500, message: err.message });
        if (!item) return done({ status: 404, message: "Auction not found" });

        const sql = `
            SELECT b.item_id, b.user_id, u.first_name, u.last_name, b.amount, b.timestamp
            FROM bids b
            JOIN users u ON b.user_id = u.user_id
            WHERE b.item_id = ?
            ORDER BY b.timestamp DESC
        `;
        db.all(sql, [itemId], (err, rows) => {
            if (err) return done({ status: 500, message: err.message });
            return done(null, rows || []);
        });
    });
};


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