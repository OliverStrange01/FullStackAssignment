const users = require('../models/user.server.models')

const isAuthenticated = (req, res, next) => {
    const token = req.get('X-Authorization');
    

    if (!token) return res.status(401).json({ error_message: 'Unauthorized' });

    users.idFromToken(token, (err, userId) => {
        if (err) return res.sendStatus(500);
        if (!userId) return res.status(401).json({ error_message: 'Unauthorized' });

        req.userId = userId; 
        next();
    });
};

module.exports = isAuthenticated;