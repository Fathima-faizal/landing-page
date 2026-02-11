const mongoose=require('mongoose');
const {Schema}=mongoose;


const addressSchema=new Schema({

    userId:{
        type:Schema.Types.ObjectId,
        ref:'user',
        required:true,
    },
    address:[{
        addressType:{
            type:String,
            required:true,
        },
        houseName:{
            type:String,
            required:true,
        },
        street:{
            type:String,
            required:true
        },
        landmark:{
            type:String,
            required:true,
        },
        city:{
            type:String,
            required:true,
        },
        zipCode:{
            type:String,
            required:true
        },
        country:{
            type:String,
            required:true,
        },
        isDefault:{
            type:Boolean,
            default: false
        }
    }]
})
const address=mongoose.model('address',addressSchema);
module.exports=address;