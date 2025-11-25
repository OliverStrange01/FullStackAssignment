const db = require('../../database');

// ASK A QUESTION
const askQuestion = (data, done) => {
    const sql = `
        INSERT INTO questions (question, asked_by, item_id)
        VALUES (?, ?, ?)
    `;

    db.run(sql, [data.question, data.asked_by, data.item_id], function(err) {
        if (err) return done(err);

        return done(null, this.lastID);
    });
};

// ANSWER A QUESTION
const answerQuestion = (data, done) => {
    const sql = `
        UPDATE questions
        SET answer = ?
        WHERE question_id = ?
    `;

    db.run(sql, [data.answer, data.question_id], function(err) {
        if (err) return done({ status: 500, error: err });

        return done(null, this.changes); // this.lastID isn't relevant for UPDATE
    });
};

// GET QUESTIONS (all or by item)
const getQuestions = (itemId, done) => {
    let sql;
    let params = [];

    if (itemId) {
        sql = `
            SELECT question_id, question, answer, asked_by, item_id
            FROM questions
            WHERE item_id = ?
        `;
        params = [itemId];
    } else {
        sql = `
            SELECT question_id, question, answer, asked_by, item_id
            FROM questions
        `;
    }

    db.all(sql, params, (err, rows) => {
        if (err) return done(err);
        return done(null, rows);
    });
};

module.exports = {
    askQuestion,
    answerQuestion,
    getQuestions
};