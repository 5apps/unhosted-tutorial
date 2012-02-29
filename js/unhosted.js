require(['./js/remoteStorage.js'], function(remoteStorage) {

  function connect(userAddress) {
    // This function takes a user address ("user@host") and a callback as its
    // arguments. The callback will get an error code, and a `storageInfo`
    // object. If the error code is `null`, then the `storageInfo` object will
    // have some data fields in it that we will need later.
    remoteStorage.getStorageInfo(userAddress, function(error, storageInfo) {
      if(error) {
        alert('No, sorry!');
      } else {
        alert('Yes! Look: ' + JSON.stringify(storageInfo));
        localStorage.setItem('currUserStorageInfo', JSON.stringify(storageInfo));
      }
    });
  }

  // To get public information from someone's remoteStorage, we use the
  // `createClient` method to create a client, and on there call the `get`
  // method to retrieve the information we want.
  function getPublicData(key) {
    var storageInfo = JSON.parse(localStorage.getItem('currUserStorageInfo'));

    // The `createClient` method takes the `storageInfo` that we got via the
    // `connect` function, as well as the category we want to access.
    var client = remoteStorage.createClient(storageInfo, 'public');

    // To retrieve data from the remoteStorage we specify a key and a callback
    // to the `get` function.  When the `error` argument given to the callback
    // is `null`, then `data` will contain the value of the requested key.
    client.get(key, function(error, data) {
      if(error) {
        alert('Could not find "' + key + '" on the remoteStorage');
      } else {
        if (data == "null") {
          alert('There wasn\'t anything for "' + key + '" on the remoteStorage');
        } else {
          alert('We received this from the remoteStorage: ' + data);
        }
      }
    });
  }

  // Getting public data is easy because it requires no credentials. If we want
  // to write to a user's public data, or read or write from one of the other
  // categories, we need to do an OAuth request first to obtain a token. Our
  // library provides two functions to make this easier.

  // Open a popup that sends the user to the OAuth dialog of the remoteStorage
  // provider.
  function authorize() {
    var storageInfo = JSON.parse(localStorage.getItem('currUserStorageInfo'));

    var redirectUri = location.protocol + '//' + location.host + '/receive_token.html';

    // We specify that we want to connect to the user's "public" and "documents" categories.
    var oauthPage = remoteStorage.createOAuthAddress(storageInfo, ['public', 'documents'], redirectUri);

    // Then we open the popup window.
    var popup = window.open(oauthPage);
  }

  function publishDocumentsData(key, value) {
    var storageInfo = JSON.parse(localStorage.getItem('currUserStorageInfo'));
    var token = localStorage.getItem('bearerToken');
    var documentsClient = remoteStorage.createClient(storageInfo, 'documents', token);

    documentsClient.put(key, value, function(error) {
      alert('Stored "' + value + '" for key "' + key + '" in "documents" category');
    });
  }

  // Listen for the `message` event from the receive_token.html that sends the
  // OAuth token.
  window.addEventListener('message', function(event) {
    if(event.origin == location.protocol +'//'+ location.host) {
      localStorage.setItem('bearerToken', event.data);
    }
  }, false);

  // Bind the UI elements to the actions

  document.getElementById('userAddressForm').onsubmit = function() {
    var userAddress = document.getElementById('userAddress').value;
    connect(userAddress);
    return false;
  }

  document.getElementById('fetch').onclick = function() {
    var key = document.getElementById('publicKey').value;
    getPublicData(key);
    return false;
  }

  document.getElementById('authorize').onclick = function() {
    authorize();
    return false;
  }

  document.getElementById('publish').onclick = function() {
    var key = document.getElementById('documentsKey').value;
    var value = document.getElementById('documentsValue').value;
    publishDocumentsData(key, value);
    return false;
  }

});
