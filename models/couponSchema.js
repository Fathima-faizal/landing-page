const mongoose=require('mongoose');
const {Schema}=mongoose;

const couponSchema=new mongoose.Schema({
   name:{
    type:String,
    required:true,
    unique:true,
    trim:true
   },
   couponCode: {
    type: String,
    required: true,
    unique: true
    },
    couponType:{
        type: String,
        enum: ['percentage', 'fixed'], 
        default: 'fixed'
    },
    discountPercentage: {
        type: Number,
        required: true,
    },
   createdOn:{
    type:Date,
    default:Date.now,
    required:true
   },
   expireOn:{
    type:Date,
    required:true,
   },
   minimumPrice:{
    type:Number,
    required:true,
   },
   islisted:{
        type:Boolean,
        default:true,
    },
   userId:[{
    type:Schema.Types.ObjectId,
    ref:'user',
   }]

})


const coupon =mongoose.model('coupon',couponSchema);
module.exports=coupon