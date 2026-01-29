const express=require('express');
const router=express.Router();
const adminController=require('../controllers/admin/adminController');
const customerController=require('../controllers/admin/customerController')
const {userAuth,adminAuth}=require('../middleware/auth')



router.get('/login',adminController.adminLoginloaded);
router.post('/login',adminController.adminlogin);
router.get('/dashboard',adminAuth,adminController.loaddashboard);
router.get('/logout',adminController.admilogout)
router.get('/customer',adminAuth,customerController.customerinfo);
router.get('/blockCustomer',adminAuth,customerController.bolckCustomer);
router.get('/unblockCustomer',adminAuth,customerController.unblockCustomer);

module.exports=router;