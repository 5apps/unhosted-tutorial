require(['./js/unhosted', './js/helper'], function(unhosted, helper) {

  $(function() {

    $('#connect').on('click', function() {
      var userAddress = $('#userAddress').val();

      helper.showSpinner('connectionSpinner');

      unhosted.connect(userAddress, function(error, storageInfo) {
        if(error) {
          alert('Could not load storage info');
          console.log(error);
          helper.setConnectionState(false);
        } else {
          console.log('Storage info received:');
          console.log(storageInfo);
          localStorage.setItem('userStorageInfo', JSON.stringify(storageInfo));
          localStorage.setItem('userAddress', userAddress);
          helper.setConnectionState(true);
        }

        helper.hideSpinner('connectionSpinner');
      });

      return false;
    });

    $('#fetchPublicKey').on('click', function() {
      var key = $('#publicKey').val();

      helper.showSpinner('fetchPublicSpinner');

      unhosted.getData('public', key, function(error, data) {
        if(error) {
          alert('Could not find "' + key + '" in category "public" on the remoteStorage');
          console.log(error);
        } else {
          if (data == "null") {
            console.log('There wasn\'t anything for "' + key + '" in category "public"');
          } else {
            console.log('We received this for key "' + key + '" in category "public": ' + data);
            $('#publicValue').val(data);
          }
        }

        helper.hideSpinner('fetchPublicSpinner');
      });

      return false;
    });

    $('#publishPublic').on('click', function() {
      var key = $('#publicKey').val();
      var value = $('#publicValue').val();

      helper.showSpinner('publishPublicSpinner');

      unhosted.putData('public', key, value, function(error) {
        if (error) {
          alert('Could not store "' + key + '" in "public" category');
        } else {
          console.log('Stored "' + value + '" for key "' + key + '" in "public" category');
          $('#publicValue').val('');
        }

        helper.hideSpinner('publishPublicSpinner');
      });

      return false;
    });

    $('#authorize').on('click', function() {
      unhosted.authorize(['public', 'tutorial']);
      return false;
    });

    $('#publishTutorial').on('click', function() {
      var key = $('#tutorialKey').val();
      var value = $('#tutorialValue').val();

      helper.showSpinner('publishTutorialSpinner');

      unhosted.putData('tutorial', key, value, function(error) {
        if (error) {
          alert('Could not store "' + key + '" in "tutorial" category');
        } else {
          console.log('Stored "' + value + '" for key "' + key + '" in "tutorial" category');
          $('#tutorialValue').val('');
        }

        helper.hideSpinner('publishTutorialSpinner');
      });

      return false;
    });

    $('#fetchTutorialKey').on('click', function() {
      var key = $('#tutorialKey').val();

      helper.showSpinner('fetchTutorialSpinner');

      unhosted.getData('tutorial', key, function(error, data) {
        if(error) {
          alert('Could not find "' + key + '" in category "tutorial" on the remoteStorage');
          console.log(error);
        } else {
          if (data == "null") {
            console.log('There wasn\'t anything for "' + key + '" in category "tutorial"');
          } else {
            console.log('We received this for key "' + key + '" in category "tutorial": ' + data);
            $('#tutorialValue').val(data);
          }
        }

        helper.hideSpinner('fetchTutorialSpinner');
      });

      return false;
    });

    $('#disconnect').on('click', function() {
      helper.disconnect();
      return false;
    });

    $('#deauthorize').on('click', function() {
      helper.deauthorize();
      return false;
    });

    helper.setConnectionState(helper.isConnected());
    helper.setAuthorizedState(helper.isAuthorized());
  });

});
