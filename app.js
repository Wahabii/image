const express=require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const multer= require('multer');
const path=require('path');
const Joi = require('joi');
const fs = require('fs');
//generate the files names 
const crypto=require('crypto');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodeOverride = require('method-override');
const mongoose=require('mongoose');
//init app 
const app= express();

//middleware

app.use(bodyParser.json());
app.use(methodeOverride('_method'));

// mongo URI
 
const mongoURI = 'mongodb://localhost/playground';

//create mongo connection 

const conn = mongoose.createConnection(mongoURI);

//init gfs 
conn.once('open', ()=> {
//init stream
 gfs = Grid(conn.db, mongoose.mongo);
 gfs.collection('uploads');
})

//create storage engine 

const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });

app.set('view engine','ejs');
app.use(express.json());
//connected to mongodb

mongoose.connect('mongodb://localhost/playground', { useNewUrlParser: true } )
.then(() => console.log('login success.. '))
.catch((err)=> console.log(err));

//@router GET

app.get('/', (req , res) =>{

   res.render('index');
});

//@router GET files

app.get('/files', (req,res)=>{

gfs.files.find().toArray((err,files)=>{
 //check if files 
 if (!files || files.length===0){
return res.status(404).json({

 err:'no files exist'

});
 }
//files exist
return res.json(files);
});
});

//@router GET /files /:filename

app.get('/files/:filename', (req,res)=>{

gfs.files.findOne({filename:req.params.filename}, (err,files)=>{
  //check if files 
 if (!files || files.length===0){
    return res.status(404).json({
    
     err:'no files exist'
    
    });
     }
     //file existe
     return res.json(files);


    })
   
    });

//@router GET /image /:filename

app.get('/image/:filename', (req,res)=>{

    gfs.files.findOne({filename:req.params.filename}, (err,files)=>{
      //check if files 
     if (!files || files.length===0){
        return res.status(404).json({
        
         err:'no files exist'
        
        });
         }
         
          // check if image

          if(files.contentType === 'image/jpeg' || files.contentType === 'img/png'){
            //read output to browser 
            const readstream = gfs.createReadStream(files.filename);
            readstream.pipe(res);
          }
          else{

            res.status(404).json({

                err:'not is image'


            });


          }

    
    
        })
       
        });


 //@router delete file 
 
 app.delete('/files/:id', (req,res)=>{
  /*
    gfs.remove({_id: req.params.id, root:'uploads'}, (err, gridStore)=>{
   if (err) {
       return res.status(404).json({err: err});
   }

   res.redirect('/');
  
});

*/


const id = req.params.id;
gfs.findOne({_id: id , root:'uploads'}).then( (g) => {
    g.delete();
    res.send({message:"course have been deleted successfuly"});
}).catch((errors) => {
res.send(errors);
}
);  
 });
        
//@router POST
app.post('/upload',upload.single('myimage') , (req,res)=> {
   
   res.json({file:req.file});
   //res.redirect('/');
});




const port=4000;

app.listen(port, () => console.log(`server connected with ${port} `));


