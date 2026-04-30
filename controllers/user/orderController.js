const User=require('../../models/userSchema');
const Product=require('../../models/productSchema');
const Cart=require('../../models/cartSchema');
const Address=require('../../models/addressSchema');
const Order=require('../../models/orderSchema');
const Coupon=require('../../models/couponSchema')
const PDFdocument=require('pdfkit')
  
const getorder = async(req, res) => {
    try {
        const userId = req.session.user;
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
        const page = parseInt(req.query.page) || 1; 
        const limit = 4; 
        const skip = (page - 1) * limit;
        let search = req.query.search || "";
        search = search.replace(/^#/, "").trim();
        let query = { userId: userId };
        if (search) {
            query.orderId = { $regex: search, $options: 'i' };
        }
        const totalOrders = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('orderedItems.productId')
            .sort({ createdOn: -1 })
            .skip(skip)
            .limit(limit)
            .lean();   
        res.render('order', {
             orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            totalOrders,
            search,
            cartCount, 
         wishlistCount, 
         });
    } catch (error) {
        console.log('error', error);
        res.status(500).send('Internal server error');
    }
}
const postorder = async (req, res) => {
    try {
        const userId = req.session.user;
        const { addressId, paymentMethod } = req.body;
        const cart = await Cart.findOne({ userId }).populate('items.proudctId'); 
        
        if (!cart) return res.status(400).json({ status: false, message: "Cart not found" });
        

        if (paymentMethod === 'Razorpay') {
            return res.json({ 
                status: true, 
                onlinePayment: true,
                totalAmount: req.session.grandTotal 
            });
        }
 
        const orderItems = cart.items.map(item => ({
            productId: item.proudctId._id, 
            quantity: item.quantity,
            price: item.price
        }));

        const neworder = new Order({
            userId: userId,
            orderId: 'ORD' + Math.floor(1000 + Math.random() * 9000), 
            orderedItems: orderItems,
            totalPrice: req.session.grandTotal, 
            finalAmount: req.session.grandTotal,
            paymentMethod:paymentMethod,
            address: addressId,
            status: 'pending', 
            createdOn: new Date() 
        });

        await neworder.save();
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(item.proudctId._id, {
                $inc: { quantity: -item.quantity }
            });
        }

        await Cart.findOneAndDelete({ userId });
        res.json({ status: true, message: "Order placed successfully" });

    } catch (error) {
        console.log('error', error);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
}
const orderdetails=async(req,res)=>{
    try {
        const userId=req.session.user;
        const orderId=req.params.id;
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
        const page = parseInt(req.query.page) || 1; 
        const limit = 2; 
        const skip = (page - 1) * limit;
        const order=await Order.findById(orderId).populate({
            path:'orderedItems.productId',
            populate: {
                path: 'category' 
            }
        }).lean();
        const addressData = await Address.findOne({ "address._id": order.address });
        const totalItems = order.orderedItems.length;
        const totalPages = Math.ceil(totalItems / limit);
        const paginatedItems = order.orderedItems.slice(skip, skip + limit);
        order.orderedItems = paginatedItems;
        res.render('orderDetails',{
            order,
            paymentMethod: order.paymentMethod,
            currentPage: page,
            totalPages: totalPages,
            addressData:addressData,
            cartCount, 
           wishlistCount, 
        })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server errror')
    }
}
const getReturnPage = async (req, res) => {
    try {
        const orderId = req.params.orderId;
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
        const order = await Order.findById(orderId).populate({
            path:'orderedItems.productId',
            populate: { path: 'category' }
        });
        
        if (!order) {
            return res.redirect('/order');
        }
        
        res.render('return', { order,cartCount, wishlistCount, });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};
const submitReturn = async (req, res) => {
    try {
        const { orderId, selectedItems, reason } = req.body;
        const userId = req.session.user;
        const order = await Order.findById(orderId);
        const itemsToReturn = Array.isArray(selectedItems) ? selectedItems : [selectedItems];
        for (const item of order.orderedItems) {
            if (itemsToReturn.includes(item.productId.toString())) {
                item.status = 'return';
                item.returnReason = reason;
            }
        }
        order.status = 'return'; 
        await order.save();

        return res.json({ 
            status: true, 
            message: "Return request submitted to admin",
          
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error submitting return");
    }
};
const cancelOrderItem = async (req, res) => {
    try {
        const { orderId, productId } = req.body;
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        const itemIndex = order.orderedItems.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            const item = order.orderedItems[itemIndex];
            await Product.findByIdAndUpdate(productId, {
                $inc: { quantity: item.quantity }
            });
            const oldFinalAmount = order.finalAmount;
            order.orderedItems.splice(itemIndex, 1);
            let newSubtotal = order.orderedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
            const coupon = await Coupon.findOne({ couponCode: order.couponCode });
            if (coupon && (newSubtotal < coupon.minimumPrice || order.orderedItems.length === 0)) {
                order.discount = 0;
                order.couponapplied = false;
            }
            order.totalPrice = newSubtotal;
            if (order.orderedItems.length === 0) {
                order.totalPrice = 0;
                order.discount = 0;
                order.finalAmount = 0;
                order.status = 'cancelled';
            } else {
                order.finalAmount = newSubtotal - order.discount;
            }
            const refundAmount = oldFinalAmount - order.finalAmount;
            if (order.paymentMethod !== 'COD' && refundAmount > 0) {
                const user = await User.findById(order.userId);
                if (user) {
                    user.wallet = (Number(user.wallet) || 0) + Number(refundAmount);
                    user.history.push({
                        description: `Refund for Cancelled Item in Order #${order.orderId.toString().slice(-6)}`,
                        amount: refundAmount,
                        type: 'credit',
                        status: 'Completed',
                        date: new Date()
                    });
                    await user.save();
                }
            }
            if (order.orderedItems.length === 0) {
                order.status = 'cancelled';
            }
            await order.save();
            return res.json({ success: true, message: "Item cancelled and Order Summary updated successfully" });
        }

        res.json({ success: false, message: "Item not found" });
    } catch (error) {
        console.error("Error in cancelOrderItem:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
const getreview = async (req, res) => {
    try {
         const {orderId,productId}=req.params;
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
        
    const order=await Order.findById(orderId).populate({
            path:'orderedItems.productId',
            populate: {
                path: 'category' 
            }
        });
     const item = order.orderedItems.find(i => i.productId._id.toString() === productId);
     res.render('review', { order, item ,cartCount, wishlistCount,});
  } catch (error) {
    console.log('error',error);
    res.status(500).send('Internal server error')
  }
}
const postreview=async(req,res)=>{
    try {
        const { productId, rating, comment, orderId } = req.body;
        await Order.updateOne(
            {_id: orderId,
             "orderedItems.productId": productId,
            },
            {
                 $set: {
                    "orderedItems.$.review":{
                        comment: comment,
                        rating: Number(rating),
                        isReviewed: true
                 }

                 } 
                }
        );
      return res.json({ status: true, message: 'Review submitted!' });
        
    } catch (error) {
       console.log('error',error);
       res.status(500).send('Internal server error')
    }
}
const downloadInvoice = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId)
            .populate('orderedItems.productId')
            .populate('userId');
        if (!order) return res.status(404).send('Order not found');
        if (order.status.toLowerCase() !== 'delivered') {
            return res.status(403).send('Invoice is only available for delivered orders.');
        }
        const addressData = await Address.findOne({ "address._id": order.address });
        const addr = addressData ? addressData.address.find(a => a._id.toString() === order.address.toString()) : null;
        const doc = new PDFdocument({ margin: 50, size: 'A4' });
        const fileName = `Invoice_${order.orderId}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        doc.pipe(res);
        doc.fillColor('#1a4d2e').fontSize(25).text('VisionVogue', { align: 'left' });
        doc.fillColor('#444444').fontSize(10).text('Your Vision, Our Style', { align: 'left' });
        doc.fillColor('#444444')
           .text('VisionVogue Eyewear Ltd.', 400, 50, { align: 'right' })
           .text('GSTIN: 32AAAAA0000A1Z5', { align: 'right' })
           .text('Email: support@visionvogue.com', { align: 'right' })
           .text('Phone: +91 8923457190', { align: 'right' });
        doc.moveDown();
        doc.moveTo(50, 110).lineTo(550, 110).strokeColor('#eeeeee').stroke();
        doc.fillColor('#1a4d2e').fontSize(18).text('TAX INVOICE', 50, 130);
        doc.fillColor('#444444').fontSize(10);
        doc.text(`Invoice No: INV-${order.orderId}`, 50, 155);
        doc.text(`Order ID: #${order.orderId}`, 50, 170);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 50, 185);
        doc.text(`Payment: ${order.paymentMethod}`, 50, 200);
        doc.fontSize(12).fillColor('#1a4d2e').text('Bill To:', 350, 130);
        doc.fontSize(10).fillColor('#444444');
        doc.text(order.userId ? order.userId.name : 'Customer', 350, 150);
        if (addr) {
            doc.text(`${addr.houseName}`, 350, 165);
            doc.text(`${addr.city}, ${addr.state || ''}`, 350, 180);
            doc.text(`${addr.zipCode}`, 350, 195);
            doc.text(`Phone: ${addr.phoneNumber}`, 350, 210);
        }
        const tableTop = 250;
        doc.rect(50, tableTop, 500, 25).fill('#1a4d2e');
        doc.fillColor('#ffffff').fontSize(10);
        doc.text('Item Description', 60, tableTop + 8);
        doc.text('Qty', 280, tableTop + 8);
        doc.text('Unit Price', 350, tableTop + 8);
        doc.text('Total', 480, tableTop + 8);
        let y = tableTop + 30;
        order.orderedItems.forEach((item, index) => {
            doc.fillColor('#444444');
            doc.text(item.productId.productName, 60, y);
            doc.text(item.quantity.toString(), 280, y);
            doc.text(`Rs. ${item.price.toLocaleString()}`, 350, y);
            doc.text(`Rs. ${(item.quantity * item.price).toLocaleString()}`, 480, y);
            y += 20;
            doc.moveTo(50, y - 5).lineTo(550, y - 5).strokeColor('#eeeeee').stroke();
        });
        y += 15;
        doc.fontSize(10).fillColor('#444444').text('Subtotal:', 350, y);
        doc.text(`Rs. ${order.totalPrice.toLocaleString()}`, 480, y);
        y += 20;
        if (order.discount > 0) {
            doc.fillColor('#e74c3c').text('Discount:', 350, y); 
            doc.text(`- Rs. ${order.discount.toLocaleString()}`, 480, y);
            y += 20;
        }
        doc.fillColor('#444444').text('Tax (GST Incl.):', 350, y);
        doc.text(`Rs. 0.00`, 480, y); 
        y += 25;
        doc.rect(340, y - 5, 210, 30).fill('#f1f1f1');
        doc.fillColor('#1a4d2e').fontSize(12).text('Grand Total:', 350, y, { bold: true });
        doc.text(`Rs. ${order.finalAmount.toLocaleString()}`, 480, y, { bold: true });
        doc.fontSize(10).fillColor('#777777')
           .text('Terms & Conditions:', 50, 700)
           .fontSize(8)
           .text('1. Goods once sold will not be taken back unless defective.', 50, 715)
           .text('2. This is a computer-generated document, no signature required.', 50, 725);

        doc.end();

    } catch (error) {
        console.error('Invoice Error:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports={
    getorder,
    postorder,
    orderdetails,
    getReturnPage,
    submitReturn,
    getreview,
    postreview,
    downloadInvoice,
    cancelOrderItem,
}