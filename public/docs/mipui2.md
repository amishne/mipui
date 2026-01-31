# Mipui 2.0 Modernization Roadmap

# Introduction

This document outlines the scope, principles, and specific tasks for updating Mipui to version 2.0. The primary goal is to improve the user experience and visual design, while keeping the technical foundation unchanged.

# Mipui Overview

Mipui is a web app hosted on [https://www.mipui.net/](https://www.mipui.net/). It’s an open-source app for creating and sharing old-school, symbolic, top-down maps for tabletop role-playing games and similar applications. It’s simple, requires no registration, and supports live-editing, google-docs-style, between multiple users.

# Principles

The following elements must be preserved in Mipui 2.0:

* **Vanilla JS:** Mipui is a vanilla JS app. No react, no jsquery, no typescript, no obfuscation, no linters, not even any build step. This is a core principle that we want to preserve.  
  * However it’s okay to use more recent core browser web technologies as long as they are widely supported.  
* **Minimal dependencies:** Mipui has minimal external dependencies, and adding new dependencies is discouraged, and all new dependencies should be placed locally.  
* **Firebase:** Mipui is a serverless Firebase app. We will not change this or introduce new dependencies or add any server-side logic.  
  * Exception: We will add new cloud functions though, see below.  
* **Data backward compatibility:** Old maps must be loadable in Mipui 2.0. This means no changes to the underlying data used to represent a map, as defined in public/app/[state.js](http://state.js). However there are a few backward-compatible exceptions, as detailed below.  
* **Keep logic:** This modernization is mostly concerned with user-facing changes. The core logic of the app should not be changed.  
  * Examples: how gestures work, how data is stored, how operations are handled, etc., should not change.  
* **Avoid polish and bugfixes on old code:** Do not try to incorporate various fixes or API updates or other improvements, beyond the requested tasks. Yes, there’s a lot of room for improvement, but for this effort we’re focusing on the big things. Don’t even try to fix bugs if they are already existing and unrelated to this effort.

# Style Guide

* Analyze the code’s existing style (indentation, width limit, naming styles, etc. etc.) and try to be as consistent with it as possible. This is part of “task 0” below.  
* Be generous with commets: Don’t add trivial comments, but add comments to functions and to any tricky or complex sections of code. No need for extensive doc comments that detail each and every parameter.

# Procedure

## GitHub

A new branch will be created on Github, called “v2”. All changes will be made there. Until complete, that version will default to use the dev firebase server instead of the prod one.  
Commits should always leave the app in a functional state, even if it means some commits might be large.  
But in general, split each of the below tasks into smaller milestones and address each milestone at a time - and with its own commit(s). Don’t try to do too many things in one go.

## State Changes

The following changes will be made to the storable state for each map. All code must be able to handle these when loading/saving state.

* The map version of new maps will be “2.0” instead of “1.0”. Maps loaded in Mipui 2.0 and then saved will also use “2.0” instead of “1.0”.  
* New property in the property map, with the key name `lastModified` and the mnemonic `m`. EVERY write operation will now include a change to this key to update it to the latest timestamp, using the standard Firebase way, e.g. `serverTimestamp()`.

## Firebase

This modernization includes new cloud functions. These should be commited into our branch as usual, into the `firebase` directory.

## Working with AI

* Not sure what to do? Found a contradiction in the requirement? Something is missing? Encountered an implementation problem? Found a bug?  
  * Recall our principles and procedures.  
  * Use industry standard approaches, as long as they’re compatible with our principles.  
  * Focus on the “main idea” at the beginning of each task as the guiding light.  
  * Pause and ask the user! It’s important to solicit feedback.  
* The user might change code in-between AI invocations. Whenever yielding control to the user, after control returns to the AI, re-read files whenever they’re about to be changed to ensure changes are made to the latest version.  
* Be sure to read the development guide before starting, at public/docs/developer_guide.html.

# Task List

This is a breakdown of what we want to do. Each of the below tasks is large and requires careful thought and planning. Each should be broken down into sub-tasks that should be performed one at a time. Changes should be comitted whenever the app is self-consistent (runs as expected). Use brief but descriptive commit names.

## Task 0: Prepare

Main idea: prepare for the rest of the tasks.

* Create and switch to a new GitHub branch.  
* Change the code with the new state changes.  
  1. So, if saving a map which is version 1, change it to 2.  
  2. Always update `lastModified`, with every full map save and every small update.  
  3. Ensure the new version can successfully load version 1 maps.  
* Analyze the existing style code of the project (indentation, width limit, naming styles, etc. etc.) and create a “style_guide.md” file to summarize it. Use that filer for the rest of the development to maintain a consistent code generation style throughout.

## Task 1: Cold storage

Main idea: offload maps that were not recently used from expensive “Firebase Realtime Database” to cold-storage at the cheaper “Firebase Storage”, by using cloud functions to offload and restore maps between them, all with minimal disruptions to users who try to load cold-stored maps.

* This is the main motivation for the aforementioned `lastModified` properly.  
  * The existing storage is Firebase Realtime Database. We still want to use this exclusively for all operations; offloading and restoring to/from the cold storage will be done with cloud functions only and will not directly affect app code.  
  * The cold storage is Firebase Storage.  
  * The cloud functions mentioned below should also be as efficient as possible to not incur high costs.  
* We will create 3 cloud functions: an offloading function (runs when a cloud function schedules it), a restoring function (runs when the web app requests it), and a janitor function (runs once a week). Until we’re ready, they should only be deployed to mipui-dev and not mipui-prod.  
* Offloading function: Goes over the first 500 maps, each map with `lastModified` property older than 90 days (or entirely missing) is stored into a dedicated json file in Firebase Storage (instead of Firebase Realtime Database) and then removed from the Realtime Database. Put the file under the `maps/` directory and name it `$mid.mipui` where `$mid` is the map ID.  
  * Use `limitToFirst` to stop after 500 entries.  
  * If all 500 maps have been processed:  
    * Store a watermark of “lastProcessedMid” at completion so that the next invocation could start at the next 500 maps (use `startAfter`). Store it in a special field in the Realtime Database, under a new “bookkeeping” parent  
    * Then schedule another invocation of the offloading function to run 1 hour in the future.  
  * If less than 500 maps are found, it means we’re at the end of the database.  
    * Delete the watermark so that the next invocation will run from the beginning.  
    * Do not schedule any future invocation.  
  * The end result is that whenever this function starts, it keeps running every hour until it processes the entire maps list - its first such “loop” will span over weeks (there are currently 680,000 maps) but it WILL end (it processes 12,000 maps a day, which is much more than how many maps are created or modified in a day).  
* Janitor function: responsible for restarting a new offloading loop if there isn’t one already in progress.  
  * Runs once a week.  
  * Checks if the watermark (that bookkeeping/lastProcessedMid field) is present. If it is, the function does nothing (it means the offloading loop is in progress). If it isn’t, it runs the offloading function (essentially, starting a new offloading loop).  
* Restoring function: Called by the web app when attempting to load a nonexistent map.  
  * Notice its permissions must allow it to be called by the web app! Notice that users should be allowed to load a map even if they don’t have write permissions (= don’t know the secret) to it.  
  * This will check if the map is in cold storage, and if so load it back into Realtime Database AND update (or write, if missing) its `lastModified` properly to be now (and update it to version “2.0” if it’s not already), then delete it from the Storage.  
  * It will then notify the web app whether it was succesfully loaded (which the web app should interpret as a signal to try loading the map again) or send an error if it doesn’t exist in cold storage.  
* Important: once we deploy Mipui 2.0, these changes and cloud functions will affect the real existing database. We need to add some tests to ensure they work as expected. mipui-test is available for this (as opposed to mipui-dev or mipui-prod).  
  * See test/database_rules_test.html for an example of firebase tests.  
* After implementing these functions, we should add to the web-app the functionality calling the restoring function when trying to load a nonexistent map.

## Task 2: Update UI

Main idea: Mipui’s UI (menus, dialogs, everything that isn’t the map) is extremely basic, and essentially looked dated from the get-go. Let’s modernize it.

* Change the CSS so that it looks more modern and consistent, but be sure to keep the control density high so it can still show the same elements as before in the same space.  
  * No flashy animation or anything. Simple and dense, just more modern. Prefer some sort of timeless design that won’t look outdated in a few years.  
* There are other elements of the UI aside from the top menu, mostly in the shape of dialogs. Modernize these as well, following the same direction.  
* The changes in this task should mostly stay in CSS-land. Recall our principles!  
  * Only use standard HTML elements, don’t use any web framework or widget library.  
  * Do NOT use tailwind or similar approaches; instead, keep to the existing CSS schemes, mostly keeping CSS class names and such, just update the content of classes.  
  * DON’T modify anything about the map itself. We’re only modifying the UI. Map rendering will be handled later.

## Task 3: Add login flow, add user page with a list of your maps

Main idea: Right now users who want to store their Mipui maps have to just save their URLs somewhere. Let’s instead introduce a log-in flow for users to be able to “star” maps (whether or not they created them) and see them in their own user page.

* Add ability to log in (and out) with user/password, google credentials, github credentials, etc. Use Firebase APIs as much as possible.  
* Important: there’s an existing half-baked attempt to do that, see mipui/public/app/[user.js](http://user.js) and uses of the `/users/` path in public/app/[state.js](http://state.js), public/app/operation_center.js, the state.user field, and existing uses of the Firebase log-in APIs.  
  * Notice it’s half-baked, with a lot of commented-out code in user.js.  
  * Reuse that file, and incorporate the existing code and system whenever possible.  
  * Also incorporate the current /users/ path in the Realtime Database. For example, currently the only data used under it is /users/<uid>/secrets/…, but things like the “stars” (see below) should probably go under /users/<uid>/starred/.  
  * In particular, it means we want to use the same sort of user id in the new system, so it’s backward-compatible. It should be easy since it already should be a Firebase-created user id.  
* For logged-in users, add an ability to “star” a map. Also, maps logged users create should automatically become starred by that user at creation. Starred maps are part of the user storage and should be stored in the data as such (like we mentioned above, under /users/<uid>/starred/), being starred is not a trait of the map itself and should not be stored on it.  
* Add a user page, visible only to logged-in users. It lists all the maps they starred, and add other standard user functionalities (change password etc.)  
  * The map list will show the map name, description, creation date, and (if available) last modified date.  
* Users should be able to unstar maps as well, but open a warning dialog, explaining that they should save their URL somewhere else if they ever want to be able to find them again.

## Task 4: Add rendering and gesture testing

Main idea: We want to add extensive testing to user interactions with the app and how it’s rendered. It’s important to have it so that it would (1) help find existing bugs, (2) help debug future bugs, but most importantly: (3) make the next task (canvas migration) much easier and minimize regressions.

Important: this task includes adding tests only, no implementation changes unless they are required to make something more testable.

* Map rendering tests  
  * We want to create a basic map with many of the features packed in tight, and have a screenshot test of it to ensure it’s rendered as expected. Then repeat this test for each possible theme, and for several zoom levels (default, x2, x0.5, min level, max level). The total number of test cases (and screenshots) needs to be #themes x #zoom levels.  
* Map interaction tests  
  * Notice those don’t include hovering - hovering is covered as part of gesture testing.  
  * Test scrolling and panning, each on several zoom levels.  
    * Ensure scrolling / panning is constrained so that you can scroll until the map ends at the center of the viewport. i.e. if you scroll all the way up and left, the top-left of the map should be in the exact center of the visible map area.  
    * Ensure panning works so that the slot you drag stays exactly under the cursor (or finger).  
  * Test zoom  
    * Test that zooming reaches and stops at the max minimum and maximum levels.  
    * Test the complex pinching logic: it should follow the princile that the content under both fingers should move with the fingers. This implies that pinching is both zooming AND panning, which behaves as if the center point between the fingers is dragged.  
* Gesture tests  
  * For each gesture, identify use-cases and add tests.  
  * These should both check that the state is updated as expected, and use screenshot testing to ensure the result looks correct.  
  * Hovering is part of a gesture. Each gesture should also test its on-hover rendering behavior.  
* To produce screenshots, use Mipui’s existing image-generating capabilities.  
* Tiling should be disabled for all these tests.  
* This is a big task. Focus on getting basic rendering first, then basic interaction (zoom, pan, etc.), then iterate on each gesture at a time until it’s perfect, before proceeding to the next gesture.  
* Important: tests should reuse testing infrastructure as much as possible.  
* Open question: which test framework to use? Mipui already has a home-grown test harness. Since we want to minimize external dependencies, we want to reuse it as much as possible. Try to do so, but if your analysis suggests that reusing it would require a significant amount of added code, you can suggest an actual test framework to the user.

## Task 5: Add a canvas rendering mode

Main idea: Mipui uses DOM elements for rendering and interacting with the map, which leads to slowdown on large maps. There’s a tiling system in-place that significantly improves performance, but it comes with its own occasional bugs. We want to introduce an alternative rendering mode that uses HTML canvas instead of DOM elements.

* This is probably the most complex change. Take it slow and be careful.  
* First read public/posts/performance.html, to understand more about the background (why the existing implementation is slow, how tiling works).  
* Until we can be sure this outperforms the existing rendering logic, make canvas rendering depend on a toggleable flag, just like we have a toggleable tiling flag. Make this flag true by default for dev mode, though.  
* Almost all rendering is done by cells rendering themselves in mipui/public/app/cell.js, so that’s the initial expected change.  
* Interaction (hovering, clicking, dragging) is done by DOM events, it should be changed to canvas events that find the hovered cells using math.  
* Scrolling/panning/zooming should also be handled by canvas events. DO NOT scroll the canvas itself - instead re-render the view with logically different position / zoom. This is important for performance, since the underlying map could be huge. It means elements such as limiting the scrolling/panning when the edge is reached should be implemented in code.  
  * Pay attention to maintaining the current advanced pinch handling.  
  * Use existing tricks to improve canvas performance. e.g. disable interaction during scroll/pan/zoom, use drawImage to speed up panning, etc.  
* Important: Right now the theming is done by swapping CSS files. Change it so that it works with the canvas.  
* Finally, remove the tiling logic. It’s a complex system that’s pervasive throughout the rendering logic so this might be a big milestone.  
  * One remnant that might be useful is that this system creates phantom cells to render cell-crossing elements (text, icons, shadows) when the real cell rendering these would otherwise be outside the viewport and thus not normally important to render.  
  * The tiling logic might also be useful when exporting, but then again a canvas is probably better at exporting to start with.  
* Critical: Throughout this process, ensure our rendering and gesture tests all pass. Relying on these tests should be the KEY mechanism to ensure this migration works as expected.

## 