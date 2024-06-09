// SPDX-FileCopyrightText: 2024 SmartRent
//
// SPDX-License-Identifier: Apache-2.0
//
// https://github.com/nerves-networking/whenwhere
// v0.1.0
function maybeAdd(field, contents, key) {
    if (field) {
        contents[key] = field.value;
    }
}

function handler(event) {
    var request = event.request;
    var headers = request.headers;
    var querystring = request.querystring;
    var now = (new Date()).toISOString();
    var nonce = null;

    if (querystring && querystring.nonce) {
        nonce = querystring.nonce.value;

        if (!/^[a-zA-Z0-9]{1,31}$/.test(nonce)) {
            return {
                statusCode: 400,
                statusDescription: 'Bad Request',
                headers: {
                    'content-type': { value: 'text/plain' },
                },
                body: 'Invalid'
            }
        }
    }

    var contents = {now: now};
    maybeAdd(headers['cloudfront-viewer-time-zone'], contents, 'time_zone')
    maybeAdd(headers['cloudfront-viewer-latitude'], contents, 'latitude')
    maybeAdd(headers['cloudfront-viewer-longitude'], contents, 'longitude')
    maybeAdd(headers['cloudfront-viewer-country'], contents, 'country')
    maybeAdd(headers['cloudfront-viewer-country-region'], contents, 'country_region')
    maybeAdd(headers['cloudfront-viewer-city'], contents, 'city')
    maybeAdd(headers['cloudfront-viewer-address'], contents, 'address')

    var resp_headers = {
            'content-type': { value: 'application/json' },
            'cache-control': { value: 'no-cache, must-revalidate, max-age=0' },
            'expires': { value: '0' },
            'x-now': { value: now }
        }
    if (nonce) {
        resp_headers['x-nonce'] = { value: nonce }
    }

    return {
        statusCode: 200,
        statusDescription: 'OK',
        headers: resp_headers,
        body: JSON.stringify(contents)
    };
}
