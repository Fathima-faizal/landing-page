const mongoose=require('mongoose');
const {Schema}=mongoose;


const productSchema=new Schema({
   productName:{
    type:String,
    required:true,
   },
   description:{
    type:String,
    required:true,
   },
   category:{
    type:Schema.Types.ObjectId,
   ref:'category',
    required:true,
   },
   regularPrice:{
    type:Number,
    required:true,
   },
   salesPrice:{
    type:Number,
    required:true,
   },
   quantity:{
    type:Number,
    default:true,
   },
   brand:{
      type:String,
      default:true,
   },
   color:{
      type:String,
      default:true
   },
   productimage:{
    type:[String],
    required:true,
   },
   isBlocked:{
    type:Boolean,
    default:false
   },
   status:{
    type:String,
    enum:['Available','Out of stock','Discountinued'],
    required:true,
    default:'Available'
   },


},{timestamps:true})

const product=mongoose.model('product',productSchema);
module.exports=product;