// SPDX-FileCopyrightText: 2024 SmartRent
//
// SPDX-License-Identifier: Apache-2.0
//
// https://github.com/nerves-networking/whenwhere
// v0.2.0
function maybeAdd(field, contents, key) {
    if (field) {
        contents[key] = decodeURIComponent(field.value);
    }
}

function encodeString(str) {
  const length = Buffer.byteLength(str);
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(length, 0);
  // BINARY_EXT = 109
  return Buffer.concat([Buffer.from([109]), lengthBuffer, Buffer.from(str)]);
}

function encodeErlang(map) {
    const entries = Object.entries(map);
    const length = entries.length;
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(length, 0);

    let encodedEntries = Buffer.alloc(0);
    for (var i = 0; i < entries.length; i++) {
      let key = entries[i][0];
      let value = entries[i][1];
      const encodedKey = encodeString(key);
      const encodedValue = encodeString(value);
      encodedEntries = Buffer.concat([encodedEntries, encodedKey, encodedValue]);
    }

    // Erlang term version is 131. MAP_EXT is 116
    return Buffer.concat([Buffer.from([131, 116]), lengthBuffer, encodedEntries]);
}

function handler(event) {
    var request = event.request;
    var headers = request.headers;
    var querystring = request.querystring;
    var now = (new Date()).toISOString();
    var nonce = null;
    var body = null;

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

    let content_type = null;
    if (headers['content-type'] && headers['content-type'].value === 'application/x-erlang-binary') {
        body = {
            data: encodeErlang(contents).toString('base64'),
            encoding: 'base64'
        };
        content_type = 'application/x-erlang-binary';
    } else {
        body = JSON.stringify(contents);
        content_type = 'application/json';
    }

    var resp_headers = {
            'content-type': { value: content_type },
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
        body: body
    };
}
