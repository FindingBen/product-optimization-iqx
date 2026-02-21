export const GET_ALL_PRODUCTS = `
query getProducts($first: Int, $after: String) {
      products(first: $first, after: $after, query: "status:ACTIVE") {
        edges {
          node {
            id
            title
            descriptionHtml
            handle
            createdAt
            updatedAt
            hasOutOfStockVariants
            isGiftCard
            publishedAt
            tags
            totalInventory
            seo {
              title
              description
            }
            variantsCount {
              count
              precision
            }
            variants(first: $first) {
              edges {
                node {
                  id
                  title
                  sku
                  price
                  inventoryQuantity
                  image {
                    id       # ✔ This is also MediaImage ID now
                    url
                    altText
                  }
                }
              }
            }
            media(first: 10) {
              edges {
                node {
                  ... on MediaImage {
                    id          # ✔ gid://shopify/MediaImage/xxx
                    image {
                      id
                      url
                      altText
                    }
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
      `

export const GET_SHOPIFY_SHOP_INFO = `
query {
  shop {
    id
    name
    email
    myshopifyDomain
    description
    primaryDomain {
      url
      host
    }
    metafields(namespace: "global", first: 10) {
      edges {
        node {
          id
          namespace
          key
          value
          type
        }
      }
    }
  }

  # Collections act as "categories" for many stores; adjust first if you need more
  collections(first: 50) {
    edges {
      node {
        id
        title
        handle
      }
    }
  }
}
`