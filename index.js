const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.axpgb1h.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const users = client.db("tailor").collection("user");
    const productsCollection = client.db("tailor").collection("products");
    const selectedCollection = client.db("tailor").collection("selected");

    // user post
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await users.findOne(query);
      if (existingUser) {
        return res.send({ message: "already exist" });
      }
      const result = await users.insertOne(user);
      res.send(result);
    });

    //get user

    app.get("/users", async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });

    //get products

    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });
    //find best rated product
    app.get("/bestseller", async (req, res) => {
      const cursor = productsCollection.find().sort({ rating: -1 });
      const result = await cursor.limit(8).toArray();
      res.send(result);
    });
    //post selected item
    app.post("/carts", async (req, res) => {
      const items = req.body;
      const result = await selectedCollection.insertOne(items);
      res.send(result);
    });
    //get selected item
    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      if (!email) {
        res.send([]);
      }
      const query = { email: email };
      const result = await selectedCollection.find(query).toArray();
      res.send(result);
    });
    //quantity increase
    app.put("/increase/:id", async (req, res) => {
      const id = req.params.id;
      const updateValue = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $inc: {
          quantity: 1,
        },
      };
      const result = await selectedCollection.findOneAndUpdate(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });
    //quantity decrease
    app.put("/decrease/:id", async (req, res) => {
      const id = req.params.id;
      const updateValue = req.body;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $inc: {
          quantity: -1,
        },
      };
      const result = await selectedCollection.findOneAndUpdate(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });
    //item delete
    app.delete("/itemDelete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedCollection.deleteOne(query);
      res.send(result);
    });
    //catrgory ways get data
    app.get("/category", async (req, res) => {
      const category = req.query.category;
      const query = { category: category };
      const result = await productsCollection.find(query).limit(15).toArray();
      res.send(result);
    });
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello Wolrd");
});
app.listen(port, () => {
  console.log(`server is running ${port}`);
});
