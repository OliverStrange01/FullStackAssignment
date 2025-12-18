const questionsController = require("../controllers/questions.server.controllers");
const isAuthenticated = require('../lib/authentication');

module.exports = function(app) {
    
    app.route("/question")
        .get(questionsController.get_question);

    
    app.route("/item/:item_id/question")
        .get(questionsController.get_question)  // Anyone can view
        .post(isAuthenticated, questionsController.ask_question); // Only logged-in users can ask

    
    app.route("/question/:question_id")
        .post(isAuthenticated, questionsController.answer_question);
};