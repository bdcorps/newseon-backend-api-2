var categoriesJSON = {
  categories: [
    {
      id: "topheadlines",
      title: "Top Headlines",
      playlists: [
        {
          type: "everything",
          title: "IGN",
          query: {
            sources: "ign",
            langugage: "en",
            pageSize: 10
          }
        },
        {
          type: "everything",
          title: "The Verge",
          query: {
            sources: "the-verge",
            langugage: "en",
            pageSize: 10
          }
        }
      ]
    }
  ]
};

module.exports = categoriesJSON;
