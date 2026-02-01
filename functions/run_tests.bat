@echo off
set JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.6.7-hotspot
set PATH=%JAVA_HOME%\bin;%PATH%
call npx firebase emulators:exec --project test "mocha test/integration.test.js"
