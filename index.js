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
    const applicationCollection = db.collection("applications")
    const planCollection = db.collection("plans")
    const subscriptionCollection = db.collection('subscriptions')

    /*  --------- uer related apis---------- */

    app.get('/api/user', async (req, res) => {
      const cursor = usersCollection.find().skip(2);
      const result = await cursor.toArray();
      res.send(result);
    })

    /* -------- Job related apis---------- */

    app.get("/api/jobs", async (req, res) => {
      const query = {};
      if (req.query.companyId) {
        query.companyId = req.query.companyId;
      }
      if (req.query.status) {
        query.status = req.query.status;
      }
      const result = await jobcollection.find(query).toArray();
      res.json(result);
    })

    app.get("/api/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await jobcollection.findOne(query);
      res.json(result);
    })

    app.post('/api/jobs', async (req, res) => {
      const job = req.body;
      const newJob = {
        ...job,
        createdAt: new Date()
      }
      const result = await jobcollection.insertOne(newJob);
      res.send(result)
    })
    /* -------- Application related apis ---------- */

    app.get('/api/applications', async (req, res) => {
      const query = {};
      if (req.query.applicantId) {
        query.applicantId = req.query.applicantId;
      }
      if (req.query.jobId) {
        query.jobId = req.query.jobId;
      }
      const cursor = applicationCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    })

    app.post('/api/applications', async (req, res) => {
      const application = req.body;
      const newApplication = {
        ...application,
        createdAt: new Date()
      }
      const result = await applicationCollection.insertOne(newApplication);
      res.send(result)
    })

    /* -------- company related apis ---------- */

    // app.get('/api/companies', async (req, res) => {
    //   const cursor = companyCollection.find().skip(1);
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });
    //! companies skip one manually and font end a for of diyei data dekassi fontend e
    app.get('/api/companies', async (req, res) => {
      const cursor = companyCollection.find().skip(1)
      const companies = await cursor.toArray();
      for (const company of companies){
        const filter ={
          companyId: company._id.toString()
        }
        const jobCount = await jobcollection.countDocuments(filter)
        company.jobCount = jobCount
      }
      res.send(companies);
    });

    /* skip start here  */

    //! companies skip two by mongodb aggregate pipelline diye kora jay but font end a kichu korini next 13 lines
    app.get('/api/companies2', async (req, res) => {
      const pipeline= [
        {
          $skip: 2
        },
        {
          $limit: 2
        }
      ]
      const cursor = companyCollection.aggregate(pipeline);
      const result = await cursor.toArray();
      res.send(result);
    });
    //! jobs mongodb aggregate pipelline siklam and data pawa siklam but font end e use korbo na next 25 ta lines
    app.get('/api/job2', async (req, res) => {
      const pipeline= [
        {
          $group: {
            _id: '$type',
            count:{
              $sum:1
            }
          }
        },
        {
          $project:{
            jobType: '$_id',
            count:1,
            _id:0
          }
        },
        {
          $sort: { count: -1}
        }
      ]
      const cursor = jobcollection.aggregate(pipeline);
      const result = await cursor.toArray();
      res.send(result);
    });

    /* skip finish here  */

    app.get('/api/my/companies', async (req, res) => {
      const query = {};
      if (req.query.recruiterId) {
        query.recruiterId = req.query.recruiterId;
      }
      const result = await companyCollection.findOne(query);
      res.send(result || {});
    });

    app.post('/api/companies', async (req, res) => {
      const company = req.body;
      const newcompany = {
        ...company,
        createdAt: new Date()
      }
      const result = await companyCollection.insertOne(newcompany);
      res.send(result)
    })

    app.patch('/api/companies/:id', async (req, res) => {
      const id = req.params.id;
      const updatedCompany = req.body; 
      const filter = {_id : new ObjectId(id)}; 
      const updateDocument = {
        $set: {
          status: updatedCompany.status
        },
      };
      const result = await companyCollection.updateOne(filter, updateDocument)
      res.send(result)
    })

    /* --------- plans related Apis ----------- */

    app.get('/api/plans', async (req, res) => {
      const query = {}
      if (req.query.plan_id) {
        query.id = req.query.plan_id
      }
      const plan = await planCollection.findOne(query);
      res.send(plan);
    })
    /* --------- subscriptionCollection related Apis ----------- */

    app.post('/api/subscriptions', async (req, res) => {
      const data = req.body;
      const subsInfo = {
        ...data,
        createdAt: new Date()
      }
      const result = await subscriptionCollection.insertOne(subsInfo);
      const filter = { email: data.email };
      const updateDocument = {
        $set: {
          plan: data.planId,
        },
      };

      const updateResult = await usersCollection.updateOne(filter, updateDocument);
      res.send(updateResult)
    })


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