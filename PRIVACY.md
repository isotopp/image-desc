# Privacy policy for Image Description

Effective date: August 12, 2026

Image Description creates image descriptions by sending an image, and any optional
context entered by the user, directly to a model provider chosen and configured by
the user.

## What the developer collects

The extension developer does not collect, receive, retain, sell, or share personal
data or usage data. The extension has no developer-operated service. It contains no
analytics, telemetry, advertising, tracking, or development-server connection.

Firefox and Mozilla use “data transmission” for data handled outside the extension
or local browser. Under that definition, a request sent directly to the user's
configured provider is a transmission even though the extension developer does not
collect it.

## Data sent to a model provider

The extension sends data only after the user explicitly selects an image and asks
for a description. A request can contain:

- the selected image;
- additional context typed by the user;
- the prompt needed to request an image description; and
- an API key, when the configured authentication mode uses one.

The request is sent directly to the configured provider endpoint:

- With a local provider, data goes to the local or local-network endpoint configured
  by the user.
- With OpenAI, data goes to the user's own OpenAI API account and is handled under
  OpenAI's terms and privacy policy.
- With another compatible provider, data goes to the endpoint configured by the user
  and is handled under that provider's terms and privacy policy.

The developer does not receive these requests or their responses.

## Local storage and retention

Provider configuration, including an API key when supplied, is stored locally by
Firefox in `browser.storage.local`. It is not synchronized by this extension or sent
anywhere except to the configured provider as part of an authenticated request.

Selected images, additional context, and generated descriptions are held only for
the current sidebar session. They are not placed in persistent extension storage.
Reloading or closing the sidebar discards them.

Users can remove the saved provider configuration from the extension settings. Data
already sent to a provider is subject to that provider's retention controls and
privacy policy.

## Contact

Questions about this policy can be sent to
[kris-imagedescription@koehntopp.de](mailto:kris-imagedescription@koehntopp.de).
