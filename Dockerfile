FROM nginx

COPY ./dist /app
COPY ./docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/nginx/conf.d /etc/nginx/conf.d
WORKDIR /app

#ENV
# ENV NODE_ENV production

# CMD http-server
