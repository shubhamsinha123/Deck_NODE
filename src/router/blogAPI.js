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
    res.status(201).send({
      data: postBatchResponseData,
      message: 'Blog data created successfully.',
      status: 'SUCCESS',
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

blogRouter.get('/getBlog', async (req, res) => {
  try {
    const getBlog = await blogSchema.find({});
    res.status(200).send({
      data: getBlog,
      message: 'All blog data fetched successfully',
      status: 'SUCCESS',
    });
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
    res.status(200).send({
      data: getBlogSingleData,
      message: 'Blog data fetched successfully',
      status: 'SUCCESS',
    });
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
      return res.status(404).send('Blog not found');
    }

    // res.send(updatedCitizen);
    res
      .status(202)
      // .json({
      //   message: `record with ID ${id} got updated successfully`,
      // })
      .send({
        data: updatedBlog,
        message: `record with ID ${name} got updated successfully`,
        status: 'SUCCESS',
      });
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
      return res.status(404).send('Blog not found');
    }

    res.status(200).send({
      message: `record with ${name} deleted successfully`,
      status: 'SUCCESS',
    });
  } catch (e) {
    res.status(400).send(e);
  }
});

module.exports = blogRouter;
