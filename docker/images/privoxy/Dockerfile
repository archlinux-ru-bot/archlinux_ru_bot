FROM alpine:latest

RUN apk add --no-cache privoxy
COPY config /etc/privoxy/config

ENTRYPOINT ["privoxy", "--no-daemon", "/etc/privoxy/config"]
