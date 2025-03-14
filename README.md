# WhenWhere Server

[![REUSE status](https://api.reuse.software/badge/github.com/nerves-networking/whenwhere)](https://api.reuse.software/info/github.com/nerves-networking/whenwhere)

The repository provides an API and implementation for the Nerves Project's
Internet connectivity check server,
[whenwhere.nerves-project.org](https://whenwhere.nerves-project.org). The server
provides a highly available endpoint that is inexpensive to maintain. Of course,
this is an open source project and no uptime guarantees are being made. Luckily,
the source is available here so that you can set one up yourself.

Why does this project exist? We were defeated by captive portals tricking
devices that they had Internet when they didn't.

The reference implementation uses [AWS CloudFront
Functions](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html).
It's certainly possible to replicate the API elsewhere. Please send a PR or
repository pointer if you'd like to share another way.

Features include:

* Multiple ways to avoid being tricked by overly aggressive HTTP caches
* Millisecond timestamp for setting clocks
* JSON and [Erlang Term Format](https://www.erlang.org/doc/apps/erts/erl_ext_dist.html) responses
* Optional device geo-location
* Optional public IP address and port used to make the request

## Examples

If you're not using Elixir, run this:

```sh
$ curl https://whenwhere.nerves-project.org | jq .
{
  "now": "2024-06-20T02:19:59.878Z",
  "time_zone": "Australia/Brisbane",
  "latitude": "-27.46790",
  "longitude": "153.03250",
  "country": "AU",
  "country_region": "QLD",
  "city": "Brisbane",
  "address": "103.216.220.102:11591"
}
```

In Elixir, here's an example using [`Req`](https://hexdocs.pm/req/readme.html):

```elixir
Mix.install([
  {:req, "~> 0.5.0"}
])

Req.get!("http://whenwhere.nerves-project.org/").body
#=> %{
#     "now" => "2024-05-29T00:43:08.383Z",
#     "time_zone" => "Australia/Brisbane",
#     "latitude" => "-27.46790",
#     "longitude" => "153.03250",
#     "country" => "AU",
#     "city" => "Brisbane",
#     "address" => "144.48.39.229:1403"
#   }
```

Here's a minimal `:httpc` example that requests an Erlang binary term instead:

```elixir
Application.ensure_all_started(:inets)

{:ok, {_, _, body}} = :httpc.request(:get, {"http://whenwhere.nerves-project.org/", [{~c"content-type", "application/x-erlang-binary"}]}, [], [])
body |> IO.iodata_to_binary() |> :erlang.binary_to_term([:safe])
#=> %{
#     "now" => "2024-05-29T00:43:08.383Z",
#     "time_zone" => "Australia/Brisbane",
#     "latitude" => "-27.46790",
#     "longitude" => "153.03250",
#     "country" => "AU",
#     "city" => "Brisbane",
#     "address" => "144.48.39.229:1403"
#   }
```

## API

There's only one endpoint and the path to it isn't specified.

Only HTTP GET and HEAD methods are supported. Clients should make HEAD requests
when they don't need any information in the body of the response.

One query parameter is supported:

* `nonce` - an up to 32 alphanumeric string. Non-alphanumeric or longer strings
  result in an error response.

Both HTTP GET and HEAD methods return the following headers:

* `x-now` - ISO 8601 date/time string with millisecond precision in UTC (e.g., `2024-05-29T00:22:09.890Z`)
* `x-nonce` - The value of the `nonce` query parameter if specified

The `content-type` request header selects JSON-encoded (`applictaion/json`) or
Erlang Term Format-encoded (`application/x-erlang-binary`) results. JSON is the
default. The contents will be a map with the following fields. Note that many
are optional.

* `"now"` - ISO 8601 data/time string with millisecond precision in UTC
* `"time_zone"` - Optional geo-located time zone in IANA time zone database format
* `"latitude"` - Optional approximate latitude
* `"longitude"` - Optional approximate longitude
* `"country"` - Optional ISO 3166-1 alpha-2 country code
* `"country_region"` - Optional ISO 3166-1 alpha-2 country code
* `"city"` - Optional name of the nearest city
* `"address"` - Optional IP address and port that made the request

## CloudFront Function setup

Consult the AWS CloudFront Function setup and use the provided `index.js`.

For geo-location support, attach the `AllViewerAndCloudFrontHeaders-2022-06`
origin request policy.

## Tests

This project comes with simple tests to verify that the server is responding
correctly. Make sure Elixir is installed and then run:

```sh
./validate.exs
```

Modify the script if your installation differs.
