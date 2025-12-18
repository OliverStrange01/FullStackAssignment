const db = require('../../database');


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


const answerQuestion = (data, done) => {
    const sql = `
        UPDATE questions
        SET answer = ?
        WHERE question_id = ?
    `;

    db.run(sql, [data.answer, data.question_id], function(err) {
        if (err) return done({ status: 500, error: err });

        return done(null, this.changes); 
    });
};


const getQuestions = (itemId, done) => {
    const sql = `
        SELECT 
            q.question_id,
            q.question AS question_text,
            q.answer AS answer_text
        FROM questions q
        WHERE q.item_id = ?
        ORDER BY q.question_id DESC
    `;

    db.all(sql, [itemId], (err, rows) => {
        if (err) return done(err);
        return done(null, rows);
    });
};


const getQuestionById = (questionId, done) => {
    const sql = `
        SELECT q.question_id,
               q.question,
               q.answer,
               q.asked_by,
               q.item_id,
               i.creator_id
        FROM questions q
        JOIN items i ON q.item_id = i.item_id
        WHERE q.question_id = ?
    `;

    db.get(sql, [questionId], (err, row) => {
        if (err) return done(err);
        return done(null, row);
    });
};

module.exports = {
    askQuestion,
    answerQuestion,
    getQuestions,
    getQuestionById
};