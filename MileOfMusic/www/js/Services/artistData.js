mileOfMusicApp.factory('artistData', function ($http, $log, $q, appHelper, commonData) {

    //var versionUrl = "http://localhost:64618/Data/GetJson?callback=JSON_CALLBACK&filename=Artists.txt.version";
    //var dataUrl = "http://localhost:64618/Data/GetJson?callback=JSON_CALLBACK&filename=Artists.txt";
    var versionUrl = "http://mileofmusicmobile.azurewebsites.net/Data/GetJson?callback=JSON_CALLBACK&filename=Artists.txt.version";
    var dataUrl = "http://mileofmusicmobile.azurewebsites.net/Data/GetJson?callback=JSON_CALLBACK&filename=Artists.txt";

    var storageKey_getArtists = "artistData-getArtists";

    var cache_artistList = null;
    var cache_getArtist = null;

    var getArtists = function () {
        var deferred = $q.defer();

        var checkForMissingImages = function (result) { console.log(result); return commonData.checkForMissingImages(result.artists, "artistId", "artistimages"); }

        // if the list is not in cache, then build it
        commonData.getRemoteData(storageKey_getArtists, versionUrl, dataUrl, "initialArtistJson", function () { cache_getArtist = null; }, checkForMissingImages, function () { return cache_artistList; }).then(function (result) {
            cache_artistList = result;
            deferred.resolve(cache_artistList);
        }, function () { deferred.reject(); });

        return deferred.promise;
    };

    var getArtist = function (artistId) {
        var deferred = $q.defer();

        if (cache_getArtist == null) {
            getArtists().then(function (result) {
                cache_getArtist = appHelper.buildIndex(result.data.artists, "artistId");
                deferred.resolve(cache_getArtist[artistId]);
            }, function () { deferred.reject(); });
        }
        else {
            deferred.resolve(cache_getArtist[artistId]);
        }
        return deferred.promise;
    };

    var getMusic = function (artistId) {
        var deferred = $q.defer();

        if (navigator != null && navigator.network != null && navigator.network.connection != null && navigator.network.connection.type == Connection.NONE) {
            deferred.resolve([]);
        }
        else {
            getArtist(artistId).then(function (result) {
                var name = result.artistName.replace(/ /g, '+');

                $http.jsonp("https://itunes.apple.com/search?callback=JSON_CALLBACK&media=music&attribute=artistTerm&limit=10&term=" + name).then(function (result) {
                    var output = [];
                    console.log(result);
                    if (result.data.resultCount > 0) {
                        $.each(result.data.results, function (i, item) {
                            if (item.kind == "song") {
                                output.push({
                                    name: item.trackCensoredName,
                                    album: item.collectionCensoredName,
                                    musicUrl: item.previewUrl,
                                    imageUrl: item.artworkUrl60
                                });
                            }

                            if (output.length >= 10) {
                                return false;
                            }
                        });
                    }
                    deferred.resolve(output);
                }, function () {
                    deferred.reject();
                });

            }, function () { deferred.reject(); })
        }

        return deferred.promise;
    }

    return {
        getArtists: getArtists,
        getArtist: getArtist,
        getMusic: getMusic
    };
});