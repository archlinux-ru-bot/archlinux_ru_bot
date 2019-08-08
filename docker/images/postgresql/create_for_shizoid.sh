#!/bin/sh
set -e

POSTGRES="psql --username ${POSTGRES_USER}"

$POSTGRES <<-EOSQL
CREATE USER shizoid WITH CREATEDB PASSWORD 'shizoid';
CREATE DATABASE shizoid OWNER shizoid;
EOSQL
