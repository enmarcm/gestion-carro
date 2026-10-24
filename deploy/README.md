# Despliegue

- `nginx/*.conf`: vhosts del host (certificados gestionados por certbot). Copiar a `/etc/nginx/sites-available/` y enlazar en `sites-enabled/`.
- Backup diario: `/opt/carro/backup.sh` (cron 03:30, rotación 7 días).
