/* eslint-disable class-methods-use-this */
const express = require('express');
const blogService = require('../services/blog.service');

const router = express.Router();

class BlogController {
  async createBlog(req, res) {
    try {
      const response = await blogService.createBlog(req.body);
      return res.send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getAllBlogs(req, res) {
    try {
      const response = await blogService.getAllBlogs();
      return res.status(201).send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async getBlogByName(req, res) {
    try {
      const response = await blogService.getBlogByName(req.params.name);
      return res.status(201).send(response);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async updateBlogByName(req, res) {
    try {
      const updatedBlog = await blogService.updateBlogByName(
        req.params.name,
        req.body,
      );
      if (!updatedBlog) {
        return res.status(404).send('Blog not found');
      }
      return res.status(200).send(updatedBlog);
    } catch (error) {
      return res.status(400).send(error);
    }
  }

  async deleteBlogByName(req, res) {
    try {
      const deletedBlog = await blogService.deleteBlogByName(req.params.name);
      if (!deletedBlog) {
        return res.status(404).send('Blog not found');
      }
      return res.send(`record with ${req.params.name} deleted successfully`);
    } catch (error) {
      return res.status(400).send(error);
    }
  }
}

const blogController = new BlogController();

// Map legacy routes
router.post('/postBlog', blogController.createBlog.bind(blogController));
router.get('/getBlog', blogController.getAllBlogs.bind(blogController));
router.get('/getBlog/:name', blogController.getBlogByName.bind(blogController));
router.patch(
  '/updateBlog/:name',
  blogController.updateBlogByName.bind(blogController),
);
router.delete(
  '/removeBlog/:name',
  blogController.deleteBlogByName.bind(blogController),
);

blogController.router = router;

module.exports = blogController;
