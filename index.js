const express = require("express")
const cors = require("cors")
const dotenv = require('dotenv')
const app = express()
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
dotenv.config()


// middleware

app.use(cors())
app.use(express.json())





app.get("/", (req, res)=>{
      res.send("Luxlane server is Running")
})


const varifyJWT = (req, res, next)=>{

  const authorization = req.headers.authorization;

  if(!authorization){
     return res.status(401).send({error: true, message: "unauthorized access"})
  }

  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded)=>{
      if(err){
        return res.status(401).send({error:true, message: "unauthorized access"})
      }

      req.decoded = decoded;
      next()
  })
}










const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_KEY}@cluster0.hmmbger.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

       const productCollection = client.db("LuxLane-DB").collection("Products")
       const userCollection = client.db("LuxLane-DB").collection("users")
       const cartCollection = client.db("LuxLane-DB").collection("carts")


       app.post("/jwt", (req, res)=>{
         
                 const user = req.body; 

                   
                 const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                   
                     expiresIn:"1h"
                 });
                 res.send({token})
       })

       const verifyAdmin = async(req, res, next)=>{
         
                  const email = req.decoded.email;
                  console.log(req.decoded);
                  const query = { email: email}
                  const user = await userCollection.findOne(query)

                  if(user?.role !== "admin"){
                     return res.status(403).send({error: true,  message:"forbidden message"})
                  };
                  next()
       }

       app.get("/users/admin/:email", varifyJWT, async(req, res)=>{
         
                  const email = req.decoded.email;

                  if(req.decoded.email !== email){
                     res.send({ admin:false})
                  }
                  const query = {email: email};
                  const user = await userCollection.findOne(query)

                  const result = {admin: user?.role == "admin"}
                  res.send(result)
       } )
       app.get("/users/adminpro/:email",varifyJWT, verifyAdmin, async(req, res)=>{
         
                  const email = req.decoded.email;

                  if(req.decoded.email !== email){
                     res.send({ admin:false})
                  }
                  const query = {email: email};
                  const user = await userCollection.findOne(query)

                  const result = {admin: user?.role == "admin"}
                  res.send(result)
       } )


       app.get("/products", async(req, res)=>{

            const result = await productCollection.find().toArray()
            res.send(result)
       })

       app.post("/products", async(req, res)=>{
          
                const product = req.body;
                const result = await productCollection.insertOne(product);
                res.send(result)
       })

       app.get("/products/my", async(req, res)=>{
                   const email = req.query.email;
                   const query ={email :email}
                   const result = await productCollection.find(query).toArray()
                   res.send(result)
       })


      app.get("/products/:id", async(req, res)=>{

          const id = req.params.id;
          console.log(id);
          const query = { _id : new ObjectId(id)}
          const result = await productCollection.find(query).toArray()
          res.send(result)

      })

      app.post("/users", async(req, res)=>{
             const user = req.body;
             console.log(user);
             const result = await userCollection.insertOne(user)
             res.send(result)
      })

      app.patch("/user/admin/:id", async(req, res)=>{
               
                 const id= req.params.id;
                 const query = {_id: new ObjectId(id)}
                 const updateDoc = {
                          $set:{
                             role: "admin"
                          },
                 };
                 const result = await userCollection.updateOne(query, updateDoc)
                 res.send(result)
      })

      app.get("/users", async(req, res)=>{
               
                 const result = await userCollection.find().toArray();
                 res.send(result)
      })

      app.delete("/user/:id", async(req, res)=>{

                 const id = req.params.id;
                 const query = {_id: new ObjectId(id)}
                 const result = await userCollection.deleteOne(query)
                 res.send(result)
      })

      app.post("/carts", async(req, res)=>{  


          const item = req.body;
          console.log(item);
          const result = await cartCollection.insertOne(item);
          res.send(result)

      })


      app.get("/carts/:id", async(req, res)=>{

        const id = req.params.id;
        const query = {_id : new ObjectId(id)}
        const result = await cartCollection.find(query).toArray()
        res.send(result)
      })

      app.get("/cart", async(req, res)=>{
                 
                 const result = await cartCollection.find().toArray()
                 res.send(result)
      })


      app.get("/carts",varifyJWT, async(req, res)=>{

         const email = req.query.email;
        

         if(!email){
               res.send([]);
         }

         const decodedEmail = req.decoded.email;

         if(email !== decodedEmail){
          return res.status(403).send({error: true, message: "forbidden access"})
         }

         const query = { email : email}
         
         const result = await cartCollection.find(query).toArray()
         res.send(result)

      })


      app.delete("/cart/:id", async(req, res)=>{

 
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await cartCollection.deleteOne(query)
        res.send(result)


      })
      

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, ()=>{
    console.log(`Luxlane server running on ${port}`);
})