# ÉCOLE EYES — Privacy Policy

_Effective: <date of publication>. Contact: <your contact e-mail> — **replace these two placeholders and host this page at a
public URL before submitting to Google Play.**_

ÉCOLE EYES is a voice assistant for blind and visually impaired people. This policy says what the app does with your data.

## What the app can access, and only when you ask

* **Microphone.** Used to hear your requests after you tap the voice button, or while the optional *hands-free listening*
  is on (a notification is always visible while it is on). The app does not record or store audio. Speech-to-text is
  performed by the speech-recognition service installed on your phone (for example Google's), which may send audio to its
  provider unless you enable "Prefer on-device speech recognition". That provider's policy applies to that audio.
* **Camera.** Used only when you ask the assistant to look (describe, read text, continuous description). Photos are kept in
  memory, never saved by the app.
* **Files.** The app has **no storage permission**. It can only read folders or files you pick in the Android file picker,
  and you can remove that access in the app (Documents → *Remove access*) or in Android settings.
* **Contacts** (optional). Read on the phone only when you ask to call someone by name or to choose an emergency contact
  by voice. Names and numbers are never sent to the AI service or stored by the app (except the one emergency contact you
  choose, kept in encrypted settings). Choosing the emergency contact from the system picker needs no contacts permission.
* **Phone calls** (optional). The app places a call only after you say "yes" to a spoken confirmation. Emergency numbers
  are never called automatically: the dialer opens and you press call.
* **Location** (optional). Read once, only when you ask to share your location. It is put into a text message to your
  emergency contact that **you** send from your SMS app. It is never sent to the AI service and never stored.
* **Notifications** (optional). Only if you turn on *Notification access* for the app in Android settings, the app keeps
  the last 20 notifications **in memory** so it can read them aloud when you ask. They are never stored, never sent to the AI
  service, and are cleared when access is turned off.
* **Network.** Used to reach the AI service (below).
* **On-device analysis.** Colour naming, object and people detection for offline descriptions, and Latin-script text
  recognition run entirely on the phone (Google ML Kit bundled models). People are counted and placed, never identified.

## What is sent to the AI service

Only if you gave consent (asked aloud on first use; changeable in Settings at any time):

* your spoken request, as text;
* when you ask about your surroundings or to read text the phone cannot read itself: **one reduced-size photo** (≤ 1280 px);
* when you ask for a summary or explanation of a document: **the text of that document** (or the pages needed).

Requests go to a server operated by the app's publisher, which adds the secret API key and forwards the request to the AI
provider (Anthropic) to produce the answer. The publisher's server does not store or log request contents. The AI provider
processes the request under its own terms (see anthropic.com/legal/privacy); this app does not use your content to train models
and does not sell or share it for advertising.

The app announces aloud before each photo/document upload (you can switch the announcement off).

## What is stored on your phone

* Conversation history (what you said and the assistant answered): **encrypted** with a key held in the Android Keystore,
  kept for the last 200 messages. Clear it any time: say *"clear my history"* or use Settings.
* Reading positions of documents you read (hashed identifier + encrypted title/position).
* Settings (language, speech speed, consent choice, backend address/token, emergency contact) in encrypted storage.
* Notes you dictate: **encrypted** like the history; kept until you delete them (*"delete my notes"* or Settings).
* Reminders you set: the reminder text is kept by Android's WorkManager until it is delivered.

No account is required. No advertising, analytics or tracking SDKs are included. The app does not back up its data to the cloud.

## Children

The app is not directed to children under 13.

## Safety notice

Descriptions of the camera view can be wrong or incomplete. ÉCOLE EYES is not a safety device and cannot guarantee that a
path is free of obstacles. Keep using your cane, guide dog or other trusted aids.

## Your choices and rights

Withdraw cloud consent in Settings; revoke permissions in Android settings; delete all app data by clearing history and
uninstalling. For questions or requests about data, contact the e-mail above.

## Changes

Material changes will be announced in the app and in this document.
