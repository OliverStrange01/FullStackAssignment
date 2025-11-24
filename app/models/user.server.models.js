
const db = require('../../database');
const crypto = require('crypto');


//Create an account
const getHash = (password, salt) => {
    return crypto.pbkdf2Sync(password, salt, 100000, 256, 'sha256').toString('hex');
};

// Add new user
const addNewUser = (user, done) => {
    const salt = crypto.randomBytes(64);
    const hash = getHash(user.password, salt);

    const sql = 'INSERT INTO users (first_name, last_name, email, password, salt) VALUES (?,?,?,?,?)';
    const values = [user.first_name, user.last_name, user.email, hash, salt.toString('hex')];

    db.run(sql, values, function(err) {
        if (err) return done(err);
        return done(null, this.lastID);
    });
};

// Authenticate user
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

// Get token
const getToken = (id, done) => {
    const sql = 'SELECT session_token FROM users WHERE user_id=?';

    db.get(sql, [id], (err, row) => {
        if (err) return done(err);
        if (!row) return done(null, null);
        return done(null, row.session_token);
    });
};

// Set token
const setToken = (id, done) => {
    const token = crypto.randomBytes(16).toString('hex');
    const sql = 'UPDATE users SET session_token=? WHERE user_id=?';

    db.run(sql, [token, id], err => done(err, token));
};

// Remove token
const removeToken = (token, done) => {
    const sql = 'UPDATE users SET session_token=null WHERE session_token=?';
    db.run(sql, [token], err => done(err));
};

// Get user ID from token
const idFromToken = (token, done) => {
    const sql = 'SELECT user_id FROM users WHERE session_token=?';

    db.get(sql, [token], (err, row) => {
        if (err) return done(err);
        if (!row) return done(null, null);
        return done(null, row.user_id);
    });
};

const getUserDetails = (id, done) => {
    const sql = `SELECT first_name, last_name, email FROM users WHERE user_id = ?`;

    db.get(sql, [id], (err, row) => {
        if (err) return done(err);
        if (!row) return done(null, null);

        return done(null, row);
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