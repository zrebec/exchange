# Currency API

This is a simple API that allows you to get exchange rates for a particular currency on a specific date. It uses Express, SQLite, and Axios to fetch data from the [exchange API][1]. It also caches data in local memory and SQLite database to reduce redundant API calls.

## Features

- Fetch exchange rates for a specific currency on a particular date
- Caching of fetched data in local memory and SQLite database
- Use of environment variables for API key
- Error handling for invalid requests and server errors
- API Endpoint
- GET localhost:3000/api/rates/:currency/:date
- Replace :currency with the desired currency (e.g., **'USD'**) and :date with the date in the format 'YYYY-MM-DD' (e.g., **'2023-12-01'**).

### Logic of fethcing and storing data

The logic of fetching and storing data is in file `api.ts`.

1. Look if we have table currency in our database. If not, we're create it.
2. If exists, we're trying to fetch data from desired date and currency from local cache.
3. If not exists in local cachce, we're trying to fetch data from databse if already exists
4. If not in local cache or in database we are goingo to API for fetch
   data and and store it into local cache at first and then into datase.
5. If sever is restarted but we don't delete database, we cannot find
   desired currency and date in local cache of course but we can still get
   it from database.
6. If server is restarted and database was deleted, so we're going to
   step 1.

### Potential problem
The problem can be if we will storing into local 

## Installation

To run this project, you need to have Docker installed on your system. If you don't have Docker installed, you can download it from here.

## Build Docker Image

Navigate to the project directory and run the following command to build the Docker image:

### Build container

```bash
docker build -t currency-api .
```

### Run the container

After the image has been built successfully, you can run the Docker container using the following command:

```bash
docker run -p 3000:3000 currency-api
```

Now, the API should be accessible at [http://localhost:3000][2].

## Environment Variables

The project uses a .env file for the API key. The .env file should be located at the root of your project and should contain the following:

```makefile
API_KEY=your_api_key
```

Replace your_api_key with your actual API key from the [Exchange API][1]

## Error Handling

The API has error handling for various scenarios, including:

- Missing or incorrect date or currency parameters
- Non-existent currency
- Invalid URL request
- Server errors
- No response received from the server

## Contribution

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

[1]: https://www.exchangerate-api.com/
[2]: http://localhost:3000
