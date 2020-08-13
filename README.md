# gatsby-graphql-sharp

A Gatsby plugin help to convert graphql image urls to sharp image nodes with easy configuration.

## Instal

```SHELL
npm install --save gatsby-graphql-sharp
```

## Configuration

- `image_url_fields`

  an array of your image url nodes that wanted to be transformed

- `suffix`

  an substring you'd like to add to the name of the sharp node that will be created by this plugin. Default value is '\_sharp'.

- `debug_mode`

  a bool value to whether log the details that might be helpful for your debugging. Default to be false.

## How To Use

```JS
// In your gatsby-config.js
module.exports = {
  plugins: [
    {
      resolve: 'gatsby-source-graphql',
      options: {
        typeName: 'API', // you will need the typeName as root of schema in plugin config
        fieldName: 'api',
        url: ${your_api_url},
      },
    },
    {
      resolve: `gatsby-graphql-sharp`,
      options: {
        image_url_fields: [
          //your graphql schema hierarchy
          'API.event.image_url',
          'API.event.speakers.image_url',
          'API.blog.cover_image_url',
          'API.blog.author_image_url',
        ],
        suffix: ${your_suffix}, //optional, default is '_sharp'
        debug_mode: true, //optional, default is false
      },
    },
  ]
}
```

In above usage example, uses with graphql query looks like this:

```GRAPHQL
graphql`
  query {
    api {
      event (id: 99) {
        image_url
        speakers: {
          image_url
        }
      }
      blog (id:99) {
        cover_image_url
        author_image_url
      }
    }t
  }
`
```

the result will be looks like:

```GRAPHQL
graphql`
  query {
    api {
      event (id: 99) {
        image_url
        image_url_sharp {
          childImageSharp {
            fluid {
              ...GatsbyImageSharpFluid
            }
          }
        }
        speakers: {
          image_url
          image_url_sharp {
            childImageSharp
          }
        }
      }
      blog (id:99) {
        cover_image_url
        cover_image_url_sharp {
          childImageSharp
        }
        author_image_url
        author_image_url_sharp {
          childImageSharp
        }
      }
    }
  }
`
```

## Use With

- [gatsby-plugin-sharp](https://www.gatsbyjs.org/packages/gatsby-plugin-sharp/)
- [gatsby-transformer-sharp](https://www.gatsbyjs.org/packages/gatsby-transformer-sharp/)

## Notes and tips

- Remember to query the image url you wanted to create sharp node with, otherwise the plugin won't be triggered.
- The plugin will log twice if you turned on debug mode, which is as expected and won't affect your app performance. It's caused by the plugin [gatsby-source-graphql](https://www.gatsbyjs.org/packages/gatsby-source-graphql/)
- Do not hot reload the app when gatsby is creating the nodes, if you did that and get error about couldn't find the sharp node, you need to rebuild again.

## Credits

Inspiration from [Rocketmakers](https://www.gatsbyjs.com/plugins/gatsby-plugin-graphql-image/?=gatsby-plugin-graphql-image)
