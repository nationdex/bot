FROM postgres:18.3-alpine3.23

EXPOSE 5432

COPY ./init.sql /docker-entrypoint-initdb.d/

CMD ["postgres"]
