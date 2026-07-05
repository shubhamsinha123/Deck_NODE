const blogService = require("../../src/services/blog.service");
const Blog = require("../../src/models/Blog");
const AppError = require("../../src/exceptions/AppError");

jest.mock("../../src/models/Blog");

describe("BlogService Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createBlog", () => {
    it("should call create when creating a single blog", async () => {
      const mockBlog = { name: "My Blog", description: "Sample" };
      Blog.create.mockResolvedValue(mockBlog);

      const result = await blogService.createBlog(mockBlog);

      expect(Blog.create).toHaveBeenCalledWith(mockBlog);
      expect(result).toEqual(mockBlog);
    });

    it("should call insertMany when creating multiple blogs", async () => {
      const mockBlogs = [
        { name: "Blog 1", description: "Desc 1" },
        { name: "Blog 2", description: "Desc 2" },
      ];
      Blog.insertMany.mockResolvedValue(mockBlogs);

      const result = await blogService.createBlog(mockBlogs);

      expect(Blog.insertMany).toHaveBeenCalledWith(mockBlogs);
      expect(result).toEqual(mockBlogs);
    });

    it("should throw AppError on create failure", async () => {
      Blog.create.mockRejectedValue(new Error("Db error"));
      await expect(blogService.createBlog({})).rejects.toThrow(AppError);
    });
  });

  describe("getAllBlogs", () => {
    it("should return all blogs", async () => {
      const mockBlogs = [{ name: "Blog 1" }];
      Blog.find.mockResolvedValue(mockBlogs);

      const result = await blogService.getAllBlogs();

      expect(Blog.find).toHaveBeenCalledWith({});
      expect(result).toEqual(mockBlogs);
    });

    it("should throw AppError on find failure", async () => {
      Blog.find.mockRejectedValue(new Error("Db error"));
      await expect(blogService.getAllBlogs()).rejects.toThrow(AppError);
    });
  });

  describe("getBlogByName", () => {
    it("should query for specific blog by name", async () => {
      const mockBlog = [{ name: "Tech Blog" }];
      Blog.find.mockResolvedValue(mockBlog);

      const result = await blogService.getBlogByName("Tech Blog");

      expect(Blog.find).toHaveBeenCalledWith({ name: "Tech Blog" });
      expect(result).toEqual(mockBlog);
    });

    it("should throw AppError on find failure", async () => {
      Blog.find.mockRejectedValue(new Error("Db error"));
      await expect(blogService.getBlogByName("Name")).rejects.toThrow(AppError);
    });
  });

  describe("updateBlogByName", () => {
    it("should update and return updated blog", async () => {
      const mockUpdated = { name: "Tech Blog", views: 5 };
      Blog.findOneAndUpdate.mockResolvedValue(mockUpdated);

      const result = await blogService.updateBlogByName("Tech Blog", {
        views: 5,
      });

      expect(Blog.findOneAndUpdate).toHaveBeenCalledWith(
        { name: "Tech Blog" },
        { views: 5 },
        { new: true },
      );
      expect(result).toEqual(mockUpdated);
    });

    it("should throw AppError on update failure", async () => {
      Blog.findOneAndUpdate.mockRejectedValue(new Error("Db error"));
      await expect(
        blogService.updateBlogByName("Tech Blog", {}),
      ).rejects.toThrow(AppError);
    });
  });

  describe("deleteBlogByName", () => {
    it("should delete and return deleted blog", async () => {
      const mockDeleted = { name: "Tech Blog" };
      Blog.findOneAndDelete.mockResolvedValue(mockDeleted);

      const result = await blogService.deleteBlogByName("Tech Blog");

      expect(Blog.findOneAndDelete).toHaveBeenCalledWith({ name: "Tech Blog" });
      expect(result).toEqual(mockDeleted);
    });

    it("should throw AppError on delete failure", async () => {
      Blog.findOneAndDelete.mockRejectedValue(new Error("Db error"));
      await expect(blogService.deleteBlogByName("Tech Blog")).rejects.toThrow(
        AppError,
      );
    });
  });
});
