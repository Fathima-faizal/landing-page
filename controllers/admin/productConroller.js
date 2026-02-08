const Product=require('../../models/productSchema')
const Category=require('../../models/categorySchema');
const Brand=require('../../models/brandSchema')
const USer=require('../../models/userSchema')
const fs=require('fs')
const path=require('path');
const sharp=require('sharp');

const loadproduct=async(req,res)=>{
  try {
   res.render('product')
  } catch (error) {
   console.log('product error',error);
   res.status(500).send('Internal server error')
  }
}
 const getaddProduct=async(req,res)=>{
   try {
      const category=await Category.find({isListed:true})
      const brand=await Brand.find({isBlocked:true})
      res.render('addProduct',{
        cat:category,
        brand:brand
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
    if(!productExists){
      const images=[];
      if(req.files&&req.files.length>0){
        for(let i=0;i<req.files.length;i++){
          const orginalImagPath=req.files[i].path;
          const resizeImagePath=path.join('public','uploads','product-imges',req.files[i].filename);
          await sharp(orginalImagPath).resize({width:440,height:440}).toFile(resizeImagePath)
          images.push(req.files[i].filename)
        }
      }
      const categoryid=await category.findOne({name:products.category});
      if(!categoryid){
        return res.status(400).json('invalid category name')
      }
      const newProduct=new Product({
        productName:products.productName,
        description:products.description,
        brand:products.brand,
        category:categoryid._id,
        regularPrice:products.regularPrice,
        salesPrice:products.salesPrice,
        createdOn:new Date(),
        quantity:products.quantity,
        size:products.size,
        productimage:images,
        status:'Available',

      })
      await newProduct.save();
      return res.redirect('addProducts')
    }else{
     return res.status(400).json('Product already Exist please try with another name')
    }
  } catch (error) {
    console.log('add product error',error);
    res.status(500).send('Internal server error')
  }
}

module.exports={
    loadproduct,
    getaddProduct,
    addproducts,
}