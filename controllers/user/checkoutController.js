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
            model:'product'
        })
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
        let total = 0;
        const orderItems = cart.items.map(item => {
            total += item.proudctId.salesPrice * item.quantity;
            return {
                productId: item.proudctId._id,
                quantity: item.quantity,
                price: item.proudctId.salesPrice
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