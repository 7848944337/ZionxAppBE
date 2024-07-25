
```markdown
# Parts API

This project provides a RESTful API for comparing prices of electronic components from different data providers. It supports searching for parts and comparing their prices based on a specified volume.

## Technologies Used

- **Node.js** and **Express** for the server-side application
- **Axios** for making HTTP requests
- **Body-Parser** for parsing incoming request bodies
- **CORS** for handling cross-origin requests

## API Endpoints

### POST /compare

Compares the price of a given part number from different data providers.

**Request Body:**
```json
{
  "partNumber": "string",
  "volume": "number"
}
```

**Response:**
```json
[
  {
    "manufacturerPartNumber": "string",
    "manufacturer": "string",
    "dataProvider": "string",
    "volume": "number",
    "unitPrice": "number",
    "totalPrice": "number"
  }
]
```

**Error Response:**
```json
{
  "error": "string",
  "details": "string"
}
```

## Setup Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) (Node package manager)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/part-number-comparison-api.git
   ```

2. **Navigate into the project directory:**
   ```bash
   cd part-number-comparison-api
   ```

3. **Install the dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment variables:**

   Create a `.env` file in the root of the project and add your API keys and other configurations. The `.env` file should look like this:
   ```
   MOUSER_API_URL=https://api.mouser.com/api/v1/search/partnumber?apiKey=your-mouser-api-key
   ELEMENT14_API_URL=http://api.element14.com/catalog/products
   ELEMENT14_API_KEY=your-element14-api-key
   USD_TO_INR=84
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

   The server will be running on `http://localhost:5000` by default.

### Testing the API

You can test the API using tools like [Postman](https://www.postman.com/) or [curl](https://curl.se/). For example, to test the `/compare` endpoint, you can use the following `curl` command:

```bash
curl -X POST http://localhost:5000/compare -H "Content-Type: application/json" -d '{"partNumber": "part123", "volume": 100}'
```

## Contributing

Feel free to fork the repository and submit pull requests. Contributions are welcome!


## Acknowledgments

- Thanks to the developers of the APIs used in this project.
- Special thanks to the open-source community for their valuable tools and libraries.

```

Make sure to replace placeholders like `your-username` and `your-mouser-api-key` with actual values. If you need any adjustments or have additional details to include, just let me know!
