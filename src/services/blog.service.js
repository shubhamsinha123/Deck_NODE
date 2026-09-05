/* eslint-disable class-methods-use-this */
const Blog = require('../models/Blog');

class BlogService {
  async createBlog(blogData) {
    const newBlog = new Blog(blogData);
    return newBlog.save();
  }

  async getAllBlogs() {
    return Blog.find({});
  }

  async getBlogByName(name) {
    return Blog.findOne({ name });
  }

  async updateBlogByName(name, updateData) {
    return Blog.findOneAndUpdate({ name }, updateData, { new: true });
  }

  async deleteBlogByName(name) {
    return Blog.findOneAndDelete({ name });
  }
}

module.exports = new BlogService();
