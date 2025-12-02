import mongoose from "mongoose";

const chartSchema = new mongoose.Schema({
    role:{
        type: String,
        required: true,
    },
    message:{
        type: String,
        required: true,
    },
    timestamp:{
        type: Date,
        default: Date.now,
    },      
});

const Chat = mongoose.model("Chat", chartSchema);

export default Chat;