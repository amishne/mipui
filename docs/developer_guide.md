# Mipui Developer's Guide

*Mipui* is a free web app for creating and editing maps for tabletop and role-playing games.
This is the developer's guide; see [the main site](www.mipui.net) or just [jump right into the editor](www.mipui.net/app).

## Implementation

*Mipui* is a hobby project implemented by just one developer; please don't judge :-)

It's a client-side web application, written entire in Javascript.
The server-side component is done using [Firebase](firebase.google.com).
With the exception of Firebase and a couple of Javascript libraries used for exporting to image, no external code libraries are used.

Some specific tricky pointers:



## Testing

Testing is mostly manual, though a couple of tricky-to-test components have their own sets of unit tests.
As a personal challenge I tried to write them without any test framework;
I know it's a terrible practice but I just wanted to try.
I do recommend using existing frameworks!
