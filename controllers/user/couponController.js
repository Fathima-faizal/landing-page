const User=require('../../models/userSchema');
const Coupon=require('../../models/couponSchema');
const Cart=require('../../models/cartSchema');
const Order=require('../../models/orderSchema')

const loadedCoupon=async(req,res)=>{
    try {
         const page = parseInt(req.query.page) || 1;
         const limit = 6; 
        const skip = (page - 1) * limit;
        const userId=req.session.user;
        let cartCount = 0;
    let wishlistCount = 0;
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ userId: userId });

    if (cart) {
      cartCount = cart.items.length;
    }

    if (user && user.wishlist) {
      wishlistCount = user.wishlist.length;
    }
        const today=new Date()
        today.setHours(0, 0, 0, 0);
         const totalCoupons = await Coupon.countDocuments();
        const coupons=await Coupon.find({
            islisted:true,
            expireOn:{$gte:today}
        }).sort({ createdOn: -1 })
         .skip(skip)
        .limit(limit);
         const totalPages = Math.ceil(totalCoupons / limit);
        res.render('Coupon',{
            coupons,
            userId,
            currentPage: page,
            totalPages: totalPages,
            cartCount, 
           wishlistCount,
        })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const applycoupon = async (req, res) => {
    try {
        const { couponCode, totalAmount } = req.body;
        const coupon = await Coupon.findOne({ couponCode, islisted: true });
        if (!coupon) return res.json({ success: false, message: "Invalid Coupon" });
        let discountAmount = 0;
        if (coupon.couponType === 'percentage') {
            discountAmount = (totalAmount * coupon.discountPercentage) / 100;
            if (coupon.minimumPrice > 0 && discountAmount > coupon.minimumPrice) {
            }
        } else {
            discountAmount = coupon.discountPercentage;
        }
        if (discountAmount >= totalAmount) discountAmount = totalAmount;
        const finalAmount = totalAmount - discountAmount; 
            req.session.coupon = {
            code: couponCode,
            discount: discountAmount
        };
        return res.json({ 
            success: true, 
            discountAmount, 
            finalAmount,  
            message: "Applied!" 
        });
    } catch (error) {
        res.status(500).send('Internal error');
    }
}
const removecoupon=async(req,res)=>{
   req.session.coupon = null;
    res.json({ success: true });
}

module.exports={
    loadedCoupon,
    applycoupon,
    removecoupon,

}