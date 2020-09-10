FROM debian:buster-slim

RUN apt update && apt install apache2 -y
COPY --chown="www-data:www-data" ./dist/IF105/ /var/www/dtapi
COPY ./building/dtapi.conf /etc/apache2/sites-available/dtapi.conf
RUN a2ensite dtapi && a2dissite 000-default && a2enmod headers && a2enmod rewrite

EXPOSE 80

ENTRYPOINT ["/usr/sbin/apache2ctl", "-D", "FOREGROUND"]
