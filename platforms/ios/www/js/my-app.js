// Initialize your app
var myApp = new Framework7({
    swipeBackPageActiveArea: 150,
    // improve performance
    sortable: false,
    swipeout: false,
    swipeBackPage: true
});

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    // Because we use fixed-through navbar we can enable dynamic navbar
    dynamicNavbar: true
});

//------------------------------------------------------------------------------------
// variables | define ----------------------------------------------------------------
//------------------------------------------------------------------------------------

// declare all global variables needed
var restaurantListData;
var restaurantDetailData;
var subcategoryListData;
// app version
var versionLocal = '0.1.6', versionServer;

var map;
var mapDetail;
var homeData;

// define map markers
var markerIcon = L.icon({
    iconUrl: 'js/images/marker-icon-2x.png',
    shadowUrl: 'js/images/marker-shadow.png',

    iconSize:     [25, 41], // size of the icon
    shadowSize:   [51, 51], // size of the shadow
    iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location
    shadowAnchor: [16, 51],  // the same for the shadow
    popupAnchor:  [0, -34] // point from which the popup should open relative to the iconAnchor
});

var markerIconMy = L.icon({
    iconUrl: 'js/images/markerMy-icon-2x.png',
    shadowUrl: 'js/images/markerMy-shadow.png',

    iconSize:     [25, 41], // size of the icon
    shadowSize:   [51, 51], // size of the shadow
    iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location
    shadowAnchor: [16, 51],  // the same for the shadow
    popupAnchor:  [0, -34] // point from which the popup should open relative to the iconAnchor
});

// change status bar text color to black
document.addEventListener("deviceready", function(){
    StatusBar.styleDefault();
}, false);

// make sure li item scrolling active not firing
// TODO

//------------------------------------------------------------------------------------
// initialize the app ----------------------------------------------------------------
//------------------------------------------------------------------------------------

// template variables
var homeTemplate;
var compiledHomeTemplate;
var searchTemplate;
var compiledSearchTemplate;
var restaurantListTemplate;
var compiledRestaurantListTemplate;
var restaurantDetailTemplate;
var compiledRestaurantDetailTemplate;
var mapTemplate;
var compiledMapTemplate;
var nearbyTemplate;
var compiledNearbyTemplate;
var mapPopupTemplate;
var compiledMapPopupTemplate;
var profileTemplate;
var compiledProfileTemplate;

$(document).ready(function() {
    // check new version of the App
    checkNewVersion();
    // get hot restaurant and badge
    getHomeDataAndRedirectToHome();

    // compile complates
    // compile home template
    homeTemplate = $('script#home-template').html();
    compiledHomeTemplate = Template7.compile(homeTemplate);

    // compile search template
    searchTemplate = $('script#search-template').html();
    compiledSearchTemplate = Template7.compile(searchTemplate);

    // compile restaurant-list template
    restaurantListTemplate = $('script#restaurant-list-template').html();
    compiledRestaurantListTemplate = Template7.compile(restaurantListTemplate);

    // compile restaurant-detail template
    restaurantDetailTemplate = $('script#restaurant-detail-template').html();
    compiledRestaurantDetailTemplate = Template7.compile(restaurantDetailTemplate);

    // compile map template
    mapTemplate = $('script#map-template').html();
    compiledMapTemplate = Template7.compile(mapTemplate);

    // compile nearby template
    nearbyTemplate = $('script#nearby-template').html();
    compiledNearbyTemplate = Template7.compile(nearbyTemplate);

    // compile nearby template
    mapPopupTemplate = $('script#map-popup-template').html();
    compiledMapPopupTemplate = Template7.compile(mapPopupTemplate);

    // compile nearby template
    profileTemplate = $('script#profile-template').html();
    compiledProfileTemplate = Template7.compile(profileTemplate);
});

// get home data and redirect to home
function getHomeDataAndRedirectToHome(){
    $.ajax({
        url: 'http://xun-wei.com/api/get_hot_restaurant/',
        dataType: 'json',
        timeout: 5000,
        success: function(data, status) {
            // store hot restaurant data to local
            homeData = data;
            // load index
            mainView.loadPage({
                url:'home.html', 
                animatePages: false
            });
        },
        error: function() {
            loadErrorInfomation();
        }
    });
}

