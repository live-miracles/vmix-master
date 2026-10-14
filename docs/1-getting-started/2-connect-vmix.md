# Connect to vMix

## Enable the Web Controller

vMix Master talks to vMix through its Web Controller, so that has to be on for every system
you want to control.

1. In vMix, open **Settings** and select the **vMix Web Controller** tab.
2. Tick the box at the top to enable it.
3. Note the port. The default is `8088`, and you should only change it if you know why.

The computer that opens vMix Master must be able to reach the vMix machine on that port, so
it needs to be on the same network, and the vMix machine's firewall must allow it.

If you set a password for the Web Controller, vMix Master does not send one. Check that
the system still shows as connected after you add it.

## Add a system

1. Open [vMix Master](https://live-miracles.github.io/vmix-master/) in Chrome.
2. Use the **+** button in the top bar. A new box appears with its address field open.
3. Type the address of the vMix machine and press **Enter**.

The address can be written in any of these ways:

| You type                            | It is used as                        |
| ----------------------------------- | ------------------------------------ |
| `192.168.1.20`                      | `http://192.168.1.20:8088/api/`      |
| `192.168.1.20:8090`                 | `http://192.168.1.20:8090/api/`      |
| `vmix-main.local`                   | `http://vmix-main.local:8088/api/`   |
| `https://vmix.example.com:8443/api` | `https://vmix.example.com:8443/api/` |

The scheme defaults to `http://`, the port to `8088`, and the path to `/api/`. If you leave out
the port it is added even for an `https://` address, so write the port when you use one.

To change a name or an address later, double-click it in the box. A click on the group
button adds the box to the group, and a click on the box makes it the master. The trash
button removes a box after asking you to confirm, and an **Undo** button appears afterwards
for a few seconds.

You can keep a list of addresses under **Settings → Host / API URL Suggestions**. They are
offered while you type an address.

## Chrome and your local network

The hosted page is served over HTTPS, while vMix answers over plain HTTP on your local
network. Chrome allows this, and the first time you connect it asks whether the site may
access devices on your local network. Choose **Allow**. The page only talks to the addresses
you enter.

If you would rather not use the hosted page, you can run a copy offline: download the ZIP of
the [`gh-pages` branch](https://github.com/live-miracles/vmix-master/tree/gh-pages), extract
it, and open `index.html` in Chrome.

## When a box says Unavailable

The dot in front of the name shows the state, and hovering it gives the detail.

| Dot          | Meaning                                                                |
| ------------ | ---------------------------------------------------------------------- |
| Green        | Connected                                                              |
| Red          | Unreachable. The tooltip has the reason, for example `Failed to fetch` |
| Grey         | No address entered                                                     |
| Pulsing grey | Waiting for the first answer                                           |

Things to check when a system will not connect:

- The Web Controller is enabled in vMix and the port matches the address.
- You can open `http://<ip>:8088/api/` in the same browser and see XML. If you do not, it is
  a network or firewall problem, not a vMix Master problem.
- "Not a vMix API response" means something answered at that address, but it is not vMix,
  for example another web server on the same port.
- You allowed the local network prompt in Chrome. You can change it under the site
  settings of the page.

## Try it without vMix

Use the host names `demo`, `demo2` and `demo3` for simulated systems that never touch the
network, or open [`?demo`](https://live-miracles.github.io/vmix-master/?demo) to get three
grouped ones. A banner at the top shows while demo systems are in use.

Next: [vMix scripts](../2-scripts/1-overview.md).
