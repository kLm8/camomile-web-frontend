# Camomile Web Front-End

## Deploy with Docker

```
$ docker run -d -p 8070:8070 \
			 -e CAMOMILE_API=http://vmjoker:32774 \
			 -e CAMOMILE_LOGIN=username \
			 -e CAMOMILE_PASSWORD=password \
			 --name web \
			 klm8/camomile-web-frontend
```

### Docker automated build

Thanks to Docker automated build, Docker image `klm8/camomile-web-frontend` is always in track with latest version in branch `dev`.

You can however build your own Docker image using
```
$ git clone https://github.com/kLm8/camomile-web-frontend.git
$ cd camomile-web-frontend
$ docker build -t camomile/web . 
```

## Deploy locally

### Installation 

````
$ git clone https://github.com/kLm8/camomile-web-frontend.git
$ cd camomile-web-frontend
$ npm install
```

### Usage

```
$ node web-server.js [options]

Options:

    --camomile <url>       URL of Camomile server (e.g. https://camomile.fr/api)
    --login <login>        Login for Camomile server (for queues creation)
    --password <password>  Password for Camomile server
````

or use environment variables `CAMOMILE_*`:

```
$ export CAMOMILE_API=https://vmjoker:32769
$ export CAMOMILE_LOGIN=my_login
$ export CAMOMILE_PASSWORD=my_password
$ node web-server.js
````
