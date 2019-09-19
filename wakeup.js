const { hasConsistentStructure } = require("./utils/helpers");

const article = {
  source: "",
  title: "Title",
  description: "yy",
  url: "url",
  urlToImage: "urlToImage",
  publishedAt: "date"
};

console.log(hasConsistentStructure(article));
