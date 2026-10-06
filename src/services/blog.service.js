/* eslint-disable class-methods-use-this */
const mongoose = require('mongoose');
const Blog = require('../models/Blog');

const buildQuery = (identifier) => {
  if (!identifier) return {};
  const conditions = [{ name: identifier }, { title: identifier }];
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    conditions.push({ _id: identifier });
  }
  return { $or: conditions };
};

class BlogService {
  async createBlog(blogData) {
    const newBlog = new Blog(blogData);
    return newBlog.save();
  }

  async getAllBlogs() {
    return Blog.find({}).sort({ createdAt: -1 });
  }

  async getBlogByName(identifier) {
    return Blog.findOne(buildQuery(identifier));
  }

  async updateBlogByName(identifier, updateData) {
    return Blog.findOneAndUpdate(buildQuery(identifier), updateData, { new: true });
  }

  async deleteBlogByName(identifier) {
    return Blog.findOneAndDelete(buildQuery(identifier));
  }
}

module.exports = new BlogService();