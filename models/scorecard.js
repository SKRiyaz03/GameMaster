const mongoose = require("mongoose");

const gameScoreSchema = new mongoose.Schema({
  gameName: { type: String, required: true },
  highScore: { type: Number, required: true }
});

const scoreCardSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  totalScore: { type: Number, required: true },
  gameScores: [gameScoreSchema]
});

const ScoreCard = mongoose.model("ScoreCard", scoreCardSchema);

module.exports = ScoreCard;