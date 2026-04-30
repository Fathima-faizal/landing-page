const User=require('../../models/userSchema');
const Product=require('../../models/productSchema');
const Address=require('../../models/addressSchema');
const Cart=require('../../models/cartSchema');
const Order=require('../../models/orderSchema');
const Coupon=require('../../models/couponSchema')
const env=require('dotenv').config();
const Razorpay=require('razorpay');
const crypto=require('crypto')


const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const getcheckout=async(req,res)=>{
    try {
        const userId=req.session.user;
         let cartCount=0;
        let wishlistCount=0
        const user=await User.findById(userId)
        const coupons = await Coupon.find({ 
            islisted: true, 
            expireOn: { $gt: new Date() }  
    })
        const addressData = await Address.findOne({ userId: userId });
        const cart=await Cart.findOne({userId}).populate({
            path:'items.proudctId',
            model:'product',
            populate: {
        path: 'category', 
        model: 'category' 
    }
        })
        if (cart) {
      cartCount = cart.items.length;
    }

    if (user && user.wishlist) {
      wishlistCount = user.wishlist.length;
    }
        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart');
        }
        for (const item of cart.items) {
    const productName = item.proudctId ? item.proudctId.productName : "Product";

    if (!item.proudctId || item.proudctId.isBlocked === true) {
         req.session.errorMessage = productName + " is currently unavailable";
        return res.redirect('/cart');
    }

    if (item.proudctId.quantity < item.quantity) {
        req.session.errorMessage = productName + " is Out of stock";
        return res.redirect('/cart');
    }
}
        let grandTotal = 0;
        if (cart && cart.items && cart.items.length > 0) {
        cart.items.forEach(item => {
            grandTotal += item.proudctId.salesPrice * item.quantity;
        });
    }
      const discount = req.session.coupon ? req.session.coupon.discount : 0;
       const finalAmount = grandTotal - discount;
        const appliedCoupon = req.session.coupon ? req.session.coupon.code : null;

        res.render('checkout',{
            user,
            cart,
           userAddress: addressData ? addressData.address : [],
           grandTotal,
           discount,
           finalAmount,
           appliedCoupon,
           cartCount, 
           wishlistCount,
           coupons: coupons || []
        })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}


const placeorder=async(req,res)=>{
    try {
        const {addressId,paymentMethod}=req.body;
        const userId=req.session.user;
        const couponData = req.session.coupon;
        const user=await User.findById(userId);
        const cart=await Cart.findOne({userId}).populate({
            path:'items.proudctId',
            model:'product'
        })
        for (const item of cart.items) {
            if (item.proudctId.quantity < item.quantity) {
                return res.json({ 
                    success: false, 
                    message: `Insufficient stock` 
                });
            }
        }
        let total = cart.items.reduce((acc, item) => acc + (item.proudctId.salesPrice * item.quantity), 0);
        const discount = couponData ? couponData.discount : 0;
        const finalAmountAfterDiscount = total - discount;
        if (paymentMethod === 'Razorpay') {
            const options = {
                amount: Math.round(finalAmountAfterDiscount * 100), 
                currency: "INR",
                receipt: "rcpt_" + Date.now()
            };
            const razorpayOrder = await razorpayInstance.orders.create(options);
            return res.json({ 
                success: true, 
                method: 'Razorpay', 
                razorpayOrder,
                orderData: { addressId, paymentMethod, discount, total, finalAmountAfterDiscount } 
            });
        }
        if (paymentMethod === 'Wallet') {
            if (user.wallet < finalAmountAfterDiscount) {
                return res.json({ success: false, message: "Insufficient Wallet Balance" });
            }
            user.wallet -= finalAmountAfterDiscount;
            user.history.push({
                description: 'Order Payment',
                amount: finalAmountAfterDiscount,
                type: 'debit',
                date: new Date()
            });
            await user.save();
        }
        const orderItems = cart.items.map(item => ({
            productId: item.proudctId._id,
            quantity: item.quantity,
            price: item.proudctId.salesPrice,
            status:'pending'
        }));
        const newOrder=new Order({
            userId: userId,
            orderedItems: orderItems,
            totalPrice: total,
            discount: discount,
            finalAmount: finalAmountAfterDiscount, 
            address: addressId,
            couponapplied: couponData ? true : false,
            paymentMethod: paymentMethod,
            status: 'pending'
        })
        const savedOrder = await newOrder.save();
        req.session.coupon = null;
        if (paymentMethod === 'Razorpay') {
            const options = {
                amount: finalAmountAfterDiscount * 100,
                currency: "INR",
                receipt: savedOrder._id.toString()
            };
            const razorpayOrder = await razorpayInstance.orders.create(options);
            return res.json({ success: true, method: 'Razorpay', razorpayOrder, orderId: savedOrder._id });
        }
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.proudctId._id, {
                $inc: { quantity: -item.quantity } 
            });
        }
        await Cart.findOneAndDelete({ userId });
        res.json({success:true,message:`Order Placed successfully`})
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const verifyPayment = async (req, res) => {
    try {
        const { response, orderData } = req.body;
        const userId = req.session.user;
        let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(response.razorpay_order_id + "|" + response.razorpay_payment_id);
        hmac = hmac.digest('hex');
        if (hmac === response.razorpay_signature) {
            const cart = await Cart.findOne({ userId }).populate('items.proudctId');
            
            const orderItems = cart.items.map(item => ({
                productId: item.proudctId._id,
                quantity: item.quantity,
                price: item.proudctId.salesPrice,
                status: 'pending'
            }));
            const newOrder = new Order({
                userId: userId,
                orderedItems: orderItems,
                totalPrice: orderData.total,
                discount: orderData.discount,
                finalAmount: orderData.finalAmountAfterDiscount,
                address: orderData.addressId,
                paymentMethod: 'Razorpay',
                status: 'pending',
                paymentStatus: 'Success'
            });
            await newOrder.save();
            for (const item of cart.items) {
                await Product.findByIdAndUpdate(item.proudctId._id, {
                    $inc: { quantity: -item.quantity }
                });
            }
            await Cart.findOneAndDelete({ userId });
            req.session.coupon = null;

            res.json({ success: true });
        } else {
            res.json({ success: false, message: "Payment verification failed" });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false });
    }
}
const ordersuccess=async(req,res)=>{
    try {
        res.render('ordersuccess')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const orderfailure=async(req,res)=>{
    try {
      res.render('orderFailure')        
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}


module.exports={
    getcheckout,
    placeorder,
    ordersuccess,
    verifyPayment,
    orderfailure
}