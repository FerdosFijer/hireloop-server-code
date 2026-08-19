const express = require('express');
const app = express()
require('dotenv').config();
const cors = require('cors');
const port = process.env.PORT || 5000
const uri = process.env.MONGO_DB_URI;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors())
app.use(express.json())
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    const db = client.db("hireloop_db");
    const jobcollection = db.collection("jobs");
    const companyCollection = db.collection("companies");
    const usersCollection = db.collection("user");

      /*  --------- uer related apis---------- */
    
    app.get('/api/user', async (req, res) => {
      const cursor = usersCollection.find().skip(2);
      const result = await cursor.toArray();
      res.send(result);
    })

       /* -------- Job related apis---------- */    

    app.get("/api/jobs", async (req, res) =>{
        const query = {};
        if(req.query.companyId){
            query.companyId = req.query.companyId;
        }
        if(req.query.status){
            query.status= req.query.status;
        }
        const result = await jobcollection.find(query).toArray();
        res.json(result); 
    })

    app.get("/api/jobs/:id", async (req, res) =>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await jobcollection.findOne(query);
        res.json(result); 
    })

    app.post('/api/jobs', async (req, res)=>{
        const job = req.body;
        const newJob ={
          ...job,
          createdAt: new Date()
        }
        const result = await jobcollection.insertOne(newJob);     
        res.send(result)                                                                                                                                                                      
    } )

       /* -------- company related apis ---------- */

    app.get('/api/companies', async (req, res) =>{
      const cursor = companyCollection.find().skip(1);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get('/api/my/companies', async (req, res) => {
    const query = {};
    if (req.query.recruiterId) {
      query.recruiterId = req.query.recruiterId;
    }
    const result = await companyCollection.findOne(query);
    res.send(result || {});
    });

    app.post('/api/companies', async (req, res)=>{
        const company = req.body;
        const newcompany ={
          ...company,
          createdAt: new Date()
        }
        const result = await companyCollection.insertOne(newcompany);     
        res.send(result)                                                                                                                                                                      
    } )




    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})