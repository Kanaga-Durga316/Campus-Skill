const mongoose=require("mongoose");

const messageSchema=new mongoose.Schema({

    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    message:String,
    time:Date

});

module.exports=mongoose.model("Message",messageSchema);