/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const express = require('express');

const blogRouter = express.Router();
const blogSchema = require('../model/blogSchema');

blogRouter.post('/postBlog', async (req, res) => {
  try {
    const blogArray = req.body;
    const postBatchResponseData = await blogSchema.insertMany(
      blogArray,
    );
    res.send(postBatchResponseData);
  } catch (e) {
    res.status(400).send(e);
  }
});

blogRouter.get('/getBlog', async (req, res) => {
  try {
    const getBlog = await blogSchema.find({});
    res.status(201).send(getBlog);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get particular data from API
blogRouter.get('/getBlog/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const getBlogSingleData = await blogSchema.find({ name });
    // const responseData = await addCitizenShip.save();
    // res.send(responseData);
    res.status(201).send(getBlogSingleData);
  } catch (e) {
    res.status(400).send(e);
  }
});
// to update the API
blogRouter.patch('/updateBlog/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const updatedBlog = await blogSchema.findOneAndUpdate(
      { name },
      req.body,
      {
        new: true,
      },
    );
    if (!updatedBlog) {
      return res.status(404).send('Citizen not found');
    }

    // res.send(updatedCitizen);
    res
      .status(200)
      // .json({
      //   message: `record with ID ${id} got updated successfully`,
      // })
      .send(updatedBlog);
  } catch (e) {
    res.status(400).send(e);
  }
});
// to update the API
blogRouter.delete('/removeBlog/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const deleteBlog = await blogSchema.findOneAndDelete({ name });
    if (!deleteBlog) {
      return res.status(404).send('Citizen not found');
    }

    res.send(`record with ${name} deleted successfully`);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = blogRouter;
