FROM nginx:alpine

# Pull in Alpine security fixes newer than the base image, so the image scan doesn't fail on
# already-fixed CVEs. Same as app/ and storybook/.
RUN apk upgrade --no-cache

COPY public/ /usr/share/nginx/html/

EXPOSE 80
