FROM alpine:latest

RUN apk add --no-cache tor
COPY torrc /etc/tor/torrc

ENTRYPOINT ["tor"]
