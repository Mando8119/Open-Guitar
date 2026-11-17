# Android status

The repository includes `capacitor.config.ts` with an app ID, app name, `dist` web directory, and HTTPS Android scheme. This is preparation for a Capacitor wrapper; it does not establish that a native Android project has been generated, built, installed, or tested. No Android toolchain/device validation is recorded here.

The app uses browser `getUserMedia`, `AudioContext`, `AudioWorklet`, and a module Worker. Android support therefore needs verification in the selected WebView and on real hardware, including permission prompts, AudioWorklet loading, pause/resume and cleanup, device changes, and latency. Test actual guitar input; synthetic detector tests do not cover Android microphone behavior.

To prepare a real Android release, install and configure the required Android/Capacitor tooling, generate/synchronize the native project, then build and test on a physical device. Record the OS/device, WebView version, permission flow, and measured audio behavior. Do not describe the app as Android-validated until that work is complete.
