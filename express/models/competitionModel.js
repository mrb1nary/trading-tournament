import mongoose from "mongoose";

const CompetitionSchema = new mongoose.Schema({
  authority: {
    type: String,
    required: true,
  },
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  max_players: {
    type: Number,
    required: true,
  },
  current_players: {
    type: Number,
    default: 0,
  },
  entry_fee: {
    type: Number,
    required: true,
  },
  base_amount: {
    type: Number,
    required: true,
  },
  start_time: {
    type: Date, // Using Date for better time handling
    required: true,
  },
  end_time: {
    type: Date,
    required: true,
  },
  winning_amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ["TwoPlayers", "SixPlayers", "TwelvePlayers", "TwentyFivePlayers"], // Matches the Rust enum
    required: true,
  },
  winner: {
    type: String, // PublicKey as a string
    default: null,
  },
  payout_claimed: {
    type: Boolean,
    default: false,
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId, // References Player documents
      ref: "Player",
      default: [],
    },
  ],
});

export const Competition = mongoose.model("Competition", CompetitionSchema);
