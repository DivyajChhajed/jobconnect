// next.config.js
module.exports = {
  webpack: (config) => {
    // Add a rule to ignore .node files
    config.module.rules.push({
      test: /\.node$/,
      loader: "ignore-loader",
    });

    return config;
  },
};
