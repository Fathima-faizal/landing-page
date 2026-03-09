const User=require('../../models/userSchema');
const Product=require('../../models/productSchema');
const Cart=require('../../models/cartSchema');
const Address=require('../../models/addressSchema');
const Order=require('../../models/orderSchema');
const PDFdocument=require('pdfkit')
  
const getorder = async(req, res) => {
    try {
        const userId = req.session.user;
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
            search
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
        const orderId=req.params.id;
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
            currentPage: page,
            totalPages: totalPages,
            addressData:addressData
        })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server errror')
    }
}
const getReturnPage = async (req, res) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate({
            path:'orderedItems.productId',
            populate: { path: 'category' }
        });
        
        if (!order) {
            return res.redirect('/order');
        }
        
        res.render('return', { order });
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
        let totalRefundAmount = 0;
        for (const item of order.orderedItems) {
            if (itemsToReturn.includes(item.productId.toString())) {
                item.status = 'return';
                item.returnReason = reason;
                totalRefundAmount += item.price * item.quantity;
                await Product.findByIdAndUpdate(item.productId, {
                    $inc: { quantity: item.quantity }
                });
            }
        }
        if (totalRefundAmount > 0) {
            const user = await User.findById(userId);
            if (user) {
                user.wallet = (user.wallet || 0) + totalRefundAmount;
        order.status = 'return';
        user.history.push({
                    description: `Refund for Order #${orderId.toString().slice(-6)}`,
                    amount: totalRefundAmount,
                    type: 'credit',
                    status: 'Completed',
                    date: new Date()
                });
                
                await user.save();
            }
        }
        order.status = 'return'; 
        await order.save();

        return res.json({ 
            status: true, 
            message: "Amount refunded to your wallet",
            refundedAmount: totalRefundAmount 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error submitting return");
    }
};
const cancelOrderItem = async (req, res) => {
    try {
        const { orderId, productId } = req.body
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        const itemIndex = order.orderedItems.findIndex(item => item.productId.toString() === productId);
        if (itemIndex > -1) {
            const item = order.orderedItems[itemIndex];
            await Product.findByIdAndUpdate(productId, {
                $inc: { quantity: item.quantity }
            });
            order.orderedItems.splice(itemIndex, 1);
            if (order.orderedItems.length === 0) {
                order.status = 'cancelled';
            }
            await order.save();
            return res.json({ success: true, message: "Item cancelled and stock updated" });
        }
        res.json({ success: false, message: "Item not found" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
const getreview = async (req, res) => {
    try {
         const {orderId,productId}=req.params;
    const order=await Order.findById(orderId).populate({
            path:'orderedItems.productId',
            populate: {
                path: 'category' 
            }
        });
     const item = order.orderedItems.find(i => i.productId._id.toString() === productId);
     res.render('review', { order, item });
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
        const addressData = await Address.findOne({ "address._id": order.address });
        const addr = addressData ? addressData.address.find(a => a._id.toString() === order.address.toString()) : null;
        const doc = new PDFdocument({ margin: 50, size: 'A4' });
        const fileName = `VisionVogue_Invoice_${order._id}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        doc.pipe(res);
        doc.fillColor('#1a4d2e').fontSize(25).text('VisionVogue', { align: 'left' });
        doc.fillColor('#444444').fontSize(10).text('Your Vision, Our Style', { align: 'left' });
        doc.fillColor('#444444')
           .text('VisionVogue Eyewear Ltd.', 400, 50, { align: 'right' })
           .text('Email: support@visionvogue.com', { align: 'right' })
           .text('Phone: +91 8923457190', { align: 'right' });
        doc.moveDown();
        doc.moveTo(50, 100).lineTo(550, 100).strokeColor('#eeeeee').stroke();
        doc.moveDown();
        doc.fillColor('#1a4d2e').fontSize(20).text('INVOICE', 50, 120);
        doc.fillColor('#444444').fontSize(10);
        doc.text(`Invoice Number: INV-${order._id.toString().slice(-6).toUpperCase()}`, 50, 145);
        doc.text(`Order Date: ${new Date(order.createdOn).toLocaleDateString()}`, 50, 160);
        doc.text(`Payment Method: ${order.paymentMethod || 'Cash on delivery'}`, 50, 175);
        doc.fontSize(12).fillColor('#1a4d2e').text('Bill To:', 350, 120);
        doc.fontSize(10).fillColor('#444444');
        const userName = order.userId ? order.userId.name : 'Customer';
        doc.text(userName, 350, 140);
        doc.fontSize(12).fillColor('#1a4d2e').text('Bill To:', 350, 120);
        doc.fontSize(10).fillColor('#444444');
        doc.text(order.userId ? order.userId.name : 'Customer', 350, 140);
        if (addr) {
            let currentY = 155;
            doc.text(`${addr.houseName || ''}`, 350, currentY);
            currentY += 15;
            doc.text(`${addr.street || ''}`, 350, currentY);
            currentY += 15;
            doc.text(`${addr.city}, ${addr.country} - ${addr.zipCode}`, 350, currentY);
            currentY += 15;
            doc.text(`Tel: ${addr.phoneNumber}`, 350, currentY);
        } else {
            doc.text('Address details unavailable', 350, 155);
        }
        const tableTop = 230;
        doc.rect(50, tableTop, 500, 25).fill('#1a4d2e');
        doc.fillColor('#ffffff').fontSize(10);
        doc.text('Item Description', 60, tableTop + 8);
        doc.text('Qty', 280, tableTop + 8);
        doc.text('Unit Price', 350, tableTop + 8);
        doc.text('Total', 480, tableTop + 8);
        let y = tableTop + 30;
        order.orderedItems.forEach((item, index) => {
            if (index % 2 === 0) {
                doc.rect(50, y - 5, 500, 20).fill('#f9f9f9');
            }
            doc.fillColor('#444444');
            doc.text(item.productId.productName, 60, y);
            doc.text(item.quantity.toString(), 280, y);
            doc.text(`Rs. ${item.price.toLocaleString()}`, 350, y);
            doc.text(`Rs. ${(item.quantity * item.price).toLocaleString()}`, 480, y);
            y += 20;
        });
        y += 20;
        doc.moveTo(50, y).lineTo(550, y).strokeColor('#eeeeee').stroke();
        y += 15;
        doc.fontSize(10).fillColor('#444444').text('Subtotal:', 350, y);
        doc.text(`Rs. ${order.totalPrice.toLocaleString()}`, 480, y);
        y += 20;
        doc.fillColor('#1a4d2e').fontSize(14).text('Grand Total:', 350, y, { bold: true });
        doc.text(`Rs. ${order.finalAmount.toLocaleString()}`, 480, y, { bold: true });
        doc.fontSize(10).fillColor('#999999').text('This is a computer generated invoice and does not require a physical signature.', 50, 750, { align: 'center' });
        doc.end();

    } catch (error) {
        console.error('Invoice Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

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