# WhenWhere Server

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
* Optional device geo-location
* Optional public IP address and port used to make the request

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

HTTP GET methods return the following JSON-encoded map:

```json
{
  "now": "2024-05-29T00:43:08.383Z",
  "time_zone": "Australia/Brisbane",
  "latitude": "-27.46790",
  "longitude": "153.03250",
  "country": "AU",
  "city": "Brisbane",
  "address": "144.48.39.229:1403"
}
```

* `"now"` - ISO 8601 data/time string with millisecond precision in UTC
* `"time_zone"` - Optional geo-located time zone in IANA time zone database format
* `"latitude"` - Optional approximate latitude
* `"longitude"` - Optional approximate longitude
* `"country"` - Optional ISO 3166-1 alpha-2 country code
* `"country_region"` - Optional ISO 3166-1 alpha-2 country code
* `"city"` - Optional name of the nearest city
* `"address"` - Optional IP address and port that made the request

## Example usage

Curl can be used to show how this works

```shell
$ curl -i 'https://whenwhere.nerves-project.org/?nonce=0123456789abcdef'
HTTP/2 200
server: CloudFront
date: Wed, 29 May 2024 00:54:55 GMT
content-type: application/json
content-length: 182
cache-control: no-cache, must-revalidate, max-age=0
expires: 0
x-nonce: 0123456789abcdef
x-now: 2024-05-29T00:54:55.270Z
x-cache: FunctionGeneratedResponse from cloudfront
via: 1.1 0e61cdf08a154ac7d647c2dc742467a6.cloudfront.net (CloudFront)
x-amz-cf-pop: SYD62-P2
x-amz-cf-id: WjQvSIZ_Rr3mUnlGgWvTZJXXsKE1QinAEABsa0YOtTmgrpuPmU2LXA==

{"now":"2024-05-29T00:54:55.270Z","time_zone":"Australia/Brisbane","latitude":"-27.46790","longitude":"153.03250","country":"AU","city":"Brisbane","address":"144.48.39.229:38917"}
```

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
