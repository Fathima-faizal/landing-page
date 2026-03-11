const User=require('../../models/userSchema');
const Coupon=require('../../models/couponSchema');
const Order=require('../../models/orderSchema')

const loadedCoupon=async(req,res)=>{
    try {
         const page = parseInt(req.query.page) || 1; 
         const limit = 6; 
        const skip = (page - 1) * limit;
        const userId=req.session.user;
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
        })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const applycoupon=async(req,res)=>{
    try {
       const {couponCode,totalAmount}=req.body;
        const coupon = await Coupon.findOne({ 
            couponCode: couponCode, 
            islisted: true 
        });
        if (!coupon) {
            return res.json({ success: false, message: "Invalid Coupon Code" });
        }
        const today = new Date();
        if (coupon.expireOn < today) {
            return res.json({ success: false, message: "Coupon has expired" });
        }
        if (totalAmount < coupon.minimumPrice) {
            return res.json({ 
                success: false, 
                message: `Minimum purchase of ₹${coupon.minimumPrice} required` 
            });
        }
        const finalAmount = totalAmount - coupon.discountPercentage;
        req.session.coupon = {
            code: couponCode,
            discount: coupon.discountPercentage
        };
        return res.json({ 
            success: true, 
            discountAmount: coupon.discountPercentage, 
            finalAmount: finalAmount,
            message: "Coupon applied successfully!" 
        });
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
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