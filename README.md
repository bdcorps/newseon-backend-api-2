# Newseon Backend API 2

The back-end API layer for Newseon. The project features a complete pipeline to generate and transcribe TTS news articles to MLab database.

# Installation

Install the package dependencies,
```bash
npm install
```

# Dependencies
1. [News API key](https://newsapi.org/)
2. [Google Text to Speech Key](https://console.cloud.google.com/?pli=1)
3. [Google Translate Key](https://console.cloud.google.com/?pli=1)
4. [Unsplash API key](https://unsplash.com/developers)

# Usage

Start the app,
```bash
npm start
```

# Configuration

## categoriesConfig.js

```javascript
var categoriesJSON = {
  categories: [
    {
      id: "topheadlines",
      title: "Top Headlines",
      playlists: [
        {
          type: "topHeadlines",
          title: "TechCrunch Updates",
          query: {
            title: "Latest from TechCrunch",
            category: "tech",
            source: "http://feeds.feedburner.com/TechCrunch"
          }
        }
      ]
    }
  ]
};
module.exports = categoriesJSON;
```
