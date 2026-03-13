const mongoose=require('mongoose');
const {Schema}=mongoose

const offerSchema=new Schema({
    offerName:{ 
    type: String, 
    required: true 
    },
    discountPercentage:{ 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
    },
    offerType:{ 
    type: String, 
    enum: ['Product', 'Category'], 
    required: true 
    },
    productId:{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'product' 
    },
    categoryId:{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'category' 
    },
    expiryDate:{ 
    type: Date, 
    required: true 
    },
    isActive:{ 
    type: Boolean, 
    default: true }
},{ timestamps: true })

const offer=mongoose.model('offer',offerSchema);
module.exports=offer
