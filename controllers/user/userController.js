const loadLandingpage=async(req,res)=>{
    try{
      return res.render('landing')
    }catch(error){
        console.log('landing page not found')
        res.status(500).send('server error')
    }
}






module.exports={
    loadLandingpage,
}