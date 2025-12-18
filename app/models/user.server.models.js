
const db = require('../../database');
const crypto = require('crypto');



const getHash = (password, salt) => {
    return crypto.pbkdf2Sync(password, salt, 100000, 256, 'sha256').toString('hex');
};


const addNewUser = (user, done) => {
    const salt = crypto.randomBytes(64);
    const hash = getHash(user.password, salt);

    const sql = 'INSERT INTO users (first_name, last_name, email, password, salt) VALUES (?,?,?,?,?)';
    const values = [user.first_name, user.last_name, user.email, hash, salt.toString('hex')];

    db.run(sql, values, function(err) {
        if (err) {

            
            if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('users.email')) {
                return done({ status: 400, message: "Email already exists" });
            }

            
            return done({ status: 500, message: err.message });
        }
        return done(null, this.lastID);
    });
};


const authenticateUser = (email, password, done) => {
    const sql = 'SELECT user_id, password, salt FROM users WHERE email=?';

    db.get(sql, [email], (err, row) => {
        if (err) return done(err);
        if (!row) return done(null, { success: false, reason: 'email' });

        const salt = row.salt ? Buffer.from(row.salt, 'hex') : Buffer.alloc(0);

        const hashedPassword = crypto
            .pbkdf2Sync(password, salt, 100000, 256, 'sha256')
            .toString('hex');

        if (row.password !== hashedPassword) {
            return done(null, { success: false, reason: 'password' });
        }

        return done(null, { success: true, user_id: row.user_id });
    });
};


const getToken = (id, done) => {
    const sql = 'SELECT session_token FROM users WHERE user_id=?';

    db.get(sql, [id], (err, row) => {
        if (err) return done(err);
        if (!row) return done(null, null);
        return done(null, row.session_token);
    });
};


const setToken = (id, done) => {
    const token = crypto.randomBytes(16).toString('hex');
    const sql = 'UPDATE users SET session_token=? WHERE user_id=?';

    db.run(sql, [token, id], err => done(err, token));
};


const removeToken = (token, done) => {
    const sql = 'UPDATE users SET session_token=null WHERE session_token=?';
    db.run(sql, [token], err => done(err));
};


const idFromToken = (token, done) => {
    const sql = 'SELECT user_id FROM users WHERE session_token=?';

    db.get(sql, [token], (err, row) => {
        if (err) return done(err);
        if (!row) return done(null, null);
        return done(null, row.user_id);
    });
};

const getUserDetails = (id, done) => {
    const userSql = `
        SELECT user_id, first_name, last_name, email
        FROM users
        WHERE user_id = ?
    `;

    db.get(userSql, [id], (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, null);

        const sellingSql = `
            SELECT 
                i.item_id,
                i.name,
                i.description,
                i.end_date,
                i.creator_id,
                u.first_name,
                u.last_name
            FROM items i
            JOIN users u ON i.creator_id = u.user_id
            WHERE i.creator_id = ?
        `;

        db.all(sellingSql, [id], (err, selling) => {
            if (err) return done(err);

            const biddingSql = `
                SELECT 
                    i.item_id,
                    i.name,
                    i.description,
                    i.end_date,
                    i.creator_id,
                    u.first_name,
                    u.last_name
                FROM bids b
                JOIN items i ON b.item_id = i.item_id
                JOIN users u ON i.creator_id = u.user_id
                WHERE b.user_id = ?
                GROUP BY i.item_id
            `;

            db.all(biddingSql, [id], (err, bidding) => {
                if (err) return done(err);

                user.selling = selling || [];
                user.bidding_on = bidding || [];
                user.auctions_ended = [];

                return done(null, user);
            });
        });
    });
};

module.exports = {
    addNewUser,
    authenticateUser,
    getToken,
    setToken,
    removeToken,
    idFromToken,
    getUserDetails: getUserDetails
};