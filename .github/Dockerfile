# syntax=docker/dockerfile:1

# Build with: docker build -t jimbly/timezone-mock-test .
# Test with: docker run -it --rm -v /C/Code/src/timezone-mock:/project jimbly/timezone-mock-test bash
# Push with: docker push jimbly/timezone-mock-test

FROM node:22.22.0
WORKDIR /root

RUN rm /etc/localtime && cp /usr/share/zoneinfo/America/Los_Angeles /etc/localtime
