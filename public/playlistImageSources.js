var playlistImages = {
  Startups: [
    "https://images.unsplash.com/photo-1525130413817-d45c1d127c42?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80",
    "https://images.unsplash.com/photo-1553484771-cc0d9b8c2b33?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1463&q=80"
  ],
  Technology: [
    "https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    "https://images.unsplash.com/photo-1548611635-b6e7827d7d4a?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80"
  ],
  "Digital Products": [
    "https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    "https://images.unsplash.com/photo-1480506132288-68f7705954bd?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1393&q=80",
    "https://images.unsplash.com/photo-1535223289827-42f1e9919769?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=634&q=80"
  ],
  Gaming: [
    "https://images.unsplash.com/photo-1531525645387-7f14be1bdbbd?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1511882150382-421056c89033?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1351&q=80",
    "https://images.unsplash.com/photo-1531525797753-909788106ccb?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=80"
  ],
  Cryptocurrency: [
    "https://images.unsplash.com/photo-1543699539-33a389c5dcfe?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80",
    "https://images.unsplash.com/photo-1524673450801-b5aa9b621b76?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1350&q=80",
    "https://images.unsplash.com/photo-1555848741-bd7a675256ed?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1225&q=80"
  ],
  Undefined: [
    "https://images.unsplash.com/photo-1478432780021-b8d273730d8c?ixlib=rb-0.3.5&s=99f410919a74f2d18945ea7f62c5d4c3&auto=format&fit=crop&w=1350&q=80",
    "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=e1dcfcaa6dafa547aa5381b603296c94&auto=format&fit=crop&w=1350&q=80"
  ]
};

var articleImages = {
  Startups: [
    "https://images.unsplash.com/photo-1521020773588-3b28297b1e70?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=e0973395dd1655ea3b8fb83fa95c02c2&auto=format&fit=crop&w=1469&q=80",
    "https://images.unsplash.com/photo-1509130298739-651801c76e96?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=b5faa5895582a0b8ae5f7429b59e8488&auto=format&fit=crop&w=1950&q=80"
  ],
  Technology: [
    "https://images.unsplash.com/photo-1478432780021-b8d273730d8c?ixlib=rb-0.3.5&s=99f410919a74f2d18945ea7f62c5d4c3&auto=format&fit=crop&w=1350&q=80",
    "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=e1dcfcaa6dafa547aa5381b603296c94&auto=format&fit=crop&w=1350&q=80"
  ],
  "Digital Products": [
    "https://images.unsplash.com/photo-1521138054413-5a47d349b7af?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=f8cf0ea657ec9f4beb43f2cd6a6d54a6&auto=format&fit=crop&w=676&q=80",
    "https://images.unsplash.com/photo-1529281322535-245b0a3257ec?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=6425f2048c84111b3c8f92febcaaa2ac&auto=format&fit=crop&w=1350&q=80"
  ],
  Gaming: [
    "https://images.unsplash.com/photo-1527261834078-9b37d35a4a32?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=309fe659f0d0e2a5b7408b7a756613c2&auto=format&fit=crop&w=1950&q=80",
    "https://images.unsplash.com/photo-1515469826971-68d3550b0110?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=9f3cd3d496e02df256ff3b3aba9d2eee&auto=format&fit=crop&w=634&q=80"
  ],
  Cryptocurrency: [
    "https://images.unsplash.com/photo-1503810473512-f64b56827964?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=cb44a21c4469e257a39f30949c81931d&auto=format&fit=crop&w=2134&q=80",
    "https://images.unsplash.com/photo-1493409137604-0901c55e4456?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=608c673db36723a60ea11d6ffdbc4e48&auto=format&fit=crop&w=1350&q=80"
  ],
  Undefined: [
    "https://images.unsplash.com/photo-1478432780021-b8d273730d8c?ixlib=rb-0.3.5&s=99f410919a74f2d18945ea7f62c5d4c3&auto=format&fit=crop&w=1350&q=80",
    "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0?ixlib=rb-0.3.5&ixid=eyJhcHBfaWQiOjEyMDd9&s=e1dcfcaa6dafa547aa5381b603296c94&auto=format&fit=crop&w=1350&q=80"
  ]
};

var getPlaylistSplashMedia = function(category) {
  console.log(
    category,
    " ",
    playlistImages[category][
      Math.floor(Math.random() * playlistImages[category].length)
    ]
  );
  return playlistImages[category][
    Math.floor(Math.random() * playlistImages[category].length)
  ];
};

var getArticleSplashMedia = function(category) {
  console.log(category);
  return articleImages[category][Math.floor(Math.random() * 2)];
};

module.exports = { getPlaylistSplashMedia, getArticleSplashMedia };
