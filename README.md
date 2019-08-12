# newseon-backend-api-2

Supports UI /dashboard.
Complete pipeline to generate and trascribe articles to mlab database.
Source: newsapi

+ Updated endpoints in newseon-mobile-2 to connect to this.
+ Adding new endpoints to allow for collective 


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
