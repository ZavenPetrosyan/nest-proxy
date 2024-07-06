# Nest Proxy Application

This is a NestJS application that proxies requests and modifies HTML content by appending "™" to each six-letter word and changing internal links to route through the proxy server.

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) installed on your machine

## Getting Started

### Running the Application via Docker

1. **Clone the repository:**

    ```sh
    git clone https://github.com/ZavenPetrosyan/nest-proxy.git
    cd nest-proxy
    ```

2. **Build and run the Docker containers:**

    ```sh
    docker-compose up --build
    ```

    This will build the Docker image and start the application. The app will be available at `http://localhost:3000`.

### Accessing the Proxy Endpoint

To use the proxy endpoint, visit:

```sh
http://localhost:3000/proxy?url=https://docs.nestjs.com
```

### Viewing the Modified HTML File
The modified HTML file is generated and saved in the dist/public folder. To view this file manually, you can open it with any web browser.
Locate the modified.html file: ```cd dist/public```

## On macOS:
 ```open modified.html```

 ## On Linux:
 ```xdg-open modified.html```

## On Windows:
 ```start modified.html```
 