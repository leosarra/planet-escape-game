
# Planet Escape
Planet Escape is a game developed as the final project of the Interactive Graphics course held at Sapienza University.<br/>
Planet Escape is an endless runner type of game with a low-poly style.<br/>
The goal is to dodge/destroy the enemies that you, as a spaceship, will encounter along the way and to go as far as possible to establish your record. At the same time, you will have to manage your spaceship's energy to prevent it from going dry and so losing.

Full report can be found [here](doc/report.pdf)

## Before playing...
The game comes with a checkbox in the in-game "Debug menu" to enable or disable dynamic animations whose behavior depends on the delta time between rendered frames, these dynamic animations are **disabled by default**.<br/>
Enabling dynamic animations ensures a smooth game even in case the client's performance fluctuates, on another end animations' quality may drop drastically on low-end machines. The game speed may also be influenced and so the difficulty.<br/>
Instead, if the animations don't depend on the delta time they will be extremely smooth but the game may be subject to slowdowns on less powerful machines.<br/>
**You may want to change this option depending on the machine you are playing on**.

## How to play
To play the game you may use the following [link](https://sapienzainteractivegraphicscourse.github.io/finalproject-planet_escape/).<br/><br/>
If you want to play it locally you need to use a server to deliver the files and prevent CORS errors.<br/>
Linux users may use the provided "start_server.rc" script that will automatically start a server on "127.0.0.1:8000".<br/>
Otherwise you can put in windows/MacOS terminal the following command:

    python3 -m http.server 8000 --bind 127.0.0.1
Note that Python 3 is required to execute the server.
