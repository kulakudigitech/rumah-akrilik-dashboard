#!/bin/bash
npm run build && \
sudo cp -a build/. /var/www/rumahakrilik-frontend/ && \
sudo systemctl restart nginx
