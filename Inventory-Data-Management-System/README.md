# Inventory and Data Management System

REST API built with Node.js, Express.js, MongoDB, Mongoose and dotenv.

## Requirements
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas connection string

## Setup
1. Run `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `MONGO_URI` in `.env`.
4. Run `npm start` (or `npm run dev`).
5. API base URL: `http://localhost:5000`.

## API routes

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/products` | Create a product |
| GET | `/api/products` | List products with filtering, sorting and pagination |
| GET | `/api/products/:id` | Get one product |
| PUT | `/api/products/:id` | Update product details |
| PATCH | `/api/products/:id/stock` | Increase or decrease stock |
| DELETE | `/api/products/:id` | Delete a product |
| GET | `/api/products/low-stock` | Products at or below reorder level |
| GET | `/api/products/summary` | Category-wise inventory summary |

## Product fields
`name`, `sku`, `category`, `price`, `quantity`, `reorderLevel`, `supplier`.
`reorderLevel` defaults to 10. `stockValue` is calculated as `price * quantity`.

## List query parameters
`search`, `name`, `category`, `supplier`, `minPrice`, `maxPrice`,
`minQuantity`, `maxQuantity`, `lowStock=true`, `sort`, `page`, `limit`.
Sort fields are product fields; prefix a field with `-` for descending order.
Defaults: `page=1`, `limit=10`; maximum limit is 100.

## Stock adjustment
Send JSON such as `{ "change": 10 }`. Positive values add stock; negative values record a sale.
The API rejects zero, non-integer changes and stock levels below zero.

## Postman
Import `postman/Inventory_Data_Management_System.postman_collection.json`.
Set the collection variable `baseUrl` to `http://localhost:5000`.
