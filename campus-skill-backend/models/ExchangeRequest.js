const mongoose=require("mongoose");

const requestSchema=new mongoose.Schema({

    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    skill:String,
    status:String,
    message:String

});

module.exports=mongoose.model("ExchangeRequest",requestSchema);