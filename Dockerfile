FROM archlinux/base:latest

SHELL ["/bin/bash", "-ic"]

RUN cp -r /etc/skel/. /root

RUN pacman -Syu --noconfirm && \
	pacman -S --noconfirm busybox lsb-release && \
	pacman -Scc --noconfirm

RUN busybox --install -s
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
RUN nvm install 11.0.0
RUN nvm use 11.0.0

COPY . /usr/src/app
RUN cd /usr/src/app && nvm exec 11.0.0 npm install

COPY docker/files/svdir /var/service
COPY docker/files/crontab /var/spool/cron/crontabs/root

ENTRYPOINT ["/usr/bin/runsvdir", "-P", "/var/service"]
