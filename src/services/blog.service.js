/* eslint-disable class-methods-use-this */
const Blog = require('../models/Blog');
const AppError = require('../exceptions/AppError');

class BlogService {
  async createBlog(blogData) {
    try {
      if (Array.isArray(blogData)) {
        return await Blog.insertMany(blogData);
      }
      return await Blog.create(blogData);
    } catch (error) {
      throw new AppError('Failed to create blog record', 500);
    }
  }

  async getAllBlogs() {
    try {
      return await Blog.find({});
    } catch (error) {
      throw new AppError('Failed to fetch blogs', 500);
    }
  }

  async getBlogByName(name) {
    try {
      return await Blog.find({ name });
    } catch (error) {
      throw new AppError('Failed to fetch blog by name', 500);
    }
  }

  async updateBlogByName(name, updateData) {
    try {
      return await Blog.findOneAndUpdate({ name }, updateData, { new: true });
    } catch (error) {
      throw new AppError('Failed to update blog', 500);
    }
  }

  async deleteBlogByName(name) {
    try {
      return await Blog.findOneAndDelete({ name });
    } catch (error) {
      throw new AppError('Failed to delete blog', 500);
    }
  }
}

module.exports = new BlogService();
