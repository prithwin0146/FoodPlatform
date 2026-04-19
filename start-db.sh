#!/bin/bash
docker run -d \
  --name foodplatform-sql \
  -e ACCEPT_EULA=Y \
  -e MSSQL_SA_PASSWORD=FoodPlatform_Dev1 \
  -p 1433:1433 \
  mcr.microsoft.com/azure-sql-edge:latest
