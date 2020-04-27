# Pleroma-Livestreaming

Create a self-hosted twitch-like thing connected to pleroma!

You will need:
- docker
- node.js

## Installation

First you'll need to pull some docker containers

```bash
docker pull nginx
docker pull floatingghost/movienight
docker pull floatingghost/movie-night-chat
```

Then install JS deps
```bash
sudo npm i -g yarn
git clone git@github.com:FloatingGhost/pleroma-livestreaming.git
cd pleroma-livestreaming/src
yarn
```

Then configure things. `cp .env.example .env` and edit stuff.

Then you'll want to set up your nginx. Just use the config I provided in `install/` and change bits.

Then install the systemD file from `install/` and you should be good to go.
