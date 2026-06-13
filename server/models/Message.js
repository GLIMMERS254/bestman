import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: String,
    receiver: String,
    text: String,
    type: String, // text | image | video | voice
    url: String,
    status: {
      type: String,
      default: "sent",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Message", MessageSchema);