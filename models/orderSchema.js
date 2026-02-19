const mongoose=require('mongoose');
const {Schema}=mongoose;
const {v4:uuidv4}=require('uuid');

const orderSchema=new Schema({

    orderId:{
        type:String,
        default:()=> 'ORD' + uuidv4()
    },
    userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
},
    orderedItems: [{ 
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'product',
            required: true
        },
      quantity:{
        type:Number,
        required:true,
      },
      price:{
        type:Number,
        default:0
      }
    }],
    totalPrice:{
      type:Number,
      required:true
    },
    discount:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true,
    },
    address:{
        type:Schema.Types.ObjectId,
        ref:'address',
        required:true
    },
    invoiceDate:{
        type:Date,
    },
    status:{
        type:String,
        required:true,
        enum:['pending','proccessing','shipped','delivered','cancelled','return request','returned']
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    couponapplied:{
        type:Boolean,
        default:false
    },
    returnReason:{
        type:String,
        default:null
    },
    review: {
    comment: { type: String, default: null },
    rating: { type: Number, min: 1, max: 5, default: null },
    isReviewed: { type: Boolean, default: false }
        }


})

const order=mongoose.model('order',orderSchema);
module.exports=order;