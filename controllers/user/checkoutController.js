const User=require('../../models/userSchema');
const Product=require('../../models/productSchema');
const Address=require('../../models/addressSchema');
const Cart=require('../../models/cartSchema');
const Order=require('../../models/orderSchema')


const getcheckout=async(req,res)=>{
    try {
        const userId=req.session.user;
        const user=await User.findById(userId)
        const addressData = await Address.findOne({ userId: userId });
        const cart=await Cart.findOne({userId}).populate({
            path:'items.proudctId',
            model:'product',
            populate: {
        path: 'category', 
        model: 'category' 
    }
        })
        if (!cart || cart.items.length === 0) {
            return res.redirect('/cart');
        }
        for(const item of cart.items){
            if(!item.proudctId||item.proudctId.isBlocked===true||item.proudctId.quantity<item.quantity){
                return res.redirect('/cart?message=Out of stock')
            }
        }
        let grandTotal = 0;
        if (cart && cart.items && cart.items.length > 0) {
        cart.items.forEach(item => {
            grandTotal += item.proudctId.salesPrice * item.quantity;
        });
    }
        res.render('checkout',{
            user,
            cart,
           userAddress: addressData ? addressData.address : [],
           grandTotal
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
        let total = 0;
        const orderItems = cart.items.map(item => {
            total += item.proudctId.salesPrice * item.quantity;
            return {
                productId: item.proudctId._id,
                quantity: item.quantity,
                price: item.proudctId.salesPrice,
                status:'pending'
            };
        });
        const newOrder=new Order({
            userId: userId,
            orderedItems: orderItems,
            totalPrice: total,
            finalAmount: total, 
            address: addressId,
            paymentMethod: paymentMethod,
            status: 'pending'
        })
        await newOrder.save()
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
const ordersuccess=async(req,res)=>{
    try {
        res.render('ordersuccess')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}


module.exports={
    getcheckout,
    placeorder,
    ordersuccess,
}