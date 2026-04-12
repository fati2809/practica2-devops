#!/bin/bash

# Leer el estado actual
source /opt/blue-green/current_deploy.env

# Determinar el color opuesto
if [ "$CURRENT_COLOR" == "blue" ]; then
    TARGET_COLOR="green"
    APP_TARGET_IP="192.168.1.20"
    APP_TARGET_PORT="8081"
else
    TARGET_COLOR="blue"
    APP_TARGET_IP="192.168.1.10"
    APP_TARGET_PORT="8080"
fi

echo "Ambiente actual: $CURRENT_COLOR"
echo "Desplegando en: $TARGET_COLOR"

# Usar envsubst para generar la configuración
export APP_TARGET_IP
export APP_TARGET_PORT
export DEPLOYMENT_COLOR=$TARGET_COLOR

envsubst '${APP_TARGET_IP} ${APP_TARGET_PORT} ${DEPLOYMENT_COLOR}' \
    < /opt/blue-green/nginx/environments/nginx_${TARGET_COLOR}.conf \
    > /etc/nginx/conf.d/default.conf

# Validar y recargar Nginx
nginx -t && systemctl reload nginx

# Actualizar el archivo de estado
echo "CURRENT_COLOR=$TARGET_COLOR" > /opt/blue-green/current_deploy.env

echo "Despliegue completado. Ambiente activo: $TARGET_COLOR"