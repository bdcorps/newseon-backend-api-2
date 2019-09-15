var mongoose = require("mongoose");
const chai = require("chai");
const expect = chai.expect;
const assert = chai.assert;

var models = require("../models/models");
var Category = models.CategoryModel;

var mongodb =
  "mongodb://sssaini1:sssaini1@ds111788.mlab.com:11788/newseon-testing";

describe("Category Model", () => {
  it("has a module", () => {
    expect(Category).to.not.be.undefined;
  });
});

describe("Category Model", () => {
  before(function(done) {
    mongoose.connect(mongodb, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    });
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error"));
    db.once("open", function() {
      console.log("We are connected to test database!");
      done();
    });
  });
  after(function(done) {
    mongoose.connection.db.dropDatabase(function() {
      mongoose.connection.close(done);
    });
  });

  after(async () => {
    await mongoose.connection.close();
  });
  describe("get cateogry", () => {
    it("gets a category", async () => {
      const category = new Category({
        id: "what",
        title: "title",
        playlists: [{ playlists: "red" }]
      });
      await category.save();

      const foundCategory = await Category.findOne({ title: "title" });
      const expected = "title";
      const actual = foundCategory.title;
      expect(actual).equal(expected);
    });
  });

  describe("save category", () => {
    it("saves a category", async () => {
      const category = new Category({
        id: "what",
        title: "title",
        playlists: [{ playlists: "red" }]
      });
      const savedCategory = await category.save();

      const expected = "title";
      const actual = savedCategory.title;
      expect(actual).equal(expected);
    });
  });

  describe("update category", () => {
    it("updates a category", async () => {
      const category = new Category({
        id: "what",
        title: "title",
        playlists: [{ playlists: "red" }]
      });
      await category.save();

      category.title = "what2";
      const updatedCategory = await category.save();

      const expected = "what2";
      const actual = updatedCategory.title;
      expect(actual).equal(expected);
    });
  });
});
