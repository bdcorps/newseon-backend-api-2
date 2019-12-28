var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
  uid: String,
  order: Number,
  headline: String,
  abstract: String,
  publisher: String,
  media: String,
  audioTrackID: String,
  publishedOn: Date,
  url: String,
  playlist: Schema.Types.Mixed
});

var PlaylistSchema = new Schema({
  id: String,
  title: String,
  url: String,
  media: String,
  category: String,
  articles: [Schema.Types.Mixed]
});

var CategorySchema = new Schema({
  id: String,
  title: String,
  playlists: [Schema.Types.Mixed]
});

var ConfigSchema = new Schema({
  categories: Schema.Types.Mixed,
  articles: Schema.Types.Mixed
});

var UserSchema = new Schema({
  id: String,
  name: String,
  email: String,
  profilePhoto: String
});

ArticleSchema.statics.findOrCreate = require("find-or-create");
PlaylistSchema.statics.findOrCreate = require("find-or-create");
CategorySchema.statics.findOrCreate = require("find-or-create");
ConfigSchema.statics.findOrCreate = require("find-or-create");
UserSchema.statics.findOrCreate = require("find-or-create");

var ArticleModel = mongoose.model("article", ArticleSchema, "articles");
var PlaylistModel = mongoose.model("playlist", PlaylistSchema, "playlists");
var CategoryModel = mongoose.model("category", CategorySchema, "categories");
var ConfigModel = mongoose.model("config", ConfigSchema, "config");
var UserModel = mongoose.model("user", UserSchema, "user");

module.exports = {
  ArticleModel: ArticleModel,
  PlaylistModel: PlaylistModel,
  CategoryModel: CategoryModel,
  ConfigModel: ConfigModel,
  UserModel: UserModel
};
