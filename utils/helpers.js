function cleanText(inputText) {
  var cleanedText = inputText;
  cleanedText = cleanedText.replace(/&#.{4};|\[&#.{4};\]/g, "");
  return cleanedText;
}

function cleanedTitle(inputText) {
  var cleanedText = inputText;

  if (cleanedText[cleanedText.length - 1] == "?") {
  } else if (cleanedText[cleanedText.length - 1] != ".") {
    cleanedText += ".";
  }
  return cleanedText;
}

function cleanedDescription(inputText) {
  var cleanedText = inputText.replace('"', "'");
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
    __dirname + "/public/" + fileName,
    prettyPrintJSON(data),
    "utf8",
    err => {
      if (err) throw err;

      console.log(fileName + " file saved");
    }
  );
}
function readFromFile(path) {
  var text = fs.readFileSync(path, "utf8");
  return JSON.parse(text);
}

function captilizeWord(lower) {
  return lower.charAt(0).toUpperCase() + lower.substr(1);
}

module.exports = {
  cleanText: cleanText,
  cleanedTitle: cleanedTitle,
  cleanedDescription: cleanedDescription,
  writeToFile: writeToFile,
  readFromFile: readFromFile,
  captilizeWord: captilizeWord
};