//------------------------------------------------------------------------------------
// home page controller--------------------------------------------------------------
//------------------------------------------------------------------------------------
myApp.onPageInit('home', function(page) {
    activeCurrentPage('home');
});

myApp.onPageAfterAnimation('home', function(page) {
    var init = loadHomePage();

    var ptrContent = $('.pull-to-refresh-content');

    ptrContent.on('refresh', function(e) {
        // Emulate 2s loading
        setTimeout(function() {
            loadHomePage();

            // When loading done, we need to reset it
            myApp.pullToRefreshDone();
        }, 2000);
    });

    function loadHomePage(){
        var context = {
            badge: homeData[0].badge,
            hot_restaurant: homeData[0].hot_restaurant
        }
        var html = compiledHomeTemplate(context);

        loadHTML('home',html);

        // init slider
        var mySliderIndex = myApp.slider('.slider-index', {
            pagination: '.slider-index .slider-pagination',
            spaceBetween: 50
        });
    }
});


//------------------------------------------------------------------------------------
// search restaurant page controller----------------------------------------------------
//------------------------------------------------------------------------------------
myApp.onPageAfterAnimation('search', function(page) {
    // toolbar active
    activeCurrentPage('search');

    // load html
    $.ajax({
        url: 'http://xun-wei.com/api/get_hot_search/',
        dataType: 'json',
        timeout: 5000,
        success: function(data, status) {
            // hide the indicator after success
            if (data.length != 0) {
                var context = {
                    subcategory: data[0].subcategory
                }
                var html = compiledSearchTemplate(context);

                loadHTML('search',html);
            } else {}
        },
        error: function() {

        }
    });

    // behavior
    $('.search-submit').live('click', function(e) {
        // get data from search input
        var formData = myApp.formToJSON('#search-form');
        $('.search-input').blur();

        // redirect to list page
        mainView.loadPage({
            url: 'restaurant-list.html?q=' + formData.q
        });
        e.preventDefault();
    });
});

//------------------------------------------------------------------------------------
// restaurant-list page controller----------------------------------------------------
//------------------------------------------------------------------------------------
myApp.onPageAfterAnimation('restaurant-list', function(page) {
    var init = loadRestaurantList();

    var ptrContent = $('.pull-to-refresh-content');

    // Add 'refresh' listener on it
    ptrContent.on('refresh', function(e) {
        // Emulate 2s loading
        setTimeout(function() {
            loadRestaurantList();
            // When loading done, we need to reset it
            myApp.pullToRefreshDone();
        }, 2000);
    });

    function loadRestaurantList() {
        var q = page.query.q;
        var lat = page.query.lat;
        var lng = page.query.lng;

        var data = {
            'q': q,
        }
        if (typeof lat !== 'undefined') {
            data = {
                'q': q,
                'lat': lat,
                'lng': lng
            }
        }

        if (!q) {

        } else {
            $.ajax({
                url: 'http://xun-wei.com/api/get_restaurants/',
                data: data,
                dataType: 'json',
                timeout: 5000,
                success: function(data, status) {
                    if (data.length != 0) {
                        // store data for later use (map)
                        restaurantListData = data;

                        var context = {
                            restaurant: restaurantListData
                        }
                        var html = compiledRestaurantListTemplate(context);
                        loadHTML('restaurant-list', html);
                    } else {
                        loadNotFoundInfomation();
                    }
                },
                error: function() {
                    loadErrorInfomation();
                }
            });
        }
    }
});



//------------------------------------------------------------------------------------
// restaurant detail page controller--------------------------------------------------
//------------------------------------------------------------------------------------
myApp.onPageAfterAnimation('restaurant-detail', function(page) {
    var id = page.query.id;
    if (!id) { 
        
    } else { // search new id
        $.ajax({
            url: 'http://xun-wei.com/api/get_single_restaurant/',
            data: {
                'id': id
            },
            dataType: 'json',
            timeout: 5000,
            success: function(data, status) {
                if (data.length != 0) {
                    restaurantDetailData = data;

                    var context = {
                        subcategory: restaurantDetailData[0].subcategory,
                        restaurant: restaurantDetailData[0],
                        review: restaurantDetailData[0].review
                    }
                    var html = compiledRestaurantDetailTemplate(context);
                    loadHTML('restaurant-detail', html);
                } else {
                    loadNotFoundInfomation();
                }
            },
            error: function() {
                loadErrorInfomation();
            }
        });
    }
});

