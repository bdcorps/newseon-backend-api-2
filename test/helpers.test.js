var assert = require("chai").assert;
const {
  cleanText,
  cleanedDescription,
  writeToFile,
  readFromFile,
  validateArticleStructure,
  captilizeSentence,
  applyBasicPunctuation,
  stripStrayHTMLCharacterCodes
} = require("../utils/helpers");

describe("Testing Helper functions", function() {
  describe("When a headline with stray HTML character is passed in, they are cleaned up", function() {
    it("should return the news headline with no HTML character codes", function() {
      const actual = stripStrayHTMLCharacterCodes(
        "APIs are the next big SaaS &#x0003B;wave"
      );
      const expected = "APIs are the next big SaaS wave";
      assert.equal(actual, expected);
    });

    it("should return the news headline with no HTML character codes enclosed in square brackets", function() {
      const actual = stripStrayHTMLCharacterCodes(
        "APIs are the next big SaaS [&#x0003B;]wave"
      );
      const expected = "APIs are the next big SaaS wave";
      assert.equal(actual, expected);
    });

    it("should clean the news headline from stray HTML character codes and apply punctuation", function() {
      const actual = cleanText("APIs are the next big SaaS &#x0003B;wave");
      const expected = "APIs are the next big SaaS wave.";
      assert.equal(actual, expected);
    });
  });

  describe("When a headline is passed in, apply basic punctuation", function() {
    it("should return the news headline with a period at the end of sentence", function() {
      const actual = applyBasicPunctuation("APIs are the next big SaaS wave");
      const expected = "APIs are the next big SaaS wave.";
      assert.equal(applyBasicPunctuation(actual), expected);
    });

    it("should return the news headline with a question mark at the end of sentence", function() {
      const actual = applyBasicPunctuation("APIs are the next big SaaS wave?");
      const expected = "APIs are the next big SaaS wave?";
      assert.equal(actual, expected);
    });
  });

  describe("When a description is passed in, it is cleaned up", function() {
    it("should replace the double quotes in the news headline with single quotes", function() {
      const actual = cleanedDescription('APIs are the "next" big SaaS wave');
      const expected = "APIs are the 'next' big SaaS wave";
      assert.equal(actual, expected);
    });

    it("should remove the stray HTML tag characters", function() {
      const actual = cleanedDescription(
        "APIs are the next</a> big <a>SaaS wave"
      );
      const expected = "APIs are the next big SaaS wave";
      assert.equal(actual, expected);
    });
  });

  describe("When a description is passed in, make sure it's first word is capitilized", function() {
    it("should return the sentence with capitilized first word", function() {
      const actual = captilizeSentence("apis are the next big SaaS wave");
      const expected = "Apis are the next big SaaS wave";
      assert.equal(actual, expected);
    });
  });

  describe("Make sure the article schema hasConsistentStructure", function() {
    it("should return false when article has empty title ", function() {
      const article = {
        source: { id: "", name: "SeekingAlpha" },
        description: "Description",
        url: "url",
        urlToImage: "urlToImage",
        publishedAt: "date"
      };

      const actual = hasConsistentStructure(article);
      assert.isFalse(actual, "no title");
    });

    it("should return false when article has empty description ", function() {
      const article = {
        source: { id: "", name: "SeekingAlpha" },
        title: "Title",
        url: "url",
        urlToImage: "urlToImage",
        publishedAt: "date"
      };

      const actual = validateArticleStructure(article);
      assert.isFalse(actual, "no description");
    });
  });
});

// const article = {
//   source: { id: "", name: "SeekingAlpha" },
//   title: "Title",
//   description: "Description",
//   url: "url",
//   urlToImage: "urlToImage",
//   publishedAt: "date"
// };
