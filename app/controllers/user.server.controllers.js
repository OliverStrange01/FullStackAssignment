const usersModel = require ('../models/user.server.models');
const Joi = require('joi');


const create_account = (req,res) => {
    const schema = Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8)
        .pattern(new RegExp("^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$"))
        .required()
    });
    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({ error_message: error.details[0].message });
    }

    
    usersModel.addNewUser(req.body, (err, userId) => {
    if (err) {
        return res.status(err.status || 500).json({ error_message: err.message });
    }
    res.status(201).json({ user_id: userId });
});

};

const login = (req, res) => {

    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            error_message: error.details[0].message
        });
    }

    const { email, password } = value;

    usersModel.authenticateUser(email, password, (err, result) => {
        if (err) return res.status(500).json({ error_message: err.message });

        if (!result.success) {
            return res.status(400).json({ error_message: "Invalid email or password" });
        }

        const userId = result.user_id;

        usersModel.getToken(userId, (err, token) => {
            if (err) return res.status(500).json({ error_message: err.message });

            if (token) {
                return res.status(200).json({ user_id: userId, session_token: token });
            }

            usersModel.setToken(userId, (err, newToken) => {
                if (err) return res.status(500).json({ error_message: err.message });

                return res.status(200).json({ user_id: userId, session_token: newToken });
            });
        });
    });
};

const logout = (req, res) => {
    const token = req.get('X-Authorization');

    
    if (!token) {
        return res.status(401).json({ error_message: "Unauthorized" });
    }

    usersModel.idFromToken(token, (err, userId) => {
        if (err) return res.status(500).json({ error_message: err.message });

        
        if (!userId) {
            return res.status(401).json({ error_message: "Invalid token" });
        }

        
        usersModel.removeToken(token, (err) => {
            if (err) return res.status(500).json({ error_message: err.message });

            return res.sendStatus(200);  
        });
    });
};

const getUserDetails = (req, res) => {
    const userId = req.params.user_id;

    usersModel.getUserDetails(userId, (err, user) => {
        if (err) return res.status(500).json({ error_message: err.message });

        if (!user) {
            return res.status(404).json({ error_message: "User not found" });
        }

        return res.status(200).json(user);
    });
};

module.exports = {
    create_account: create_account,
    login: login,
    logout: logout,
    getUserDetails: getUserDetails
    
}