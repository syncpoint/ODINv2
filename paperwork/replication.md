## Change user's permissions on rooms aka layers

* send state event `m.room.power_levels`
  (_matrix/client/r0/rooms/{{ room_id }}/state/m.room.power_levels)

* users that are members of the space may join the child room without
  being invited

* ODIN defines a number of relevant powerlevels
  -   0 read only access
  -  25 read+write access (send message events)
  -  50 change layer name (send some state events)
  - 100 god mode (creator)

* a shared layer is read-only by default, permissions for
  individual users may be changed at any time

* upon creation this is the default powerlevel structure:
```json
{
    "users": {
        "@fall:trigonometry.digital": 100,
        "@summer:trigonometry.digital": 50
    },
    "users_default": 0,
    "events": {
        "m.room.name": 50,
        "m.room.power_levels": 100,
        "m.room.history_visibility": 100,
        "m.room.canonical_alias": 100,
        "m.room.avatar": 50,
        "m.room.tombstone": 100,
        "m.room.server_acl": 100,
        "m.space.child": 111,   // no nested child rooms
        "m.room.topic": 50,
        "m.room.pinned_events": 50,
        "m.reaction": 100,
        "m.room.redaction": 100
    },
    "events_default": 25,
    "state_default": 100,
    "ban": 100,
    "kick": 100,
    "redact": 100,
    "invite": 100,
    "historical": 100
}
```
