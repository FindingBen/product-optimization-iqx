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
        tags
        totalInventory
        seo {
          title
          description
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              sku
              price
              inventoryQuantity
            }
          }
        }
        media(first: 10) {
          edges {
            node {
              ... on MediaImage {
                id
                image {
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
`;

export const GET_SHOPIFY_SHOP_INFO = `
query {
  shop {
    id
    name
    email
    myshopifyDomain
    description
    plan {
        displayName
        partnerDevelopment
      }
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

export const UPDATE_PRODUCT= `
mutation productUpdate($input: ProductInput!) {
  productUpdate(input: $input) {
    product {
      id
      title
      descriptionHtml
    
    }
    userErrors {
      field
      message
    }
  }
}`

export const IMAGE_ALT_UPDATE = `
mutation fileUpdate($files: [FileUpdateInput!]!) {
  fileUpdate(files: $files) {
    files {
      id
      alt
      fileStatus
    }
    userErrors {
      field
      message
      code
    }
  }
}
`
const env = process.env.NODE_ENV || "";
const isTest = env.toLowerCase() !== "production";

export const SUBSCRIPTION_CHARGE = `
  mutation AppSubscriptionCreate($name: String!, $lineItems: [AppSubscriptionLineItemInput!]!, $returnUrl: URL!, $test: Boolean = ${isTest}) {
    appSubscriptionCreate(name: $name, returnUrl: $returnUrl, lineItems: $lineItems, test: $test) {
      userErrors {
        field
        message
      }
      appSubscription {
        id
      }
      confirmationUrl
    }
  }
`;