//--------------------------------------------------------------------------------------
// map controller ----------------------------------------------------------------------
//--------------------------------------------------------------------------------------
myApp.onPageAfterAnimation('map', function(page) {
    // determine if view single restaurant or list
    var t = page.query.t;
    var context, data, html, lat, lng;

    if (t === 'list') {
        context = {
            restaurant: restaurantListData,
        }

        data = context.restaurant;

        html = compiledMapTemplate(context);
        loadHTML('map', html);

        // set init lat lng
        lat = data[0].latitude;
        lng = data[0].longitude;

        $('#map').height($(window).height() - 88);
        // draw a map

        if (map != undefined) {
            try {
                map.remove();
            } catch (err) {
                console.log('maybe you use safari');
            }
        }
        
        map = L.map('map', {
            zoomControl: false
        }).setView([lat, lng], 14);
        L.tileLayer('http://{s}.tiles.mapbox.com/v3/fuermosi777.i88jhog0/{z}/{x}/{y}.png', {
            attribution: '寻味',
            maxZoom: 20,
            detectRetina: true,
            retinaVersion: 'fuermosi777.i88jhog0'
        }).addTo(map);

        loadMarkersAndSliders(data);

        loadMe(map);

    } else {
        // do nothing
    }
});


function loadMarkersAndSliders(data){
    // mark markers
    var markers = [];
    for (var i = 0; i < data.length; i++) {
        var marker = L.marker([data[i].latitude, data[i].longitude], {
            icon: markerIcon,
            zIndexOffset: i
        }).addTo(map);

        markers[i] = marker;
    }

    // init slider
    var sliderMap = myApp.slider('.slider-map', {
         pagination: '.slider-map .slider-pagination',
         spaceBetween: 40,
         onSlideChangeEnd: function(slider){
            // when slide to a slide, pan to it in the map
            var indexId = slider.activeSlideIndex;
            map.panTo(markers[indexId]._latlng);
         }
    });

    // make marker clickable and find the slide
    for (var i = 0; i < data.length; i++){
        markers[i].on('click', function(evt) {
            // slide to this restaurant
            sliderMap.slideTo(evt.target.options.zIndexOffset);
            // make marker center
            map.setView([evt.latlng.lat,evt.latlng.lng]);
        });
    }
}

function loadMe(map){
    document.addEventListener("deviceready", onDeviceReady, false);
    var watchID = null;
    var m;

    // watch my location
    function onDeviceReady() {
        var options = {
            timeout: 30000
        };
        watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);
    }

    function onSuccess(position) {
        if (watchID != null) {
            navigator.geolocation.clearWatch(watchID);
            watchID = null;
        }
        if (m != null) {
            map.removeLayer(m);
            m = null;
        }

        m = new L.Marker([position.coords.latitude, position.coords.longitude], {
            icon: markerIconMy
        });
        m.addTo(map);
    }

    function onError(error) {
        loadLocationError();
    }
}

//--------------------------------------------------------------------------------------
// map popup controller ----------------------------------------------------------------
//--------------------------------------------------------------------------------------
$('.popup-restaurant-map').on('opened', function () {
    var lat, lng, data, zoom;
    data = restaurantDetailData;
    lat = data[0].latitude;
    lng = data[0].longitude;

    $('#map-detail').height(300);

    var context = {
        restaurant:data
    }
    var html = compiledMapPopupTemplate(context);
    $('.map-footer').empty().append(html);

    if (mapDetail != undefined) {
        try {
            mapDetail.remove();
        } catch(err) {
            console.log('maybe you use safari');
        }
    }
    mapDetail = L.map('map-detail',{zoomControl: false}).setView([lat, lng], 16);
    L.tileLayer('http://{s}.tiles.mapbox.com/v3/fuermosi777.i88jhog0/{z}/{x}/{y}.png', {
        attribution: '寻味',
        maxZoom: 20,
        detectRetina: true,
        retinaVersion: 'fuermosi777.i88jhog0'
    }).addTo(mapDetail);

    var marker = L.marker([data[0].latitude, data[0].longitude], {
        icon: markerIcon
    }).addTo(mapDetail);

    loadMe(mapDetail);
});

