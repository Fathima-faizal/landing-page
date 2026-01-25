const express=require('express');
const router=express.Router();
const userControllers=require('../controllers/user/userController')


router.get('/landing',userControllers. loadLandingpage)
router.get('/login',userControllers.loginPage)
router.get('/signup',userControllers.signupPage)
router.post('/signup',userControllers.signup)

module.exports=router