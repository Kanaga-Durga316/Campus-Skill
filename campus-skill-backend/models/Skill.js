const mongoose=require("mongoose");

const skillSchema=new mongoose.Schema({

    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    skillName:String,
    category:String,
    type:String,
    level:String,
    description:String

});

module.exports=mongoose.model("Skill",skillSchema);