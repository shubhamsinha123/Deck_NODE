/* eslint-disable class-methods-use-this */
const express = require('express');
const blogService = require('../services/blog.service');
const STATUS = require('../constants/statusConstants');

const router = express.Router();

class BlogController {
  async createBlog(req, res) {
    try {
      const response = await blogService.createBlog(req.body);
      return res.status(201).send({
        data: response,
        message: 'Blog created successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error creating blog',
        status: STATUS.FAILURE,
      });
    }
  }

  async getAllBlogs(req, res) {
    try {
      const response = await blogService.getAllBlogs();
      return res.status(200).send({
        data: response,
        message: 'Blogs fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error fetching blogs',
        status: STATUS.FAILURE,
      });
    }
  }

  async getBlogByName(req, res) {
    try {
      const response = await blogService.getBlogByName(req.params.name);
      if (!response) {
        return res.status(404).send({
          data: null,
          message: `Blog '${req.params.name}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: response,
        message: 'Blog fetched successfully',
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error fetching blog',
        status: STATUS.FAILURE,
      });
    }
  }

  async updateBlogByName(req, res) {
    try {
      const updatedBlog = await blogService.updateBlogByName(
        req.params.name,
        req.body,
      );
      if (!updatedBlog) {
        return res.status(404).send({
          data: null,
          message: `Blog '${req.params.name}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: updatedBlog,
        message: `Blog '${req.params.name}' updated successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error updating blog',
        status: STATUS.FAILURE,
      });
    }
  }

  async deleteBlogByName(req, res) {
    try {
      const deletedBlog = await blogService.deleteBlogByName(req.params.name);
      if (!deletedBlog) {
        return res.status(404).send({
          data: null,
          message: `Blog '${req.params.name}' not found`,
          status: STATUS.NOT_FOUND,
        });
      }
      return res.status(200).send({
        data: deletedBlog,
        message: `Blog '${req.params.name}' deleted successfully`,
        status: STATUS.SUCCESS,
      });
    } catch (error) {
      return res.status(400).send({
        data: null,
        message: error.message || 'Error deleting blog',
        status: STATUS.FAILURE,
      });
    }
  }
}

const blogController = new BlogController();

router.post('/api/v1/blog-posts', blogController.createBlog.bind(blogController));
router.get('/api/v1/blog-posts', blogController.getAllBlogs.bind(blogController));
router.get('/api/v1/blog-posts/:name', blogController.getBlogByName.bind(blogController));
router.patch('/api/v1/blog-posts/:name', blogController.updateBlogByName.bind(blogController));
router.delete('/api/v1/blog-posts/:name', blogController.deleteBlogByName.bind(blogController));

blogController.router = router;

module.exports = blogController;
