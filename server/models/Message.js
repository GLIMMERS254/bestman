import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true },
    receiver: { type: String, required: true },
    text: { type: String },
    type: { type: String, default: "text" }, // "text" or "voice"
    url: { type: String }, // For voice messages
    status: { type: String, default: "sent" }, // "sent" or "seen"
  },
  { timestamps: true } // Automatically creates createdAt and updatedAt fields
);

export const Message = mongoose.model("Message", MessageSchema);