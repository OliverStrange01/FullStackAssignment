const Joi = require('joi');
const usersModel = require('../models/user.server.models');
const questionsModel = require('../models/question.server.models');
const itemsModel = require('../models/core.server.models'); 

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

            
            if (item.creator_id === userId) {
                return res.sendStatus(403);
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


const answer_question = (req, res) => {
    const token = req.get('X-Authorization');
    if (!token) return res.sendStatus(401);

    usersModel.idFromToken(token, (err, userId) => {
        if (err) return res.sendStatus(500);
        if (!userId) return res.sendStatus(401);

        
        const schema = Joi.object({
            answer_text: Joi.string().min(1).max(1000).required()
        });

        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error_message: error.details[0].message
            });
        }

        const questionId = parseInt(req.params.question_id);

        questionsModel.getQuestionById(questionId, (err, question) => {
            if (err) return res.sendStatus(500);
            if (!question) return res.sendStatus(404);

            
            if (question.creator_id !== userId) {
                return res.sendStatus(403);
            }

            
            if (question.answer !== null) {
                return res.sendStatus(403);
            }

            questionsModel.answerQuestion(
                {
                    answer: req.body.answer_text,
                    question_id: questionId
                },
                (err) => {
                    if (err) return res.sendStatus(500);
                    return res.sendStatus(200);
                }
            );
        });
    });
};


const get_question = (req, res) => {
    const itemId = parseInt(req.params.item_id);

    
    itemsModel.getItemById(itemId, (err, item) => {
        if (err) return res.sendStatus(500);
        if (!item) return res.sendStatus(404);

        
        questionsModel.getQuestions(itemId, (err, questions) => {
            if (err) return res.sendStatus(500);
            return res.status(200).json(questions);
        });
    });
};

module.exports = {
    ask_question: ask_question,
    answer_question: answer_question,
    get_question: get_question
};