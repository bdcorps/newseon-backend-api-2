# newseon-backend-api-2

How categoriesConfig.js should look like?

``` javascript
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
