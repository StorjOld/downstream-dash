# DriveShare Live Dashboard

This is a public dashboard that shows farmers that have interacted/are interacting with a DriveShare downstream verification node. 

![DriveShare Live](https://cloud.githubusercontent.com/assets/3324637/4874065/f791beb4-6238-11e4-867d-e95bb479b958.png)

## Can I see it live?
Yes! Simply visit [live.driveshare.org](https://live.driveshare.org). Your browser will need to support WebGL.

## What does this all mean?

### Sidebar

At the top of the sidebar, we indicate the number of farmers that have ever connected with this verification node (with uptime > 0%) and the number of countries they were collectively from. Underneath, we list all farmers by uptime in a scrollable list. Each farmer is listed by SJCX address and uptime percentage. Offline farmers are translucent. The color 'trim' next to each farmer's listing is unique to each farmer id. You can click on a farmer's listing and the globe will rotate to focus on it.

### Globe

The globe shows the *very* approximate locations (determined by IP address) of all farmers that have ever connected to the node. You can click on a farmer's "pin" to see more information about their performance, including number of heartbeats passed, number of contracts, additional location information and the size of the test files used for their heartbeats. Offline farmers have translucent pins. Online farmers that successfully pass a "heartbeat" will pulse.

## Where can I find more details?
This dashboard relays information from a test node running [downstream-node](https://github.com/storj/downstream-node). Information is collected from test farmers running [downstream-farmer](https://github.com/storj/downstream-farmer). Presently, this is for internal development testing only, but you can find out more details on how to participate in formal testing [here](http://storj.io/earlyaccess.html).


## Credits
The interface was based on work by [Danny Markov](http://tutorialzine.com/2014/09/real-time-visitor-globe-nodejs-webgl/). Tiles Courtesy of [MapQuest](http://www.mapquest.com/)![MapQuest](http://developer.mapquest.com/content/osm/mq_logo.png "MapQuest"). Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency.
