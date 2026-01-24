const express=require('express');
const router=express.Router();
const userControllers=require('../controllers/user/userController')


router.get('/landing',userControllers. loadLandingpage)



module.exports=router