const mongoose=require('mongoose');
const {Schema}=mongoose;


const categorySchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    description:{
        type:String,
         required:true,
    },
    islisted:{
        type:Boolean,
        default:true,
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})


const category = mongoose.model('category',categorySchema);
module.exports=category;