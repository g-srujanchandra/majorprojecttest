import mongoose from "mongoose";

const ElectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  candidates: {
    type: Array,
    required: true,
  },
  currentPhase: {
    type: String,
    default: "init", //init, registration, voting, result
  },
  startDate: {
    type: Date,
    required: false,
  },
  endDate: {
    type: Date,
    required: false,
  },
  startHour: {
    type: Number,
    default: 9, // 9 AM default
  },
  endHour: {
    type: Number,
    default: 17, // 5 PM default
  },
});

const Election = mongoose.model("Election", ElectionSchema);
export default Election;
