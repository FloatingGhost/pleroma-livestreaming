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

## Installing an IRC bridge

Consider installing an IRC bridge to allow users to view your stream
without having to use the web interface

Install [Epi's bridge](https://notabug.org/epi/movie-night-chat) and
use the systemd file I've provided here to allow IRC functionality.

Incidentally, the raw FLV endpoint is `/channels/<channel>/live` - point
VLC/MPV at that to view streams without using the webclient
