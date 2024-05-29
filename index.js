// SPDX-FileCopyrightText: 2024 SmartRent
//
// SPDX-License-Identifier: Apache-2.0
function handler(event) {
    const headers = event.request.headers;
    const querystring = event.request.querystring;
    const now = (new Date()).toISOString();
    let nonce = "";

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

    return {
        statusCode: 200,
        statusDescription: 'OK',
        headers: {
            'content-type': { value: 'application/json' },
            'cache-control': { value: 'no-cache, must-revalidate, max-age=0' },
            'expires': { value: '0' },
            'x-now': { value: now },
            'x-nonce' : { value: nonce },
        },
        body: JSON.stringify({
            now: now,
            time_zone: headers['cloudfront-viewer-time-zone'].value,
            latitude: headers['cloudfront-viewer-latitude'].value,
            longitude: headers['cloudfront-viewer-longitude'].value,
            country: headers['cloudfront-viewer-country'].value,
            city: headers['cloudfront-viewer-city'].value,
            address: headers['cloudfront-viewer-address'].value,
        })
    };
}
