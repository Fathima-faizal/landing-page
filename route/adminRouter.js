const express=require('express');
const router=express.Router();
const adminController=require('../controllers/admin/adminController');
const customerController=require('../controllers/admin/customerController')
const brandController=require('../controllers/admin/brandController');
const productController=require('../controllers/admin/productConroller')
const categoryController=require('../controllers/admin/categoryController');
const orderController=require('../controllers/admin/orderController')
const {userAuth,adminAuth}=require('../middleware/auth')
const multer=require('multer');
const storage=require('../helpers/multer');
const uploads=multer({storage:storage})

               //Admin login//

router.get('/login',adminController.adminLoginloaded);
router.post('/login',adminController.adminlogin);
router.get('/dashboard',adminAuth,adminController.loaddashboard);
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
 router.patch('/updateStatus/:id',adminAuth,orderController.updatestatus)
 router.get('/Views/:orderId',adminAuth,orderController.viewdetails)

                     //review Management//

 router.get('/Reviews',adminAuth,orderController.getReview);
 router.get('/deletereview',adminAuth,orderController.deleteReview)
         
                       //contact //

 router.get('/Contact',adminAuth,orderController.getcontact)                      
 router.post('/updateReturnStatus',adminAuth,orderController.updatereturn)

 





 
module.exports=router;