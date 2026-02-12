const Product=require('../../models/productSchema');
const Category=require('../../models/categorySchema');
const  User=require('../../models/userSchema');
const product = require('../../models/productSchema');

const productdetails=async(req,res)=>{
    try {
        const userId=req.session.user;
        const userData=await User.findById(userId);
        const productId=req.query.id;
        const productData=await Product.findById(productId).populate('category');
        const findCategory=productData.category;
        res.render('productDetails',{
            userData:userData,
            product:productData,
            quantity:Product.quantity,
           category:findCategory,

        })

    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}


module.exports={
    productdetails
}