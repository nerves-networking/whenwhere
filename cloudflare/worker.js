// SPDX-FileCopyrightText: 2026 Frank Hunleth
// SPDX-License-Identifier: Apache-2.0
//
// https://github.com/nerves-networking/whenwhere
// v0.3.0

function maybeAdd(value, contents, key) {
    if (value) {
        contents[key] = value;
    }
}

function encodeString(str) {
    const encoded = new TextEncoder().encode(str);
    const buf = new Uint8Array(5 + encoded.length);
    // BINARY_EXT = 109
    buf[0] = 109;
    buf[1] = (encoded.length >> 24) & 0xff;
    buf[2] = (encoded.length >> 16) & 0xff;
    buf[3] = (encoded.length >> 8) & 0xff;
    buf[4] = encoded.length & 0xff;
    buf.set(encoded, 5);
    return buf;
}

function encodeErlang(map) {
    const entries = Object.entries(map);
    const parts = [];
    for (const [key, value] of entries) {
        parts.push(encodeString(key));
        parts.push(encodeString(value));
    }

    let totalLength = 0;
    for (const part of parts) {
        totalLength += part.length;
    }

    // Erlang term version is 131. MAP_EXT is 116
    const result = new Uint8Array(6 + totalLength);
    result[0] = 131;
    result[1] = 116;
    result[2] = (entries.length >> 24) & 0xff;
    result[3] = (entries.length >> 16) & 0xff;
    result[4] = (entries.length >> 8) & 0xff;
    result[5] = entries.length & 0xff;

    let offset = 6;
    for (const part of parts) {
        result.set(part, offset);
        offset += part.length;
    }

    return result;
}

export default {
    async fetch(request) {
        if (request.method !== 'GET' && request.method !== 'HEAD') {
            return new Response('Method Not Allowed', {
                status: 405,
                headers: { 'content-type': 'text/plain' }
            });
        }

        const url = new URL(request.url);
        const now = (new Date()).toISOString();
        let nonce = url.searchParams.get('nonce');

        if (nonce !== null) {
            if (!/^[a-zA-Z0-9]{1,31}$/.test(nonce)) {
                return new Response('Invalid', {
                    status: 400,
                    headers: { 'content-type': 'text/plain' }
                });
            }
        }

        const cf = request.cf || {};
        const contents = { now: now };
        maybeAdd(cf.timezone, contents, 'time_zone');
        maybeAdd(cf.latitude, contents, 'latitude');
        maybeAdd(cf.longitude, contents, 'longitude');
        maybeAdd(cf.country, contents, 'country');
        maybeAdd(cf.region, contents, 'country_region');
        maybeAdd(cf.city, contents, 'city');

        const clientIP = request.headers.get('CF-Connecting-IP');
        if (clientIP) {
            contents['address'] = clientIP;
        }

        let body = null;
        let content_type = null;
        const requestContentType = request.headers.get('content-type');

        if (requestContentType === 'application/x-erlang-binary') {
            body = encodeErlang(contents);
            content_type = 'application/x-erlang-binary';
        } else {
            body = JSON.stringify(contents);
            content_type = 'application/json';
        }

        const respHeaders = {
            'content-type': content_type,
            'cache-control': 'no-cache, must-revalidate, max-age=0',
            'expires': '0',
            'x-now': now
        };
        if (nonce) {
            respHeaders['x-nonce'] = nonce;
        }

        if (request.method === 'HEAD') {
            return new Response(null, { status: 200, headers: respHeaders });
        }

        return new Response(body, { status: 200, headers: respHeaders });
    }
};
