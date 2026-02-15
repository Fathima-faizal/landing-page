const Category=require('../../models/categorySchema');


const loadcategory=async(req,res)=>{
    try {
        let search = req.query.search || '';
        const page=parseInt(req.query.page)||1;
        const limit=4;
        const skip=(page-1)*limit;
        const categoryData=await Category.find({
            name:{$regex:search,$options:"i"}
        })
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
 
       const totalCategories=await Category.countDocuments({
           name:{$regex:search,$options:"i"}
       });
       const totalPages=Math.ceil(totalCategories/limit);
       res.render('category',{
        cat:categoryData,
        currentPage:page,
        totalPages:totalPages,
        totalCategories:totalCategories,
        search:search,
       })
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const getaddCategory=async(req,res)=>{
    try {
       res.render('addCategory') 
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server errror')
    }
}
const addCategory=async(req,res)=>{
    const{name,description}=req.body;
    try {
        const existingCategory=await Category.findOne({name});
        if(existingCategory){
           return res.status(400).json({message:`Category already Exists`})
        }
        const newCategory=new Category({
            name,
            description,
        })
        await newCategory.save();
        return res.redirect('/admin/category');
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}

const editCategory=async(req,res)=>{
    try {
        const id=req.params.id;
        const category=await Category.findById(id);
        res.render('editCategory',{category:category})
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const editpostCategory=async(req,res)=>{
    try {
        const id=req.params.id;
        const {name,description}=req.body;
        const existingCategory=await Category.findOne({
                name:name,
                 _id: { $ne: id },
            });
        if(existingCategory){
            return res.status(400).json({message:`Category exists, please choose another name`})
        }
        const updateCategory=await Category.findByIdAndUpdate(id,{
            name:name,
            description:description,
        },{new:true});
        if(updateCategory){
            res.redirect('/admin/category')
        }else{
           res.status(400).json({error:'Category not found'})
        }
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const deleteCategory=async(req,res)=>{
    try {
        let id=req.query.id;
        await Category.findByIdAndDelete(id);
        res.redirect('/admin/category')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const listCategory=async(req,res)=>{
    try {
        let id=req.query.id;
        await Category.updateOne({
            _id:id
        },{
            $set:{islisted:true}
        })
        res.redirect('/admin/category')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}
const unlistCategory=async(req,res)=>{
    try {
        let id=req.query.id;
        await Category.updateOne({
            _id:id
        },{
            $set:{islisted:false}
        })
        res.redirect('/admin/category')
    } catch (error) {
        console.log('error',error);
        res.status(500).send('Internal server error')
    }
}


module.exports={
    loadcategory,
    addCategory,
    getaddCategory,
    editCategory,
    editpostCategory,
    deleteCategory,
    listCategory,
    unlistCategory,
}