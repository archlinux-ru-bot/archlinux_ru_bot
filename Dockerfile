ARG IMAGE=archlinux

FROM $IMAGE AS telegram-bot-api

RUN pacman -Syu --noconfirm && \
	pacman -S --noconfirm cmake make gcc gperf git && \
	(yes | pacman -Scc)

RUN mkdir /usr/src/telegram-bot-api && \
	cd /usr/src/telegram-bot-api && \
	git init && \
	git remote add origin https://github.com/tdlib/telegram-bot-api.git && \
	git fetch --depth=1 origin 24ee05d15fca6f771c8229c38d96d6008b81c64a && \
	git reset --hard FETCH_HEAD && \
	git submodule update --init --recursive --depth=1 && \
	cmake -B build -DCMAKE_INSTALL_PREFIX=/usr -DCMAKE_BUILD_TYPE=Release . && \
	cmake --build build --target install -j$(nproc) && \
	rm -rf /usr/src/telegram-bot-api

FROM $IMAGE

SHELL ["/bin/bash", "-ic"]

RUN cp -r /etc/skel/. /root

RUN pacman -Syu --noconfirm && \
	pacman -S --noconfirm busybox lsb-release && \
	(yes | pacman -Scc)

RUN curl -sSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
RUN nvm install 12

COPY . /usr/src/app
RUN cd /usr/src/app && npx yarn install

COPY --from=telegram-bot-api /usr/bin/telegram-bot-api /usr/bin/telegram-bot-api
COPY docker/files/svdir /var/service
COPY docker/files/crontab /var/spool/cron/crontabs/root

RUN busybox --list | awk '/^runsv|^chpst$|^sv/' | xargs -I{} ln -sv /usr/bin/busybox /usr/local/bin/{}
ENTRYPOINT ["/usr/local/bin/runsvdir", "-P", "/var/service"]
