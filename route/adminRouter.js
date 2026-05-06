const express=require('express');
const router=express.Router();
const adminController=require('../controllers/admin/adminController');
const customerController=require('../controllers/admin/customerController')
const brandController=require('../controllers/admin/brandController');
const productController=require('../controllers/admin/productConroller')
const categoryController=require('../controllers/admin/categoryController');
const orderController=require('../controllers/admin/orderController');
const couponController=require('../controllers/admin/couponController');
const offerController=require('../controllers/admin/offerController');
const bannerController=require('../controllers/admin/bannerController')
const {userAuth,adminAuth}=require('../middleware/auth')
const multer=require('multer');
const {storage}=require('../helpers/multer');
const uploads=multer({storage:storage})

               //Admin login//

router.get('/login',adminController.adminLoginloaded);
router.post('/login',adminController.adminlogin);
router.get('/dashboard',adminAuth,adminController.loaddashboard);
router.get('/salesReport',adminAuth,adminController.salesreport)
router.get('/logout',adminController.admilogout)

              //customer Management//

router.get('/customer',adminAuth,customerController.customerinfo);
router.get('/blockCustomer',adminAuth,customerController.bolckCustomer);
router.get('/unblockCustomer',adminAuth,customerController.unblockCustomer);

               //brand Management//

router.get('/brand',adminAuth,brandController.getbrand);
router.get('/addbrand',adminAuth,brandController.getaddbrand);
router.post('/brand',adminAuth,brandController.postaddbrand);
router.get('/editBrand/:id',adminAuth,brandController.geteditbrand);
router.post('/editBrand/:id',adminAuth,brandController.posteditbrand);
router.get('/deleteBrand',adminAuth,brandController.deletebrand);
router.get('/blockBrand',adminAuth,brandController.blockbrand);
router.get('/unblockBrand',adminAuth,brandController.unblockbrand);

        //   Category Management  //

router.get('/category',adminAuth,categoryController.loadcategory);
router.get('/addCategory',adminAuth,categoryController.getaddCategory)
router.post('/category',adminAuth,categoryController.addCategory);
router.get('/editCategory/:id',adminAuth,categoryController.editCategory);
router.post('/editCategory/:id',adminAuth,categoryController.editpostCategory);
router.get('/deleteCategory',adminAuth,categoryController.deleteCategory)
router.get('/listCategory',adminAuth,categoryController.listCategory);
router.get('/unlistCategory',adminAuth,categoryController.unlistCategory);

             //product Management//

router.get('/product',adminAuth,productController.loadproduct)
router.get('/addProduct',adminAuth,productController.getaddProduct)
router.post('/product',adminAuth,uploads.array('productimage',4),productController.addproducts);
router.get('/blockProduct',adminAuth,productController.blockProduct);
router.get('/unblockProduct',adminAuth,productController.unblockProduct)
router.get('/editProduct/:id',adminAuth,productController.editProduct);
router.post('/editProduct/:id',adminAuth,uploads.array('productimage',4),productController.posteditProduct);
router.get('/deleteProduct',adminAuth,productController.deleteProduct);

                      //order Management//

 router.get('/orderManagement',adminAuth,orderController.getorders)                     
 router.patch('/updateItemStatus',adminAuth,orderController.updateItemStatus)
 router.get('/Views/:orderId',adminAuth,orderController.viewdetails)

                     //review Management//

 router.get('/Reviews',adminAuth,orderController.getReview);
 router.get('/deletereview',adminAuth,orderController.deleteReview)
         
                         //Coupon Management//
 router.get('/couponManagement',adminAuth,couponController.getcoupon)   
 router.get('/addCoupon',adminAuth,couponController.addcoupon);
 router.post('/couponManagement',adminAuth,couponController.postcoupon)                      
 router.get('/editCoupon/:id',adminAuth,couponController.editcoupon)
 router.post('/editCoupon/:id',adminAuth,couponController.posteditCoupon)
 router.get('/listCoupon',adminAuth,couponController.listCoupon);
 router.get('/unlistCoupon',adminAuth,couponController.unlistCoupon)
 router.get('/deleteCoupon',adminAuth,couponController.deleteCoupon)

                     //Inventory Management//

router.get('/inventory',adminAuth,productController.getinventory)
router.post('/updateStock', adminAuth,productController.updateStock);

                         //offer Management//

router.get('/offer',adminAuth,offerController.loadoffer);
router.get('/addOffer',adminAuth,offerController.getaddoffer);
router.post('/offer',adminAuth,offerController.postoffer);
router.get('/editOffer/:id',adminAuth,offerController.editoffer);
router.post('/editOffer/:id',adminAuth,offerController.editpostoffer);
router.get('/deleteOffer',adminAuth,offerController.deleteoffer)                        
router.get('/activeOffer',adminAuth,offerController.activeoffer);
router.get('/unactiveOffer',adminAuth,offerController.unactiveoffer)

                     //bannner Manamagement//

router.get('/banner',adminAuth,bannerController.loadbanner);
router.get('/addBanner',adminAuth,bannerController.getaddbanner);
router.post('/banner',adminAuth,uploads.single('bannerImage'),bannerController.postbanner)
router.get('/deleteBanner',adminAuth,bannerController.deletebanner)


module.exports=router;