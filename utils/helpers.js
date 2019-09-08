const fs = require("fs");
var path = require("path");

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

      console.log(fileName + " file saved");
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

module.exports = {
  cleanText: cleanText,
  stripStrayHTMLCharacterCodes: stripStrayHTMLCharacterCodes,
  applyBasicPunctuation: applyBasicPunctuation,
  cleanedDescription: cleanedDescription,
  writeToFile: writeToFile,
  readFromFile: readFromFile,
  captilizeSentence: captilizeSentence,
  prettyPrintJSON: prettyPrintJSON
};
