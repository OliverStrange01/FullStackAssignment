const Joi = require('joi');
const usersModel = require('../models/user.server.models');
const questionsModel = require('../models/question.server.models');
const itemsModel = require('../models/core.server.models'); // make sure you have this

const ask_question = (req, res) => {
    const token = req.get('X-Authorization');
    if (!token) return res.sendStatus(401);

    usersModel.idFromToken(token, (err, userId) => {
        if (err) return res.sendStatus(500);
        if (!userId) return res.sendStatus(401);

        const schema = Joi.object({
            question_text: Joi.string().min(1).max(1000).required()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error_message: error.details[0].message });
        }

        const itemId = parseInt(req.params.item_id);

        itemsModel.getItemById(itemId, (err, item) => {
            if (err) return res.sendStatus(500);
            if (!item) return res.sendStatus(404);

            if (item.seller_id === userId) {
                return res.sendStatus(403); // creator cannot ask a question
            }

            const data = {
                question: req.body.question_text,
                asked_by: userId,
                item_id: itemId
            };

            questionsModel.askQuestion(data, (err, questionId) => {
                if (err) return res.sendStatus(500);
                return res.status(200).json({ question_id: questionId });
            });
        });
    });
};

// ANSWER A QUESTION
const answer_question = (req, res) => {
    const token = req.get('X-Authorization');
    if (!token) return res.sendStatus(401);

    usersModel.idFromToken(token, (err, userId) => {
        if (err) return res.sendStatus(500);
        if (!userId) return res.sendStatus(401);

        const schema = Joi.object({
            answer: Joi.string().min(1).max(1000).required()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res
                .status(400)
                .json({ error_message: error.details[0].message });
        }

        const data = {
            answer: req.body.answer,
            question_id: parseInt(req.params.question_id)
        };

        questionsModel.answerQuestion(data, (err) => {
            if (err) return res.sendStatus(500);

            return res.sendStatus(200);
        });
    });
};

// GET ALL QUESTIONS FOR AN ITEM
const get_question = (req, res) => {
    const itemId = req.params.item_id ? parseInt(req.params.item_id) : null;

    questionsModel.getQuestions(itemId, (err, questions) => {
        if (err) return res.sendStatus(500);
        return res.status(200).json(questions);
    });
};

module.exports = {
    ask_question: ask_question,
    answer_question: answer_question,
    get_question: get_question
};