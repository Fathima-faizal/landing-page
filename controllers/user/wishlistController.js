const User=require('../../models/userSchema');
const Product=require('../../models/productSchema');
const Cart=require('../../models/cartSchema')

const getwishlist=async(req,res)=>{
    try {
        const userId=req.session.user;
        if (userId) {
            const cart = await Cart.findOne({ userId: userId });
            if (cart) {
                cartCount = cart.items.length; 
            }
        }
        const page = parseInt(req.query.page) || 1; 
        const limit = 3;
        const skip = (page - 1) * limit;
        const user=await User.findById(userId);
        const totalWishlistItems = user.wishlist.length;
        const totalPages = Math.ceil(totalWishlistItems / limit);
        const proudcts=await Product.find({_id:{$in:user.wishlist}})
        .populate('category')
        .skip(skip)
        .limit(limit);
        res.render('wishlist',{
            user,
           wishlist:proudcts,
           currentPage: page,
        totalPages: totalPages,
        cartCount: cartCount
        })

    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const addwishlist=async(req,res)=>{
    try {
        const productId=req.body.productId;
        const userId=req.session.user;
        const user=await User.findById(userId);
        if(user.wishlist.includes(productId)){
            return res.status(400).json({status:false,message:`product already in wishlist`})
        }
        user.wishlist.push(productId);
        await user.save();
        return res.status(200).json({status:true,message:`product added to wishlist`})
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const deleteWishlist=async(req,res)=>{
 try {
       const productId = req.query.id;
        const userId = req.session.user;
        const redirectPath = req.query.redirect; 
       await User.findByIdAndUpdate(userId, {
            $pull: { wishlist: productId }
        });
        if (redirectPath === 'cart') {
            return res.redirect('/cart');
        }
       res.redirect('/wishlist') 
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal Server error')
    }
}







module.exports={
    getwishlist,
    addwishlist,
    deleteWishlist
}