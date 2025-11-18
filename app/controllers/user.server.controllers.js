const usersModel = require ('../models/user.server.models');
const Joi = require('joi');


const create_account = (req,res) => {
    const schema = Joi.object({
        first_name: Joi.string().required(),
        last_name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8)
            .pattern(/[A-Z]/, 'one uppercase letter')
            .pattern(/[a-z]/, 'one lowercase letter')
            .pattern(/[0-9]/, 'one number')
            .pattern(/[^A-Za-z0-9]/, 'one special character')
            .required()
    });
    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({ error_message: error.details[0].message });
    }

    
    usersModel.addNewUser(req.body, (err, userId) => {
        if (err) return res.status(500).json({error_message: err.message });
        res.status(201).json({ user_id: userId });
    });

};

const login = (req,res) => {
    const schema = Joi.object({
        email:Joi.string().email().required(),
        password: Joi.string().required()
    });

    const { error, value } = schema.validate(req.body);

     if (error) {
        return res.status(400).json({
            error_message: error.details[0].message
        });
    }

    usersModel.authenticateUser(req.body, (err, userId) => {
        if (err) return res.status(500).json({error_message: err.message });
        if(!result.success) {
            return res.status(400).json({error_message: "Invalid email or password"})
        }

        return res.status(200).json({ user_id: result.user_id})
    });

    const {email, password} = value;
}

const logout = (req,res) => {
    return res.sendStatus(500);
}

module.exports = {
    create_account: create_account,
    login: login,
    logout: logout
}