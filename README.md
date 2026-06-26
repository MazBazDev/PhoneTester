# PhoneTester

PWA Vue 3 pour diagnostiquer un iPhone avant achat entre particuliers.

## Docker + Traefik

Le projet peut etre expose derriere un Traefik externe sur `iphone.mazbaz.fr`.

1. Creer le reseau Traefik s'il n'existe pas:

```bash
docker network create traefik_public
```

2. Construire et lancer l'application:

```bash
docker compose up -d --build
```

3. Verifier le service:

```bash
docker compose ps
docker compose logs -f
```

L'application est servie par Nginx sur le port interne `80`, avec fallback SPA pour Vue Router.
