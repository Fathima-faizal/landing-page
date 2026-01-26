const express=require('express');
const router=express.Router();
const adminController=require('../controllers/admin/adminController');



router.get('/login',adminController.adminLoginloaded);
router.post('/login',adminController.adminlogin);
router.get('/dashboard',adminController.loaddashboard);



module.exports=router;