/* eslint-disable linebreak-style, no-console */
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || process.env.PATH_API;

if (!uri) {
  console.error('Error: Neither MONGODB_URI nor PATH_API is defined in environment variables.');
} else {
  mongoose
    .connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('Connected to DB successfully');
    })
    .catch((e) => {
      console.log('failed', e);
    });
}

// const client = new MongoClient(uri);

// async function getdata() {
//   let result = await client.connect();
//   let db = result.db(database);
//   let collection = db.collection("GET");
//   let response = await collection.find({}).toArray();
//   console.log(response);
// }

// getdata();
