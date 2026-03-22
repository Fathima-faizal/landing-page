const Product=require('../../models/productSchema');
const Category=require('../../models/categorySchema');
const  User=require('../../models/userSchema');
const product = require('../../models/productSchema');
const Order=require('../../models/orderSchema');
const Cart=require('../../models/cartSchema')
const {applyBestOffer}=require('../../controllers/admin/productConroller')
const productdetails=async(req,res)=>{
    try {
        const userId=req.session.user;
        const userData=await User.findById(userId);
        let cartCount = 0;
                if (userId) {
                    const cart = await Cart.findOne({ userId: userId });
                    if (cart) {
                        cartCount = cart.items.length; 
                    }
                }
        const productId=req.query.id;
        const productData=await Product.findById(productId).populate('category');
        await applyBestOffer(productData);
        const findCategory=productData.category;
        res.render('productDetails',{
            userData:userData,
            product:productData,
            quantity:Product.quantity,
           category:findCategory,
           cartCount:cartCount,
        })

    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}


module.exports={
    productdetails
}