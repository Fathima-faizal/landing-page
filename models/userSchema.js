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
        type:Schema.Types.ObjectId,
          ref:'cart'
    }],
    wallet:[{
        type:Schema.Types.ObjectId,
        ref:'wishlist'
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
    },
    redeemed:{
        type:Boolean,
    },
    redeemedUser:[{
        type:Schema.Types.ObjectId,
        ref:'user'
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