//--------------------------------------------------------------------------------------
// nearby page controller --------------------------------------------------------------
//--------------------------------------------------------------------------------------
myApp.onPageAfterAnimation('nearby',function (page) {
    activeCurrentPage('nearby');

    // get current location
    var lat, lng;

    // test for local
    // lat = 40.7317;
    // lng = -73.9885;
    // end test
    document.addEventListener("deviceready", onDeviceReady, false);

    function onDeviceReady() {
        navigator.geolocation.getCurrentPosition(onSuccess, onError);
    }

    function onSuccess(position) {
        lat = position.coords.latitude;
        lng = position.coords.longitude;

        $.ajax({
            url: 'http://xun-wei.com/api/get_nearby/',
            data: {
                'lat': lat,
                'lng': lng
            },
            dataType: 'json',
            timeout: 5000,
            success: function(data, status) {
                if (data.length != 0) {
                    // store data for later use
                    restaurantListData = data[0].restaurant;
                    subcategoryListData = data[0].subcategory;

                    var context = {
                        subcategory: subcategoryListData,
                        lat:lat,
                        lng:lng,
                    }

                    var html = compiledNearbyTemplate(context);

                    loadHTML('nearby', html);

                } else {
                    loadNotFoundInfomation();
                }
            },
            error: function() {
                loadErrorInfomation();
            }
        });
    }

    function onError(error) {
        loadErrorInfomation();
    }
});

//--------------------------------------------------------------------------------------
// profile controller ------------------------------------------------------------------
//--------------------------------------------------------------------------------------
myApp.onPageInit('profile', function(page) {
    $('.profile-more-button').on('click', function() {
        var buttons = [{
            text: '登出',
            color: 'red',
            onClick: function () {
                document.addEventListener("deviceready", onDeviceReadyClearStorage, false);
                function onDeviceReadyClearStorage() {
                    window.localStorage.clear();
                    mainView.goBack({
                        url:'home.html',
                        reload: true
                    });
                }
            }
        }, ];
        myApp.actions(buttons);
    });
});

myApp.onPageAfterAnimation('profile', function(page) {
    activeCurrentPage('profile');

    var username, password, html, context;

    // get username and password
    document.addEventListener("deviceready", onDeviceReady, false);

    function onDeviceReady() {
        username = window.localStorage.getItem("username");
        password = window.localStorage.getItem("password");
    }
    if (!username && !password) {
        html = '<div class="content-block pull-center padding-top">尚未<a href="login.html">登录</a>或<a href="register.html">注册</a></div>';
        loadHTML('profile', html);
    } else {
        $.ajax({
            url: 'http://xun-wei.com/api/get_profile/',
            type: 'POST',
            data: {
                'username': username,
                'password': password
            },
            dataType: 'json',
            timeout: 5000,
            success: function(data, status) {
                context = {
                    profile: data[0]
                }
                html = compiledProfileTemplate(context);
                loadHTML('profile', html);
            },
            error: function() {
                loadErrorInfomation();
            }
        });
    }
});


