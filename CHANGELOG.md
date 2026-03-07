<!--
  SPDX-FileCopyrightText: None
  SPDX-License-Identifier: CC0-1.0
-->
# Changelog

## v0.3.0

This release adds a Cloudflare Workers implementation. It works almost
identically with the main exception being that the TCP port number of the
request isn't returned in the address field.

* Changes
  * Clarified nonce field max length to be 31 characters rather than 32 since
    that's what's deployed
  * Added REUSE compliance

## v0.2.0

* Changes
  * Support returning Erlang binary terms to avoid requiring a JSON library in
    Elixir and Erlang programs.

## v0.1.0

Initial release
