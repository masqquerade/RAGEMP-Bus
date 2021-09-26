function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

mp.events.add('console_pos', (player) => {
    console.log(`{ x: ${player.position.x.toFixed(3)}, y: ${player.position.y.toFixed(3)}, z: ${player.position.z.toFixed(3)} },`)
})

// ---------------------------------

let vehs = []
let busCoords = [
    { x: -2019.689, y: -478.252, z: 11.395 },
    { x: -2015.214, y: -480.471, z: 11.393 },
    { x: -2014.403, y: -481.938, z: 11.407 },
    { x: -2012.052, y: -483.640, z: 11.411 },
    { x: -2009.895, y: -485.298, z: 11.414 },
    { x: -2007.177, y: -487.851, z: 11.411 }
]

mp.events.add('packagesLoaded', () => {
    for (let i = 0; i < busCoords.length; i++) {
        let vehicle = mp.vehicles.new(0x84718D34, new mp.Vector3(busCoords[i].x, busCoords[i].y, busCoords[i].z), {
            heading: 280
        })

        vehicle.setVariable('busWork')

        vehs.push(vehicle)
    }
})

mp.events.add('playerReady', (player) => {
    player.position = new mp.Vector3(-2022.800, -463.193, 11.521)
    player.bus = false
    player.busStatus = 0
})

let colshape = mp.colshapes.newSphere(-2033.913, -462.430, 11.424, 2, 0)
mp.markers.new(1, new mp.Vector3(-2033.913, -462.430, 10.424), 1,
    {
        visible: true,
        color: [44, 128, 239, 150],
        dimension: 0
    })

busBlip = mp.blips.new(513, new mp.Vector3(-2033.913, -462.430, 10.424),
    {
        name: 'Автобусы',
        scale: 1,
        color: 57,
        dimension: 0,
    })

function playerEnterColshapeHandler(player, shape) {
    if (shape == colshape) {
        if (player.bus) {
            mp.events.call('Bus_endWork::SERVER')
        } else {
            player.notify('Вы устроились водителем автобуса.')
            player.outputChatBox('Возьмите свободный автобус и начинайте работать.')
            mp.events.call('startWork::server', player)
        }
    }
}

// ---------------------------------

mp.events.add('startWork::server', (player) => {
    player.bus = true
    player.call('Bus_startWork::CLIENT')
})

mp.events.add('Bus_endWay::SERVER', (player, earn) => {
    if (player.bus && player.seat == 0) {
         player.outputChatBox('Вы завершили маршрут.')
         player.notify('Вы заработали: ' + earn)
    } else {
        return
    }
})

mp.events.add('Bus_enterPoint::SERVER', (player) => {
    if (player.bus && player.seat == 0) {
        player.notify('Отправляйтесь к следующей остановке.')
    }
})

mp.events.add('Bus_endWork::SERVER', (player) => {
    let key = player.getVariable('personalBusKey')
    player.getVariable('personalBus').destroy()
    vehs[key] = mp.vehicles.new(0x84718D34, new mp.Vector3(busCoords[key].x, busCoords[key].y, busCoords[key].z), {
        heading: 280
    })
    player.bus = false
    player.busStatus = 0
    player.notify('Вы уволены.')
})

mp.events.add('playerEnterVehicle', (player, vehicle) => {
    if (!player.bus && player.seat != 0) {
        player.call('Bus_getBusTips::CLIENT', [vehicle])
    }
    for (var [key, value] of Object.entries(vehs)) {
        if (vehicle == value) {
            if (player.bus && player.seat == 0) {
                player.setVariable('personalBus', vehs[key])
                player.setVariable('personalBusKey', key)
            } else if (!player.bus && player.seat != 0) {
                player.call('Bus_getBusTips::CLIENT', [vehicle])
            } else {
                player.removeFromVehicle()
                player.outputChatBox('Вы не работаете водителем автобуса!')
                break
            }
        }
    }
})
    
mp.events.add('Bus_getBusTips::SERVER', (_player, seat) => {
    console.log(_player)
    console.log(seat)
    _player.notify('Вы получили: ' + getRandomInt(150) + '$ чаевых')
})

mp.events.add('playerQuit', (player) => {
    if (player.bus) {
        let key = player.getVariable('personalBusKey')
        player.getVariable('personalBus').destroy()
        vehs[key] = mp.vehicles.new(0x84718D34, new mp.Vector3(busCoords[key].x, busCoords[key].y, busCoords[key].z), {
        heading: 280
    })
    } else {
        return
    }
})

mp.events.add('playerEnterColshape', playerEnterColshapeHandler)