---
title: Smart Device App protocol
permalink: /calibre/
---
# Smart Device App protocol

## Resources

### mitm

mitm has been used to spy the data exchange between Calibre and a client

```bash
mitmweb --mode reverse:tcp://localhost:9090@9091
```

The zeroconf cannot be used in this case. the client needs to be configured manually in order to point to the mitm reverse proxy instead of calibre directly.

I used KOReader as it allows to setup the hostname and port manually.

### source code

* calibre https://github.com/kovidgoyal/calibre/blob/master/src/calibre/devices/smart_device_app/driver.py
* koreader  https://github.com/koreader/koreader/blob/master/plugins/calibre.koplugin/wireless.lua

## Data structure

The exchanges a structured as a 3 part

```
{size}[{operation}, {message}]
```

**Example**

```
40[0,{"free_space_on_device":46248222720}]
```

## Operations

### codes

| code | name | description             |
| ---- | ----------------------- | ----------------------- |
| 0    | OK                      ||
|1      | SET_CALIBRE_DEVICE_INFO                        ||
|2      |SET_CALIBRE_DEVICE_NAME                         ||
| 3    | GET_DEVICE_INFORMATION  ||
|4 |TOTAL_SPACE||
| 5    | FREE_SPACE              ||
| 6    | GET_BOOK_COUNT          ||
| 7    | SEND_BOOKLISTS          ||
|  8    | SEND_BOOK               ||
| 9    | GET_INITIALIZATION_INFO ||
| 11   | BOOK_DONE               ||
| 12   | NOOP                    ||
| 13   | DELETE_BOOK             ||
| 14   | GET_BOOK_FILE_SEGMENT   ||
| 15   | GET_BOOK_METADATA       ||
|  16    | SEND_BOOK_METADATA                        ||
| 17   | DISPLAY_MESSAGE         ||
| 18   | CALIBRE_BUSY            ||
| 19   | SET_LIBRARY_INFO        ||
| 20   | ERROR                   ||



## initial handshake

```mermaid
sequenceDiagram
    autonumber
    participant Calibre
    participant Device
    actor User
    User->>Device: connect to calibre
    Device --> Calibre: open tcp connection
    Calibre->>+Device: GET_INITIALIZATION_INFO(9) {GetInitialInfoRequest}
    Device-->>-Calibre: OK(0) {GetInitialInfoResponse}
    note over Calibre,Device: ref: Get device information
    note over Calibre,Device: ref: Set library info
    note over Calibre,Device: ref: Get list of books on device
    note over Calibre,Device: ref: Send metadata to device
```

## Get device information

```mermaid
sequenceDiagram
    autonumber
    participant Calibre
    participant Device
    Calibre->>+Device: GET_DEVICE_INFORMATION(3) {}
    Device-->>-Calibre: OK(0) {GetDeviceInformationResponse}
    Calibre->>+Device: SET_CALIBRE_DEVICE_INFO(1) {SetCalibreDeviceInfoRequest}
    Device-->>-Calibre: OK(0) {}
    Calibre->>+Device: FREE_SPACE(5) {}
    Device-->>-Calibre: OK(0) {FreeSpaceResponse}
```

## Set library information

```mermaid
sequenceDiagram
    autonumber
    participant Calibre
    participant Device
    Calibre->>+Device: SET_LIBRARY_INFO(19) {SetLibraryInfoRequest}
    Device-->>-Calibre: OK(0) {}
    Calibre->>Device: NOOP(12) {count:xx}
```
## Send metadata to device
```mermaid
sequenceDiagram
    autonumber
    participant Calibre
    participant Device
    Calibre->>+Device:SEND_BOOKLISTS(7) {SendBooklistsRequest}
```



## Get list of books on device
```mermaid
sequenceDiagram
    autonumber
    Calibre-->>Device: GET_BOOK_COUNT(6) {GetBookCountRequest}
    Device-->>Calibre: OK(0) {GetBookCountResponse}
```


## Upload one book to the device

```mermaid
sequenceDiagram
    autonumber
    actor User
    User->>Calibre: push selected book
    Calibre->>+Device: FREE_SPACE(5) {}
    Device-->>-Calibre: OK(0) {FreeSpaceOnDeviceResponse}
   	Calibre->>+Device: SEND_BOOK(8) {SendBookRequest}
   	Device-->>-Calibre: OK(0) {}
   	Calibre->>Device: bytes[]
   	Calibre->>Device: SEND_BOOKLISTS(7) {SendBooklistsRequest}
    Calibre->>+Device: FREE_SPACE(5) {}
    Device->>-Calibre: OK(0) {FreeSpaceOnDeviceResponse}
```



## Delete books from the device

```mermaid
sequenceDiagram
    autonumber
    actor User
    User->>Calibre: Delete Book selection
    Calibre->>+Device: DELETE_BOOK(13) {DeleteBookRequest}
    Device-->>Calibre: OK(0) {}
    loop for lpath in request.lpaths
        Device->>-Calibre: OK(0) {DeleteBookResponse}
    end
    Calibre->>Device: SEND_BOOKLISTS(7) {SendBooklistsRequest}
    Calibre->>+Device: FREE_SPACE(5) {}
    Device-->>-Calibre: OK(0) {FreeSpaceOnDeviceResponse}
```



## Download books from device
```mermaid
sequenceDiagram
    autonumber
    actor User
    User->>Calibre: download selected book
    Calibre->>+Device: GET_BOOK_FILE_SEGMENT(14) {GetBookFileSegmentRequest}
    Device-->>Calibre: OK(0) {GetBookFileSegmentResponse}
    Device-->>-Calibre: bytes[] 
```



# Questions

* what happens if the metadata structure changes and we activated cached metadatas?
* what is the use of the lpath? can't the device decide it's data structure itself ?
* the lpath seems to remain constant even after renaming the book. what happens if i update it ?