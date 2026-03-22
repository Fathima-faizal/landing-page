const mongoose=require('mongoose');
const {Schema}=mongoose;



const userSchema=new Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    profileImage: { 
        type: String,
        default: "default-avatar.png" 
    },
    phone:{
        type:String,
        require:false,
        unique:false,
        sparse:true,
        default:null
    },
    googleId:{
        type:String,
        unique:true,
        sparse: true,
    },
    password:{
        type:String,
        required:false,
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    isAdmin:{
        type:Boolean,
        default:false,
    },
    cart:[{
       type : Array

    }],
    wallet:{
        type:Number,
       default:0,
    },
    history: [{
    description: { type: String },
    amount: { type: Number },
    type: { type: String,
         enum: ['credit', 'debit'] },
    status: { type: String,
        default: 'Completed'
     },
    date: { type: Date, default: Date.now }
  }
],
    wishlist:[{
       type:Schema.Types.ObjectId,
       ref:'product'
   }],
    orderHistory:[{
        type:Schema.Types.ObjectId,
        ref:'order'
    }],
    createdOn:{
      type:Date,
      default:Date.now,
    },
    referralCode:{
        type:String,
        required:false
    },
    redeemed:{
        type:Boolean,
        default:false
    },
    redeemedUser: [{
    name: String,
    email: String,
    date: { type: Date, default: Date.now }
    }],
    searchHistory:[{
      category:{
        type:Schema.Types.ObjectId,
        ref:'category'
      },
      brand:{
        type:String,
      },
      searchOn:{
        type:Date,
        default:Date.now
      }
    }],
})







const user=mongoose.model('user',userSchema);
module.exports=user;