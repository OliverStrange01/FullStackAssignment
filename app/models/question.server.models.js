const db = require('../../database');

// ASK A QUESTION
const askQuestion = (data, done) => {
    const sql = `
        INSERT INTO questions (question_text, asked_by, item_id)
        VALUES (?, ?, ?)
    `;

    db.run(sql, [data.question_text, data.asked_by, data.item_id], function(err) {
        if (err) return done(err);

        return done(null, this.lastID);
    });
};

// ANSWER A QUESTION
const answerQuestion = (data, done) => {
    const sql = `
        UPDATE questions
        SET answer_text = ?, answered_by = ?
        WHERE question_id = ?
    `;

    db.run(sql, [data.answer_text, data.answered_by, data.question_id], function(err) {
        if (err) return done({status:500, error: err});

        return done(null, this.lastID);
    });
};

// GET QUESTIONS FOR AN ITEM
const getQuestionsForItem = (itemId, done) => {
    const sql = `
        SELECT question_id, question_text, answer_text, asked_by, answered_by
        FROM questions
        WHERE item_id = ?
    `;

    db.all(sql, [itemId], (err, rows) => {
        if (err) return done(err);

        return done(null, rows);
    });
};

module.exports = {
    askQuestion,
    answerQuestion,
    getQuestionsForItem
};