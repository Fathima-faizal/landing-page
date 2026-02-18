const User = require('../../models/userSchema');
const Product = require('../../models/productSchema');
const Cart = require('../../models/cartSchema');
const mongoose = require('mongoose');

const getcartpage = async (req, res) => {
    try {
        const userId = req.session.user;
        const page = parseInt(req.query.page) || 1; 
        const limit = 2; 
        const skip = (page - 1) * limit;
        const user = await User.findById(userId);
    const fullCart = await Cart.findOne({ userId: userId }).populate({
        path:'items.proudctId',
        model:'product'
    })
       let grandtotal = 0;
       if (fullCart && fullCart.items) {
            fullCart.items.forEach(item => {
                if (item.proudctId&& item.proudctId.salesPrice) {
                    grandtotal += (item.proudctId.salesPrice * item.quantity);
                }
            });
        }
        const cartCountDoc = await Cart.findOne({ userId: userId });
        const totalItems = cartCountDoc ? cartCountDoc.items.length : 0;
        const totalPages = Math.ceil(totalItems / limit);
        const data = await Cart.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            { $unwind: '$items' },
            { $skip: skip }, 
            { $limit: limit },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.proudctId', 
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' }, 
            {
                $lookup: {
                    from: 'categories', 
                    localField: 'productDetails.category',
                    foreignField: '_id',
                    as: 'categoryDetails'
                }
            },
            { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } }
        ]);

        

        req.session.grandtotal = grandtotal;
        res.render('cart', {
            user,
            data,
            grandtotal,
            totalItems,
            totalPages,
            currentPage: page
        });

    } catch (error) {
        console.error('Error in getcartpage:', error);
        res.status(500).send('Internal server error');
    }
}
const addcart = async (req, res) => {
    try {
        const productId = req.body.productId;
        const userId = req.session.user;
        const product = await Product.findById(productId).lean();
       if (!product || product.isBlocked === true) {
    return res.json({ status: false, message: "Product not available" });
     }
        if (product.quantity <= 0) {
            return res.json({status:false,message: "Out Of Stock" });
        }
        let userCart = await Cart.findOne({ userId: userId });
        if (!userCart) {
            const newCart = new Cart({
                userId: userId,
                items: [{
                    proudctId: productId, 
                    quantity: 1,
                    price: product.salesPrice,
                    totalprice: product.salesPrice
                }]
            });
            if(userCart && userCart.includes(productId)){
             return res.status(400).json({status:false,message:`product already in Cart`})
            }
            await newCart.save();
            return res.json({ status: true, cartLength: 1 });
        } else {
            const itemIndex = userCart.items.findIndex(item => item.proudctId.toString() === productId);

            if (itemIndex > -1) {
                return res.json({ status: false, message: "This product is already in your cart" });
            } else {
                userCart.items.push({
                    proudctId: productId,
                    quantity: 1,
                    price: product.salesPrice,
                    totalprice: product.salesPrice
                });
            }
            await userCart.save();
            return res.json({ status: true, cartLength: userCart.items.length });
        }
    } catch (error) {
        console.log('Error in addcart:', error);
        res.status(500).json({ status: "Internal server error" });
    }
}
const changeQuantity = async (req, res) => {
    try {
        const { productId, count } = req.body;
        const userId = req.session.user;

        const product = await Product.findById(productId);
        const cart = await Cart.findOne({ userId: userId });

        if (!cart) return res.json({ status: false, message: "Cart not found" });

        const itemIndex = cart.items.findIndex(item => item.proudctId.toString() === productId);

        if (itemIndex > -1) {
            let item = cart.items[itemIndex];
            let newQuantity = item.quantity + parseInt(count);
            if (newQuantity < 1) {
                return res.json({ status: false, message: "Quantity cannot be less than 1" });
            }
            if (newQuantity > product.quantity) {
                return res.json({ status: false, message: "Stock limit reached" });
            }

            item.quantity = newQuantity;
            item.totalprice = item.quantity * product.salesPrice;
            await cart.save();
            const updatedCart = await Cart.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId) } },
                { $unwind: "$items" },
                {
                    $group: {
                        _id: null,
                        totalPrice: { $sum: "$items.totalprice" }
                    }
                }
            ]);

            return res.json({
                status: true,
                newQuantity: item.quantity,
                newSubtotal: item.totalprice,
                grandTotal: updatedCart.length > 0 ? updatedCart[0].totalPrice : 0
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: false, error: "Server error" });
    }
};
const deletecart=async(req,res)=>{
    try{
   const productId = req.query.id;
        const userId = req.session.user;
       await Cart.findOneAndUpdate(
        { userId: userId },
            { $pull: { items: { proudctId: productId } } }
       );
       res.redirect('/cart') 
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal Server error')
    }
}

module.exports={
    getcartpage,
    addcart,
    changeQuantity,
    deletecart,
}