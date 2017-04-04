# Mipui Developer's Guide

*Mipui* is a free web app for creating and editing maps for tabletop and role-playing games.
This is the developer's guide; see [the main site](www.mipui.net) or just [jump right into the editor](www.mipui.net/app).

## Implementation

*Mipui* is a hobby project implemented by just one developer with no background in web development; please don't judge the code quality :-)

It's a client-side web application, written entire in Javascript.
The server-side component is done using [Firebase](firebase.google.com).
With the exception of Firebase and a couple of Javascript libraries used for exporting to image, no external code libraries are used.

## Firebase server

There are three live firebase database repositories: mipui-prod, mipui-dev and mipui-test.

* mipui-prod is the repository serving the live version at mipui.net. **Never use that repository**.
* mipui-dev is the repository used for development. Feel free to use that repository when testing any changes. This is the default repository used in the code. Information on this repository might get wiped from time to time, though, so don't rely on it for long-term storage.
* mipui-test is used for running unit tests. Please immediately clean any information you create there.

## License

This software is published under an MIT license.

## Testing

Testing is mostly manual, though a couple of tricky-to-test components have their own sets of unit tests.
As a personal challenge I tried to write them without any test framework;
I know it's a terrible practice but I just wanted to try.
I do recommend using existing frameworks!
