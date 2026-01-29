function handler(event) {
    var request = event.request;
    var uri = request.uri;

    // Check if URI has a file extension
    if (uri.includes('.')) {
        return request;
    }

    // If URI ends with /, append index.html
    if (uri.endsWith('/')) {
        request.uri += 'index.html';
    } else {
        // No extension and no trailing slash - add /index.html
        request.uri += '/index.html';
    }

    return request;
}
