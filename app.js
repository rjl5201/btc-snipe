var siteApp = angular.module('siteApp', [ 'ngMaterial', 'ngRoute', 'firebase' ]);

siteApp.config(function($routeProvider) {

	$routeProvider
        .when('/btc', {
            templateUrl : 'btc.html',
            controller : 'coinController',
        })
})

siteApp.controller('coinController',['$http', '$scope', '$interval', function($http, $scope, $interval) {
    getBTCPrice()
    $interval(getBTCPrice, 11000);

    $scope.newOrder = {
        "request": "/v1/order/new",
        "nonce": "",
        "symbol": "btcusd",
        "amount": "",
        "price": "",
        "side": "buy",
        "type": "exchange limit",
        "options": ["maker-or-cancel"]
    };

    $scope.apiPost = {
        //'nlQMYpEbuxuJrL4QSZ2I'
        "key": 'nlQMYpEbuxuJrL4QSZ2I',
        //'3fjq6H4id5KPqns3PJ4ys8jQtpy9'
        "secret": '3fjq6H4id5KPqns3PJ4ys8jQtpy9',
    };

    $scope.$watchGroup(['funds', 'btcPrice'], function (fundAmt) {
        var parsedAmt = parseFloat(fundAmt)
        $scope.newOrder.price = $scope.btcPrice.bid

        $scope.beforeAmt = parsedAmt/parseFloat($scope.btcPrice.bid)
        $scope.fee = ($scope.beforeAmt * parseFloat($scope.btcPrice.bid)) * .0025
        $scope.adjustedFunds = parsedAmt-$scope.fee
        $scope.youGet = $scope.adjustedFunds/parseFloat($scope.btcPrice.bid)
        $scope.newOrder.amount = parseFloat($scope.youGet.toPrecision(8))
    });

    function getBTCPrice() {
        $scope.btcPrice={}

        $http({
            method: 'GET',
            url: 'https://api.gemini.com/v1/pubticker/ethusd',
            headers: {'Access-Control-Allow-Origin': '*'
            }
        }).then(function successCallback(response) {
            $scope.btcPrice = response.data;
            console.log("Got BTC bid price " + $scope.btcPrice.bid)
        }, function errorCallback(response) {
            console.log("Error")
        });
    }

    $scope.submitOrder = function() {
        var d = new Date();
        $scope.newOrder.nonce = Math.round(d.getTime()/1000);

        var textJson = JSON.stringify($scope.newOrder)

        // var textJson = '{"request": "/v1/order/new","nonce": 123454546,"client_order_id": "20150102-4738721","symbol": "btcusd","amount": "34.12","price": "622.13","side": "buy","type": "exchange limit","options": ["maker-or-cancel"]}';

        //========= encryption shit ===========
        var gemPayload = btoa(textJson);

        var shaObj = new jsSHA("SHA-384", "TEXT");
        shaObj.setHMACKey($scope.apiPost.secret, "TEXT");
        shaObj.update(gemPayload);

        var hmac = shaObj.getHMAC("HEX");
        //=====================================

        $http({
            method: 'POST',
            url: 'https://api.sandbox.gemini.com/v1/order/new',
            headers: {
                'X-GEMINI-PAYLOAD': gemPayload,
                'X-GEMINI-APIKEY': $scope.apiPost.key,
                'X-GEMINI-SIGNATURE': hmac
            },
        }).then(function successCallback(response) {
            console.log("SUCCESS!")
            console.log(response)
        }, function errorCallback(response) {
            //console.log("Something terrible has happened")
            console.log(response.data.message)
        });
    }
}]);
