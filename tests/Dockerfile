FROM buildpack-deps:jessie-curl
WORKDIR /root

ENV NVM_DIR /usr/local/nvm
ENV NODE_VER=9.11.1

RUN set -ex; \
 apt-get update && apt-get install --force-yes -y --no-install-recommends \
  git-core \
  build-essential wget && \
  echo $NODE_VER > ~/.nvmrc && \
  curl https://raw.githubusercontent.com/creationix/nvm/v0.23.3/install.sh | bash && \
  echo 'source $NVM_DIR/nvm.sh' >> /etc/profile && \
  /bin/bash -l -c "nvm install;" "nvm use;" && \
  echo 'pushd /root >/dev/null && nvm use && popd > /dev/null' >> ~/.bashrc && \
  git clone https://github.com/wolfcw/libfaketime.git && \
  cd /root/libfaketime/src && \
  make install && \
  rm -rf /var/lib/apt/lists/* && \
  rm -rf /root/libfaketime

RUN cp /usr/share/zoneinfo/America/Los_Angeles /etc/localtime

ENV LD_PRELOAD=/usr/local/lib/faketime/libfaketime.so.1
ENV FAKETIME_NO_CACHE=1
ENV FAKETIME="2018-01-01 12:00:00"
WORKDIR /C/src/timezone-mock/tests

