const Product=require('../../models/productSchema')
const Category=require('../../models/categorySchema');
const Brand=require('../../models/brandSchema');
const Offer=require('../../models/offerSchema')
const fs=require('fs')
const path=require('path');
const sharp=require('sharp');

async function applyBestOffer(product) {
    try {
        const activeOffers = await Offer.find({ isActive: true });
        let productDiscount = 0;
        let categoryDiscount = 0;
        const pOffer = activeOffers.find(o => o.offerType === 'Product' && o.productId?.toString() === product._id.toString());
        if (pOffer) productDiscount = pOffer.discountPercentage;
        const cOffer = activeOffers.find(o => 
            o.offerType === 'Category' && 
            o.categoryId?.toString() === (product.category._id ? product.category._id.toString() : product.category.toString())
        );
        if (cOffer) categoryDiscount = cOffer.discountPercentage;
        const bestDiscount = Math.max(productDiscount, categoryDiscount);
        const discountAmount = Math.floor(product.regularPrice * (bestDiscount / 100));
        product.salesPrice = product.regularPrice - discountAmount;
        await Product.findByIdAndUpdate(product._id, { salesPrice: product.salesPrice });
        return bestDiscount;
    } catch (err) {
        console.log("Offer calculation error:", err);
    }
}
const loadproduct = async (req, res) => {
    try {
        let search = req.query.search || '';
        let page = parseInt(req.query.page) || 1;
        const limit = 5;
        const ProductData = await Product.find({
            productName: { $regex: search, $options: "i" }
        })
        .populate('category') 
        .sort({ createdOn: -1 })
        .limit(limit)
        .skip((page - 1) * limit);
        const count = await Product.countDocuments({
            productName: { $regex: search, $options: "i" }
        });

        res.render('product', {
            data: ProductData,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            search: search
        });

    } catch (error) {
        console.log('error', error);
        res.status(500).send('Internal server error');
    }
};

 const getaddProduct=async(req,res)=>{
   try {
      const category=await Category.find({islisted:true})
      const brand=await Brand.find({isBlocked:false})
      res.render('addProduct',{
        cat:category,
        brand:brand,
      })
   } catch (error) {

    console.log('proudct error',error);
    res.status(500).send('Internal server error')
   }
 }
const addproducts=async(req,res)=>{
  try {
    const products=req.body;
    const productExists=await Product.findOne({
      productName:products.productName,

    })
    const {productName,description,regularPrice,salesPrice,quantity}=req.body;
    if(!productName||!description||!regularPrice||!salesPrice||!quantity){
      res.redirect('/admin/addProduct')
    }
    if(!productExists){
      const images=[];
     if (req.files && req.files.length > 0) {
    for (let i = 0; i < req.files.length; i++) {
        const originalPath = req.files[i].path;
        const filename = `resized-${req.files[i].filename}`;
        const savePath = path.join(process.cwd(), 'public', 'uploads', filename);

        await sharp(originalPath)
            .resize({ width: 440, height: 440 })
            .toFile(savePath);
            fs.unlinkSync(originalPath);

        images.push(filename);
    }
}

      const categoryid=await Category.findOne({name:products.category});
      if(!categoryid){
        return res.status(400).json('invalid category name')
      }
      const newProduct=new Product({
        productName:products.productName,
        description:products.description,
        brand:products.brand,
        category:categoryid._id,
        regularPrice:products.regularPrice,
        salesPrice:products.regularPrice,
        createdOn:new Date(),
        quantity:products.quantity,
        color:products.color,
        size:products.size,
        productimage:images,
        status:'Available',

      })
      const savedProduct = await newProduct.save();
      await applyBestOffer(savedProduct);
      return res.redirect('/admin/product')
    }else{
     return res.status(400).json('Product already Exist please try with another name')
    }
  } catch (error) {
    console.log('add product error',error);
    res.status(500).send('Internal server error')
  }
}
const blockProduct=async(req,res)=>{
 try {
   let id=req.query.id;
   await Product.updateOne({
       _id:id
   },{
    $set:{isBlocked:true}
   })
   res.redirect('/admin/product')
 } catch (error) {
   console.log('error',error)
   res.status(500).send('Internal server error')
 }
}
const unblockProduct=async(req,res)=>{
    try {
      let id=req.query.id;
      await Product.updateOne({
        _id:id
      },{
        $set:{isBlocked:false}
      })
      res.redirect('/admin/product')
    } catch (error) {
       console.log('unblock error',error);
       res.status(500).send('Internal server error')
    }
}
const editProduct=async(req,res)=>{
   try {
     const id=req.params.id;
     const product=await Product.findOne({_id:id}).populate('category');;
     const category=await Category.find({islisted:true});
     const brand=await Brand.find({isBlocked:false})
     res.render('edit-product',{
     product:product,
     cat:category,
     brand:brand,
     })
   } catch (error) {
     console.log('edit error',error);
     res.status(500).send('Internal server error')
   }
}
const posteditProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        
        const product = await Product.findById(id);
        
  
        let images = product.productimage || []; 

        if (data.removedImages) {
          try{
            const removed = JSON.parse(data.removedImages); 
            images = images.filter(img => !removed.includes(img));
          }catch(e){
            console.error("Error parsing removedImages:", e);
          }
        }
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                images.push(file.filename);
            });
        }

        const updateData = {
            productName: data.productName,
            description: data.description,
            category: data.category,
            brand:data.brand,
            regularPrice: data.regularPrice,
            salesPrice: data.regularPrice,
            quantity: data.quantity,
            color:data.color,
            productimage: images,
        };

        await Product.findByIdAndUpdate(id, updateData, { new: true });
        res.redirect("/admin/product");

    } catch(error) {
        console.error("Update Error:", error);
        res.status(500).send("Error updating product");
    }
};

const deleteProduct=async(req,res)=>{
try {
  let id=req.query.id;
  await Product.findByIdAndDelete(id);
  res.redirect('/admin/product')
} catch (error) {
  console.log('delete error',error);
  res.status(500).send('Internal server error')
}
}
const getinventory=async(req,res)=>{
  const page=parseInt(req.query.page)||1;
  let search=req.query.search||'';
  const limit=5;
  const skip=(page-1)*limit;
   let query={};
        if(search){
            query.productName={$regex:search,$options:'i'}
        }
  const totalorder=await Product.countDocuments(query)
   const products=await Product.find(query)
   .populate('category')
   .sort({createdOn:-1})
   .skip(skip)
  .limit(limit)
   res.render('inventory',{
    products,
    currentPage:page,
    totalPages:Math.ceil(totalorder/limit),
    search,
  })
}
 const updateStock=async(req,res)=>{
  try {
    const { productId, newQuantity } = req.body;
    if (newQuantity < 0) {
            return res.json({ status: false, message: 'Stock cannot be negative' });
        }
        await Product.findByIdAndUpdate(productId, {
            $set: { quantity: newQuantity }
        });
        res.json({ status: true, message: 'Stock updated successfully!' });
  } catch (error) {
    console.log('error',error);
    res.status(500).send('server internal error')
  }
 }
module.exports={
    applyBestOffer,
    loadproduct,
    getaddProduct,
    addproducts,
    blockProduct,
    unblockProduct,
    editProduct,
    posteditProduct,
    deleteProduct,
    getinventory,
    updateStock,
}