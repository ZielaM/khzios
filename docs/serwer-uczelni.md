# Konfiguracja serwera: reverse proxy, dostęp do panelu, kopie zapasowe

Dokument dla osób administrujących serwerem uczelni. Aplikacja działa w Docker Compose (`docker-compose.yml` w repozytorium): kontener aplikacji Next.js, kontener PostgreSQL oraz wolumen `uploads` na pliki wgrane w panelu administracyjnym. Aplikacja nie obsługuje HTTPS sama — potrzebny jest przed nią reverse proxy.

## 1. Reverse proxy (nginx)

Aplikacja nasłuchuje na `127.0.0.1:3000` (zmienne `APP_BIND` i `APP_PORT` w `.env.docker`). Jeśli proxy działa na innej maszynie, trzeba ustawić `APP_BIND=0.0.0.0` i ograniczyć port zaporą tylko do adresu proxy — inaczej klient łączący się bezpośrednio mógłby podać fałszywy nagłówek `X-Forwarded-For` i obejść limit prób logowania na adres IP.

Wymagania wobec proxy:

- HTTPS (certyfikat uczelni lub Let's Encrypt). Po stronie aplikacji `APP_URL` musi zaczynać się od `https://`, bo od tego zależy flaga `Secure` ciasteczka sesji.
- Nagłówek `X-Forwarded-For` ustawiany przez `$proxy_add_x_forwarded_for`. Aplikacja bierze **ostatni** wpis jako adres klienta: do dziennika logowań i limitu prób.
- Limit rozmiaru żądania co najmniej 25 MB (wgrywanie zdjęć i PDF-ów w panelu).

```nginx
# /etc/nginx/sites-available/khzios
server {
    listen 443 ssl;
    http2 on;
    server_name khzios.up.poznan.pl;

    ssl_certificate     /etc/ssl/certs/khzios.pem;
    ssl_certificate_key /etc/ssl/private/khzios.key;

    add_header Strict-Transport-Security "max-age=31536000" always;
    client_max_body_size 25m;

    # Opcjonalne blokady ręczne (sekcja 3)
    include /etc/nginx/khzios-blocked.conf;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}

server {
    listen 80;
    server_name khzios.up.poznan.pl;
    return 301 https://$host$request_uri;
}
```

## 2. Opcjonalnie: panel tylko z sieci uczelni lub VPN

Panel jest chroniony hasłem, drugim składnikiem (TOTP) i limitem prób, więc ograniczenie sieciowe to dodatkowa warstwa, nie warunek bezpieczeństwa. Jeśli uczelnia się zgodzi, wystarczy osobny blok `location` dla adresu panelu (wartość `ADMIN_PATH` z `.env.docker`) w bloku `server` z HTTPS:

```nginx
    # Adres panelu jest poufny: plik konfiguracyjny tylko do odczytu dla root
    location /zaplecze-3f9a1c2b7d4e {
        allow 192.0.2.0/24;     # sieć uczelni — zakres do uzupełnienia
        allow 198.51.100.0/24;  # pula adresów VPN — do uzupełnienia
        deny  all;

        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

Spoza tych sieci panel odpowie wtedy `403`. Zasoby strony (`/_next/…`, `/media/…`) zostają publiczne, bo korzysta z nich też strona dla odwiedzających.

## 3. Blokowanie adresów IP

Aplikacja sama wstrzymuje logowanie po 5 nieudanych próbach na login lub 20 z jednego adresu w ciągu 15 minut. Adresy prób widać w panelu: **Dziennik → Logowania**. Trwałe blokady należą do serwera WWW, nie do aplikacji.

**Ręcznie** — plik dołączany w konfiguracji z sekcji 1:

```nginx
# /etc/nginx/khzios-blocked.conf
deny 203.0.113.45;          # przykładowe adresy
deny 203.0.113.128/25;
```

Po zmianie: `nginx -t && systemctl reload nginx`.

**Automatycznie (fail2ban)** — nginx ogranicza tempo żądań do panelu, a fail2ban blokuje adresy, które ten limit wielokrotnie przekraczają. Wbudowany filtr `nginx-limit-req` czyta komunikaty z `error.log`:

```nginx
# w bloku http (np. /etc/nginx/conf.d/khzios-limits.conf)
limit_req_zone $binary_remote_addr zone=khzios_admin:10m rate=60r/m;

# w bloku location panelu (sekcja 2; bez niej — dodaj taki blok bez allow/deny)
    limit_req zone=khzios_admin burst=60 nodelay;
```

```ini
# /etc/fail2ban/jail.d/khzios.local
[nginx-limit-req]
enabled  = true
logpath  = /var/log/nginx/error.log
findtime = 10m
maxretry = 10
bantime  = 1h
```

Duży `burst` jest celowy: przeglądarka po otwarciu panelu pobiera z wyprzedzeniem kilkanaście podstron z menu, co nie może skończyć się blokadą redaktora.

## 4. Kopie zapasowe

Komplet danych to **baza PostgreSQL i wolumen `uploads`** (zdjęcia i PDF-y z panelu); baza zawiera odnośniki do tych plików. Nazwy wolumenów mają prefiks projektu Compose: `khzios_pgdata`, `khzios_uploads`.

```bash
#!/bin/sh
# /usr/local/bin/khzios-backup — np. z crona codziennie o 3:00:
#   0 3 * * * /usr/local/bin/khzios-backup
set -e
cd /srv/khzios                      # katalog z docker-compose.yml i .env.docker
DEST=/var/backups/khzios
DATE=$(date +%F)
mkdir -p "$DEST"

docker compose --env-file .env.docker exec -T db \
  sh -c 'pg_dump -U "$POSTGRES_USER" -Fc "$POSTGRES_DB"' > "$DEST/db-$DATE.dump"
docker run --rm -v khzios_uploads:/data:ro -v "$DEST":/backup alpine \
  tar czf "/backup/uploads-$DATE.tar.gz" -C /data .

# Kopie starsze niż 30 dni
find "$DEST" -type f -mtime +30 -delete
```

Odtworzenie (na zatrzymanej aplikacji):

```bash
docker compose --env-file .env.docker stop app
docker compose --env-file .env.docker exec -T db \
  sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' < db-2026-10-01.dump
docker run --rm -v khzios_uploads:/data -v "$PWD":/backup alpine \
  sh -c 'rm -rf /data/* && tar xzf /backup/uploads-2026-10-01.tar.gz -C /data'
docker compose --env-file .env.docker start app
```

Kopie warto trzymać także poza tym serwerem.

## 5. Pytania do uczelni

1. Czy reverse proxy (nginx) z certyfikatem HTTPS będzie na tym samym serwerze co aplikacja?
2. Czy można ograniczyć adres panelu do sieci uczelni lub VPN (sekcja 2)? Jakie zakresy adresów?
3. Czy na serwerze jest (lub może być) fail2ban (sekcja 3)?
4. Gdzie trzymać kopie zapasowe poza serwerem i kto ma do nich dostęp?
