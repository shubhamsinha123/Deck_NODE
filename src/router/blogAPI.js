/* eslint-disable linebreak-style */
/* eslint-disable consistent-return */
const express = require('express');
const mongoose = require('mongoose');

const blogRouter = express.Router();
const blogSchema = require('../model/blogSchema');

const buildQuery = (identifier) => {
  if (!identifier) return {};
  const conditions = [{ name: identifier }, { title: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    conditions.push({ _id: identifier });
  }
  return { $or: conditions };
};

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
    const getBlog = await blogSchema.find({}).sort({ createdAt: -1 });
    res.status(200).send(getBlog);
  } catch (e) {
    res.status(400).send(e);
  }
});

// Get particular data from API
blogRouter.get('/getBlog/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const getBlogSingleData = await blogSchema.find(buildQuery(name));
    res.status(200).send(getBlogSingleData);
  } catch (e) {
    res.status(400).send(e);
  }
});

// to update the API
blogRouter.patch('/updateBlog/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const updatedBlog = await blogSchema.findOneAndUpdate(
      buildQuery(name),
      req.body,
      {
        new: true,
      },
    );
    if (!updatedBlog) {
      return res.status(404).send('Blog not found');
    }

    res.status(200).send(updatedBlog);
  } catch (e) {
    res.status(400).send(e);
  }
});

// to update the API
blogRouter.delete('/removeBlog/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const deleteBlog = await blogSchema.findOneAndDelete(buildQuery(name));
    if (!deleteBlog) {
      return res.status(404).send('Blog not found');
    }

    res.send(`record with ${name} deleted successfully`);
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = blogRouter;