const express=require('express');
const router=express.Router();
const adminController=require('../controllers/admin/adminController');
const customerController=require('../controllers/admin/customerController')
const productController=require('../controllers/admin/productConroller')
const categoryController=require('../controllers/admin/categoryController')
const {userAuth,adminAuth}=require('../middleware/auth')
const multer=require('multer');
const storage=require('../helpers/multer');
const uploads=multer({storage:storage})



router.get('/login',adminController.adminLoginloaded);
router.post('/login',adminController.adminlogin);
router.get('/dashboard',adminAuth,adminController.loaddashboard);
router.get('/logout',adminController.admilogout)
router.get('/customer',adminAuth,customerController.customerinfo);
router.get('/blockCustomer',adminAuth,customerController.bolckCustomer);
router.get('/unblockCustomer',adminAuth,customerController.unblockCustomer);
router.get('/product',adminAuth,productController.loadproduct)
router.get('/addProduct',adminAuth,productController.getaddProduct)
router.post('/product',adminAuth,uploads.array('productimage',3),productController.addproducts);
router.get('/blockProduct',adminAuth,productController.blockProduct);
router.get('/unblockProduct',adminAuth,productController.unblockProduct)
router.get('/editProduct/:id',adminAuth,productController.editProduct);
router.post('/editProduct/:id',adminAuth,uploads.array('productimage',3),productController.posteditProduct);
router.get('/deleteProduct',adminAuth,productController.deleteProduct)
router.get('/category',adminAuth,categoryController.loadcategory);
router.get('/addCategory',adminAuth,categoryController.getaddCategory)
router.post('/category',adminAuth,categoryController.addCategory);
router.get('/editCategory/:id',adminAuth,categoryController.editCategory);
router.post('/editCategory/:id',adminAuth,categoryController.editpostCategory)
router.get('/deleteCategory',adminAuth,categoryController.deleteCategory)
router.get('/listCategory',adminAuth,categoryController.listCategory);
router.get('/unlistCategory',adminAuth,categoryController.unlistCategory);


module.exports=router;