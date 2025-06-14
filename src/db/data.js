/* eslint-disable linebreak-style */
require('dotenv').config();

const uri = process.env.PATH_API;
// const database = 'api_get';

const mongoose = require('mongoose');

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
// const client = new MongoClient(uri);

// async function getdata() {
//   let result = await client.connect();
//   let db = result.db(database);
//   let collection = db.collection("GET");
//   let response = await collection.find({}).toArray();
//   console.log(response);
// }

// getdata();
