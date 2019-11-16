const fs = require("fs");
var path = require("path");
var http = require("http");
var parseString = require("xml2js").parseString;

function cleanText(inputText) {
  var textToBeCleaned = inputText;
  var cleanedText = stripStrayHTMLCharacterCodes(textToBeCleaned);
  cleanedText = applyBasicPunctuation(cleanedText);
  return cleanedText;
}
/**
 * Reference for character codes https://dev.w3.org/html5/html-author/charref
 * @param {*} inputText A string containing stray HTML Character Codes
 * @returns A string with stray HTML Character Codes removed
 */
function stripStrayHTMLCharacterCodes(inputText) {
  var textToBeStripped = inputText;
  var strippedText = textToBeStripped.replace(/&#.*;|\[&#.*;\]/g, "");
  return strippedText;
}

// function cleanedTitle(inputText) {
//   return applyBasicPunctuation(inputText);
// }

function applyBasicPunctuation(inputText) {
  var cleanedText = inputText;
  var lastCharacter = cleanedText[cleanedText.length - 1];

  if (lastCharacter != "." && lastCharacter != "?") {
    cleanedText += ".";
  }
  return cleanedText;
}

function cleanedDescription(inputText) {
  var cleanedText = inputText;
  cleanedText = inputText.replace(/"/g, "'");
  cleanedText = cleanedText.replace(/<.>|<\/.>/g, "");
  return cleanedText;
}

function validateArticleStructure(article) {
  return (
    article.hasOwnProperty("source") &&
    !!article["source"] &&
    article.hasOwnProperty("title") &&
    !!article["title"] &&
    article.hasOwnProperty("description") &&
    !!article["description"] &&
    article.hasOwnProperty("url") &&
    !!article["url"] &&
    article.hasOwnProperty("urlToImage") &&
    !!article["urlToImage"] &&
    article.hasOwnProperty("publishedAt") &&
    !!article["publishedAt"]
  );
}

function prettyPrintJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function writeToFile(data, fileName) {
  var dataToWrite = data;
  var d = new Date();
  var n = d.getTime();

  dataToWrite.timestamp = n;
  fs.writeFileSync(
    path.resolve(__dirname, "../public/", fileName),
    prettyPrintJSON(data),
    "utf8",
    err => {
      if (err) throw err;

      console.log(fileName + " File Saved");
    }
  );
}
function readFromFile(fileName) {
  var text = fs.readFileSync(
    path.resolve(__dirname, "../public/", fileName),
    "utf8"
  );
  return JSON.parse(text);
}

function captilizeSentence(lower) {
  return lower.charAt(0).toUpperCase() + lower.substr(1);
}

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));

function xmlToJson(url, callback) {
  var req = http.get(url, function(res) {
    var xml = "";

    res.on("data", function(chunk) {
      xml += chunk;
    });

    res.on("error", function(e) {
      callback(e, null);
    });

    res.on("timeout", function(e) {
      callback(e, null);
    });

    res.on("end", function() {
      parseString(xml, function(err, result) {
        callback(null, result);
      });
    });
  });
}

function generateRandomID() {
  return (
    Math.random()
      .toString(36)
      .substring(2, 15) +
    Math.random()
      .toString(36)
      .substring(2, 15)
  );
}

module.exports = {
  cleanText: cleanText,
  stripStrayHTMLCharacterCodes: stripStrayHTMLCharacterCodes,
  applyBasicPunctuation: applyBasicPunctuation,
  cleanedDescription: cleanedDescription,
  writeToFile: writeToFile,
  readFromFile: readFromFile,
  captilizeSentence: captilizeSentence,
  validateArticleStructure: validateArticleStructure,
  prettyPrintJSON: prettyPrintJSON,
  xmlToJson: xmlToJson,
  snooze: snooze,
  generateRandomID: generateRandomID
};
