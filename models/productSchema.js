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
   brand:{
    type:String,
    required:true,
   },
   category:{
    type:Schema.Types.ObjectId,
    ref:'category',
    required:true,
   },
   regularprice:{
    type:Number,
    required:true,
   },
   saleprice:{
    type:Number,
    required:true,
   },
   productoffer:{
    type:Number,
    default:0
   },
   quantity:{
    type:Number,
    default:true,
   },
   color:{
    type:String,
    required:true,
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