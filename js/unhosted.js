require(['./js/remoteStorage'], function(remoteStorage) {
  var connected = false;
  var authorized = false;

  function connect(userAddress, callback) {
    // `getStorageInfo` takes a user address ("user@host") and a callback as
    // its arguments. The callback will get an error code, and a `storageInfo`
    // object. If the error code is `null`, then the `storageInfo` object will
    // have some data fields in it that we will need later.
    remoteStorage.getStorageInfo(userAddress, callback);
  }

  function getData(category, key, callback) {
    var storageInfo = JSON.parse(localStorage.getItem('userStorageInfo'));
    var client;

    if (category === 'public') {
      client = remoteStorage.createClient(storageInfo, 'public');
    } else {
      var token = localStorage.getItem('bearerToken');
      client = remoteStorage.createClient(storageInfo, category, token);
    }

    client.get(key, callback);
  }

  function putData(category, key, value, callback) {
    var storageInfo = JSON.parse(localStorage.getItem('userStorageInfo'));
    var token = localStorage.getItem('bearerToken');
    var client = remoteStorage.createClient(storageInfo, category, token);

    client.put(key, value, callback);
  }

  // Getting public data is easy because it requires no credentials. If we want
  // to write to a user's public data, or read or write from one of the other
  // categories, we need to do an OAuth request first to obtain a token. Our
  // library provides two functions to make this easier.

  // Open a popup that sends the user to the OAuth dialog of the remoteStorage
  // provider.
  function authorize(categories) {
    var storageInfo = JSON.parse(localStorage.getItem('userStorageInfo'));
    var redirectUri = location.protocol + '//' + location.host + '/receive_token.html';
    var oauthPage = remoteStorage.createOAuthAddress(storageInfo, categories, redirectUri);
    var popup = window.open(oauthPage);
  }

  // Listen for the `message` event from the receive_token.html that sends the
  // OAuth token.
  window.addEventListener('message', function(event) {
    if(event.origin == location.protocol +'//'+ location.host) {
      console.log('Received an OAuth token: ' + event.data);
      localStorage.setItem('bearerToken', event.data);
      setAuthorizedState(true);
    }
  }, false);


  // Helper functions

  function showSpinner(id) {
    $('#' + id).show();
  }

  function hideSpinner(id) {
    $('#' + id).hide();
  }

  function setConnectionState(state) {
    connected = state;

    elementIds = [
      'publicKey', 'fetchPublicKey', 'authorize', 'disconnect'
    ];

    if (connected) {
      for (var i = 0; i < elementIds.length; i++) {
        $('#' + elementIds[i]).removeAttr('disabled');
      }
      $('#connectionState').html('connected');
      $('#connect').hide();
      $('#disconnect').show();
    } else {
      for (var i = 0; i < elementIds.length; i++) {
        $('#' + elementIds[i]).attr('disabled', 'disabled');
      }
      $('#connectionState').html('disconnected');
      $('#connect').show();
      $('#disconnect').hide();
      deauthorize();
    }
    $('#connectionState').toggleClass('enabled', connected);

    $('#states').show();
  }

  function disconnect() {
    localStorage.removeItem('userStorageInfo');
    localStorage.removeItem('userAddress', userAddress);
    setConnectionState(false);
  }

  function isConnected() {
    return localStorage.getItem('userStorageInfo') != null;
  }

  function setAuthorizedState(state) {
    authorized = state;

    elementIds = [
      'tutorialKey', 'fetchTutorialKey', 'tutorialValue',
      'publishTutorial', 'publicValue', 'publishPublic', 'deauthorize'
    ];

    if (authorized) {
      for (var i = 0; i < elementIds.length; i++) {
        $('#' + elementIds[i]).removeAttr('disabled');
      }
      $('#publicTitle').html('Read/write access for "public" category');
      $('#authorizedState').html('authorized');
      $('#authorize').hide();
      $('#deauthorize').show();
    } else {
      for (var i = 0; i < elementIds.length; i++) {
        $('#' + elementIds[i]).attr('disabled', 'disabled');
      }
      $('#publicTitle').html('Read access for "public" category');
      $('#authorizedState').html('not authorized');
      $('#authorize').show();
      $('#deauthorize').hide();
    }
    $('#authorizedState').toggleClass('enabled', authorized);
  }

  function deauthorize() {
    localStorage.removeItem('bearerToken');
    setAuthorizedState(false);
  }

  function isAuthorized() {
    return localStorage.getItem('bearerToken') != null;
  }

  // Bind the UI elements to the actions
  $(function() {

    $('#connect').on('click', function() {
      var userAddress = $('#userAddress').val();

      showSpinner('connectionSpinner');

      connect(userAddress, function(error, storageInfo) {
        if(error) {
          console.log('Could not load storage info');
          console.log(error);
          setConnectionState(false);
        } else {
          console.log('Storage info received:');
          console.log(storageInfo);
          localStorage.setItem('userStorageInfo', JSON.stringify(storageInfo));
          localStorage.setItem('userAddress', userAddress);
          setConnectionState(true);
        }

        hideSpinner('connectionSpinner');
      });

      return false;
    });

    $('#fetchPublicKey').on('click', function() {
      var key = $('publicKey').val();

      showSpinner('fetchPublicSpinner');

      getData('public', key, function(error, data) {
        if(error) {
          console.log('Could not find "' + key + '" in category "public" on the remoteStorage');
          console.log(error);
        } else {
          if (data == "null") {
            console.log('There wasn\'t anything for "' + key + '" in category "public"');
          } else {
            console.log('We received this for key "' + key + '" in category "public": ' + data);
          }
        }

        hideSpinner('fetchPublicSpinner');
      });

      return false;
    });

    $('#publishPublic').on('click', function() {
      var key = $('#publicKey').val();
      var value = $('#publicValue').val();

      showSpinner('publishPublicSpinner');

      putData('public', key, value, function(error) {
        if (error) {
          console.log('Could not store "' + key + '" in "public" category');
        } else {
          console.log('Stored "' + value + '" for key "' + key + '" in "public" category');
        }

        hideSpinner('publishPublicSpinner');
      });

      return false;
    });

    $('#authorize').on('click', function() {
      authorize(['public', 'tutorial']);
      return false;
    });

    $('#publishTutorial').on('click', function() {
      var key = $('tutorialKey').val();
      var value = $('tutorialValue').val();

      showSpinner('publishTutorialSpinner');

      putData('tutorial', key, value, function(error) {
        if (error) {
          console.log('Could not store "' + key + '" in "tutorial" category');
        } else {
          console.log('Stored "' + value + '" for key "' + key + '" in "tutorial" category');
        }

        hideSpinner('publishTutorialSpinner');
      });

      return false;
    });

    $('#fetchTutorialKey').on('click', function() {
      var key = $('tutorialKey').val();

      showSpinner('fetchTutorialSpinner');

      getData('tutorial', key, function(error, data) {
        if(error) {
          console.log('Could not find "' + key + '" in category "tutorial" on the remoteStorage');
          console.log(error);
        } else {
          if (data == "null") {
            console.log('There wasn\'t anything for "' + key + '" in category "tutorial"');
          } else {
            console.log('We received this for key "' + key + '" in category "tutorial": ' + data);
          }
        }

        hideSpinner('fetchTutorialSpinner');
      });

      return false;
    });

    $('#disconnect').on('click', function() {
      disconnect();
      return false;
    });

    $('#deauthorize').on('click', function() {
      deauthorize();
      return false;
    });

    // Initializers

    setConnectionState(isConnected());
    setAuthorizedState(isAuthorized());
  });
});
