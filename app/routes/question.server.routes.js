const questionsController = require("../controllers/questions.server.controllers");
const isAuthenticated = require('../lib/authentication')

module.exports = function(app) {
    app.route("/questions")
        .post();

    app.route("/item/:item_id/question")
        .get(questionsController.get_question)  // Anyone can view
        .post(isAuthenticated, questionsController.ask_question); // Only logged-in users can ask

    // ANSWER a question (only for logged-in users)
    app.route("/question/:question_id/answer")
        .post(isAuthenticated, questionsController.answer_question);
};
