#!/bin/bash

docker run --name redis -p 6379:6379 -d redis
docker run --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=top-secret-password -v `pwd`/sql:/docker-entrypoint-initdb.d -d mysql:5.7
