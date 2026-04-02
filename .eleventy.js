module.exports = function(eleventyConfig) {

  // Copiar assets estáticos tal cual al output
  eleventyConfig.addPassthroughCopy("public");

  // Colecciones
  eleventyConfig.addCollection("posts", function(collectionApi) {
    return collectionApi
      .getFilteredByGlob("src/posts/*.md")
      .sort((a, b) => b.date - a.date);
  });

  // Filtro de fecha legible
  eleventyConfig.addFilter("dateReadable", function(date) {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric", month: "long", day: "numeric"
    });
  });

  // Filtro de fecha ISO (para el atributo datetime)
  eleventyConfig.addFilter("dateISO", function(date) {
    return new Date(date).toISOString().split("T")[0];
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "../data",   // data/ está al mismo nivel que src/
      output: "_site"
    },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};
