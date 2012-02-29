require(['./js/remoteStorage'], function(remoteStorage) {

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

  function getData(category, key) {
    var storageInfo = JSON.parse(localStorage.getItem('currUserStorageInfo'));
    var client;

    if (category === 'public') {
      client = remoteStorage.createClient(storageInfo, 'public');
    } else {
      var token = localStorage.getItem('bearerToken');
      client = remoteStorage.createClient(storageInfo, category, token);
    }

    client.get(key, function(error, data) {
      if(error) {
        alert('Could not find "' + key + '" in category "' + category + '" on the remoteStorage');
      } else {
        if (data == "null") {
          alert('There wasn\'t anything for "' + key + '" in category "' + category + '"');
        } else {
          alert('We received this for key "' + key + '" in category "' + category + '": ' + data);
        }
      }
    });
  }

  function putData(category, key, value) {
    var storageInfo = JSON.parse(localStorage.getItem('currUserStorageInfo'));
    var token = localStorage.getItem('bearerToken');
    var client = remoteStorage.createClient(storageInfo, category, token);

    client.put(key, value, function(error) {
      if (error) {
        alert('Could not store "' + key + '" in "' + category + '" category');
      } else {
        alert('Stored "' + value + '" for key "' + key + '" in "' + category + '" category');
      }
    });
  }

  // Getting public data is easy because it requires no credentials. If we want
  // to write to a user's public data, or read or write from one of the other
  // categories, we need to do an OAuth request first to obtain a token. Our
  // library provides two functions to make this easier.

  // Open a popup that sends the user to the OAuth dialog of the remoteStorage
  // provider.
  function authorize(categories) {
    var storageInfo = JSON.parse(localStorage.getItem('currUserStorageInfo'));
    var redirectUri = location.protocol + '//' + location.host + '/receive_token.html';

    // We specify that we want to connect to the user's "public" and "documents" categories.
    var oauthPage = remoteStorage.createOAuthAddress(storageInfo, categories, redirectUri);

    // Then we open the popup window.
    var popup = window.open(oauthPage);
  }

  // Listen for the `message` event from the receive_token.html that sends the
  // OAuth token.
  window.addEventListener('message', function(event) {
    if(event.origin == location.protocol +'//'+ location.host) {
      console.log('Received an OAuth token: ' + event.data);
      localStorage.setItem('bearerToken', event.data);
    }
  }, false);

  // Bind the UI elements to the actions

  document.getElementById('userAddressForm').onsubmit = function() {
    var userAddress = document.getElementById('userAddress').value;
    connect(userAddress);
    return false;
  }

  document.getElementById('fetchPublicKey').onclick = function() {
    var key = document.getElementById('publicKey').value;
    getData('public', key);
    return false;
  }

  document.getElementById('authorize').onclick = function() {
    authorize(['public', 'documents']);
    return false;
  }

  document.getElementById('publish').onclick = function() {
    var key = document.getElementById('documentsKey').value;
    var value = document.getElementById('documentsValue').value;
    putData('documents', key, value);
    return false;
  }

  document.getElementById('fetchDocumentsKey').onclick = function() {
    var key = document.getElementById('documentsKey').value;
    getData('documents', key);
    return false;
  }
});
