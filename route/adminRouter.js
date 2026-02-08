const express=require('express');
const router=express.Router();
const adminController=require('../controllers/admin/adminController');
const customerController=require('../controllers/admin/customerController')
const productController=require('../controllers/admin/productConroller')
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
router.post('/addProducts',adminAuth,uploads.array('images',3),productController.addproducts)


module.exports=router;