//--------------------------------------------------------------------------------------
// login page controller ------------------------------------------------------------------
//--------------------------------------------------------------------------------------
myApp.onPageAfterAnimation('login',function (page){
    $('#login-form-username').focus();
    // behavior
    $('.login-submit').on('click', function(e) {
        $('input').blur();
        // get data from search input
        var formData = myApp.formToJSON('#login-form');
        if (!formData.username || !formData.password){
            myApp.alert('用户名或密码填写错误哦', ['Opps!']);
            e.preventDefault();
        } else {
            $.ajax({
                url: 'http://xun-wei.com/api/check_login/',
                type: 'POST',
                data: {
                    'password': formData.password,
                    'username': formData.username
                },
                dataType: 'json',
                timeout: 5000,
                success: function(data, status) {
                    var s = data[0].status;
                    if (s === true){
                        window.localStorage.setItem("username", formData.username);
                        window.localStorage.setItem("password", formData.password);
                        mainView.goBack({reload:true});
                    } else {
                        myApp.alert('用户名或密码错误哦', ['Opps!']);
                    }
                },
                error: function() {
                    loadErrorInfomation();
                }
            });
            e.preventDefault();
        }  
    });
});
//--------------------------------------------------------------------------------------
// register page controller ------------------------------------------------------------------
//--------------------------------------------------------------------------------------
myApp.onPageAfterAnimation('register',function (page){
    $('#register-form-username').focus();
    // behavior
    $('.register-submit').on('click', function(e) {
        $('input').blur();
        // get data from search input
        var formData = myApp.formToJSON('#register-form');

        // validation
        var re = /[A-Z0-9._%+-]+@[A-Z0-9.-]+.[A-Z]{2,4}/igm; // email validation re
        if (!formData.username || formData.username.length < 6 || formData.username.length > 30){
            myApp.alert('用户名的格式不对哦,应该为6-30位的英文、数字、或下划线', ['Opps!']);
            e.preventDefault();
        } else if (formData.password1 !== formData.password2) {
            myApp.alert('两次输入的密码不一样，玩我呢？', ['Opps!']);
            e.preventDefault();
        } else if (formData.password1.length < 6 || formData.password1.length > 30){
            myApp.alert('这密码貌似也太短了', ['Opps!']);
            e.preventDefault();
        } else if (!re.test(formData.email) || !formData.email){
            myApp.alert('这Email地址看起来好怪！你确定写对了吗？', ['Opps!']);
            e.preventDefault();
        } else if (!formData.nickname) {
            myApp.alert('请填写昵称', ['Opps!']);
            e.preventDefault();
        }
        else {
            $.ajax({
                url: 'http://xun-wei.com/api/create_user/',
                type: 'POST',
                data: formData,
                dataType: 'json',
                timeout: 5000,
                success: function(data, status) {
                    var s = data[0].status;
                    if (s === true){
                        window.localStorage.setItem("username", formData.username);
                        window.localStorage.setItem("password", formData.password1);
                        mainView.goBack({reload:true});
                    } else {
                        myApp.alert('用户名或密码错误哦', ['Opps!']);
                    }
                },
                error: function() {
                    loadErrorInfomation();
                }
            });
            e.preventDefault();
        }  
    });
});
//--------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------
//--------------------------------------------------------------------------------------
// functions----------------------------------------------------------------------------
function loadErrorInfomation(){
    $('.page-on-center .page-content').empty().append('<div class="content-block-title">发生错误，可能未连接到网络</div>');
}

function loadLocationError(){
    $('.page-on-center .page-content').empty().append('<div class="content-block-title">获取位置失败，可能由于您未开启定位权限</div>');
}

function loadNotFoundInfomation(){
    $('.page-on-center .page-content').empty().append('<div class="content-block-title">啥也没找到</div>');
}

function loadHTML(page,html){
    $('.page-on-center[data-page="'+page+'"] .page-content').empty().append(html);
}

// active current page icon
function activeCurrentPage(tabPage) {
    $('.tab-link').each(function() {
        $(this).removeClass('active');
        if ($(this).hasClass('tab-' + tabPage)) {
            $(this).addClass('active');
        }
    });
}

// check new version
function checkNewVersion(){
    $.ajax({
        url: 'http://xun-wei.com/api/get_iosapp_version/',
        dataType: 'json',
        timeout: 5000,
        success: function(data, status) {
            versionServer = data[0].version;
            if (versionLocal != versionServer) {
                var modal = myApp.modal({
                    title: '检查更新',
                    text: '寻味iOS App已有新的版本 '+versionServer+'，是否下载？',
                    buttons: [{
                        text: '取消'
                    }, {
                        text: '立即更新',
                        bold: true,
                        onClick: function() {
                            window.open('http://fir.im/xunwei/', '_system');
                        }
                    }, ]
                })
            }
        },
        error: function() {}
    });
}