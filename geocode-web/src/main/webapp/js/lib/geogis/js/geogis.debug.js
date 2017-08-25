(function (factory) {
	  //define an AMD module that relies on 'leaflet'
	  if (typeof define === 'function' && define.amd) {
	    define(['leaflet'], function (L) {
	      return factory(L);
	    });
	  //define a common js module that relies on 'leaflet'
	  } else if (typeof module === 'object' && typeof module.exports === 'object') {
	    module.exports = factory(require('leaflet'));
	  }

	  if(typeof window !== 'undefined' && window.L){
	    factory(window.L);
	  }
}(function (L) {
	
	/**
 * 基于Leaflet封装geoway sdk
 * @namespace L
 * @version 1.0.3
 * @author xll
 * @since 2017-07-03
 */

L.Config = {};

/**
 * @class
 * @classdesc 核心地图类，基于L.Map对象扩展
 * @alias L.Map
 * @property {String}  id       - 容器Id
 * @property {object}  options  - 地图参数,详见L.Map
 * @example 
 * var map = new L.Map('mapId',options);
 */
L.Map = L.Map.extend({
	options: {
		crs: L.CRS.EPSG4326,
		attributionControl : false,
		minZoom : 2
	},
	getScales: function(){
		return [
		    5.916587109091312E8, 
		    2.958293554545656E8,
		    1.479146777272828E8,
		    7.39573388636414E7,
		    3.69786694318207E7,
		    1.848933471591035E7,
		    9244667.357955175,
		    4622333.678977588,
		    2311166.839488794,
		    1155583.419744397,
		    577791.7098721985,
		    288895.85493609926,
		    144447.92746804963,
		    72223.96373402482,
		    36111.98186701241,
		    18055.990933506204,
		    9027.995466753102,
		    4513.997733376551,
		    2256.998866688275,
		    1128.4994333441375,
		    564.2497166720685
		];
	}
});
/**
 * @class
 * @classdesc 事件处理静态对象
 * @alias L.GEvent
 */
L.GEvent = {
    listeners: [],
    addListener: function( name, closure ) {
        this.removeListener( name, closure );

        this.listeners.push( { name: name, closure: closure } );
    },
    removeListener: function( name, closure ) {
        var listener;
        var i = 0;
        var length = this.listeners.length;
		if(closure){
            for (; i < length; i++ ) {
                listener = this.listeners[ i ];

                if ( listener.name === name && listener.closure === closure ) {
                    this.listeners.splice( i, 1 );
                    i--;
                    length--;
                }
            }
		}else{
			this.removeListenerFor(name);
		}
    },
    dispatch: function( name, event ) {
        var listener;
        var i = 0;
        var length = this.listeners.length;

        for (; i < length; i++ ) {
            listener = this.listeners[ i ];

            if ( !listener ) continue;

            if ( listener.name === name ) {
                listener.closure.call( this, event );
            }
        }
    },
	
    hasListenerFor: function( name ) {
        var listener;
        var i = 0;
        var length = this.listeners.length;

        for (; i < length; i++ )
            if ( this.listeners[ i ].name === name ) return true;

        return false;
    },

    hasListeners: function() {
        return this.listeners.length > 0;
    },

    removeAllListeners: function() {
        this.listeners = [];
    },

    removeListenerFor: function( name ) {
        var listener;
        var i = 0;
        var length = this.listeners.length;

        for (; i < length; i++ ) {
            listener = this.listeners[ i ];

            if ( listener.name === name ) {
                this.listeners.splice( i, 1 );
                i--;
                length--;
            }
        }
    },
    /**
     * 添加事件监听
     * @method L.GEvent.on
     * @param {String} name - 自定义事件名称
     * @param {Object} closure - 触发事件调用的参数
     */
    on:function(name, closure){
    	this.addListener(name, closure);
    },
    /**
     * 移除事件监听
     * @method L.GEvent.off
     * @param {String} name - 自定义事件名称
     * @param {Object} closure - 触发事件调用的参数
     */       
    off:function(name, closure){
    	var argslen = arguments.length;
    	if(argslen==0){
    		this.removeAllListeners();
    	}else if(argslen==1){
    		this.removeListenerFor(arguments[0])
    	}else if(argslen>=2){
    		this.removeListener(arguments[0],arguments[1])
    	}
    },
    /**
     * 触发事件监听
     * @method L.GEvent.trigger
     * @param {String} name - 自定义事件名称
     * @param {Object} event - 触发事件传递的参数
     */          
    trigger:function(name, event){
    	this.dispatch(name, event);
    }
}/**
 * @class
 * @classdesc 要素管理器类，主要用于标注和要素的分类管理，样式、鼠标事件,常用于兴趣点查询
 * @constructs
 * @alias L.FeatureManager
 * @param {Object} options - 初始化参数
 * @property {object}  options                		- 要素管理器初始化参数
 * @property {L.Map}   options.map        			- 地图对象
 * @property {L.FeatureGroup}  options.featureGroup - 要素显示图层对象
 * @example 
 * var featureManager = new L.FeatureManager({map:map});
 * featureManager.createFeatureSort("test",{
 *   onFeatureClick: function(){},
 *   onFeatureOver: function(){},
 *   onFeatureOut: function(){}
 * });
 * @extends L.Class
 */
L.FeatureManager = L.Class.extend({
	options: {
		map: null,
		featureGroup: null,
		classifyList: null,
	},
	initialize: function (options) {
		this.options = L.setOptions(this, options);
		this.options.classifyList = {};
		this.options.featureGroup = options.featureGroup || L.featureGroup();
		this.options.map.addLayer(this.options.featureGroup);
		this._initEvents();
	},
	_initEvents : function(){
		var map = this.options.map;
		this.options.featureGroup.on("click",function(e){
			this.resetFeatureIcon();
			if(e.layer.onFeatureClick){
				e.layer.onFeatureClick(e.layer);
			}
			e.layer.setIcon(e.layer.options.hightIcon);
		},this);
		this.options.featureGroup.on("mouseover",function(e){
			e.layer.setIcon(e.layer.options.hightIcon);
			if(e.layer.onFeatureOver){
				e.layer.onFeatureOver(e.layer);
			}
		});
		this.options.featureGroup.on("mouseout",function(e){
			var popup = e.layer.getPopup();
			var _popup = map._popup;
			if(!(popup && _popup && (popup == _popup))){
				e.layer.setIcon(e.layer.options.unhightIcon);
			}
			if(e.layer.onFeatureOut){
				e.layer.onFeatureOut(e.layer);
			}
		});
		this.options.featureGroup.on("popupclose",function(e){
			e.layer.setIcon(e.layer.options.unhightIcon);
		},this);
	},
	/**
    * 创建要素分类
    * @method L.FeatureManager#createFeatureSort
    * @param {String} sort - 要素分类
    * @param {Object} options - 要素事件回调函数
    */
	createFeatureSort : function(sort,options){
		var options = options || {};
    	var onFeatureClick = options.onFeatureClick;
    	var onFeatureOver = options.onFeatureOver;
    	var onFeatureOut = options.onFeatureOut;
    	var params = {
    		features : [],
    		onFeatureClick: onFeatureClick,
    		onFeatureOver: onFeatureOver,
    		onFeatureOut: onFeatureOut
    	};
    	this.options.classifyList[sort] = params;
	},
	/**
    * 向类别中添加要素，要素添加到类别后将在要素的外部属性中加上类型标识
    * @method L.FeatureManager#addFeatures
    * @param {L.Marker[]} features - 添加的要素数组 L.Marker 集合。
    * @param {String} sort - 要素类别
    * @param {Boolean} isAppend - 是否追加要素
    */
    addFeatures : function(features,sort,isAppend){
    	if(!sort||typeof(sort) != "string"){ return;}
    	if(!(features instanceof Array)) {
    		features = [features];
    	}
    	var classifyList = this.options.classifyList;
    	if(classifyList[sort]){
    		var features =  this._processFeatures(features,sort);
    		if(!isAppend){
    			classifyList[sort].features = features;
    		} else {
    			classifyList[sort].features = classifyList[sort].features.concat(features);
    		}
    	}
    },
    _processFeatures : function(features,sort){
    	var mapping = this.options.classifyList[sort];
    	for(var i=0; i<features.length; i++){
    		var feature = features[i];
    		feature.sort = sort;
    		feature.onFeatureClick = mapping.onFeatureClick;
    		feature.onFeatureOver = mapping.onFeatureOver;
    		feature.onFeatureOut = mapping.onFeatureOut;
    	}
    	return features;
    },
    /**
     * 将要素绘制到地图
     * @method L.FeatureManager#drawFeaturesToMap
     * @param {(L.Marker[]|String)} content - 添加的要素数组 L.Marker 集合或者要素分类。
     */
    drawFeaturesToMap : function(content){
    	var features;
		if( typeof(content) == "string"){
			var sort = content || "default";
			if(this.options.classifyList[sort]){
				features = this.getFeatures(sort);
			}
		}
		if( content instanceof  Array){
			features = content;
		}
		if(!features) return false;
		for(var i=0;i<features.length;i++){
			features[i].setIcon(features[i].options.unhightIcon);
			this.options.featureGroup.addLayer(features[i]);
		}
    },
    /**
     * 根据分类删除该分类的要素
     * @method L.FeatureManager#clearFeaturesFromMap
     * @param {String} sort - 要素类别
     */
    clearFeaturesFromMap : function(sort){
    	if(!sort||typeof(sort) != "string"){ return;}
    	var features;
    	var mapping = this.options.classifyList[sort];
		if(sort == "allType"){
			features = this.options.featureGroup.getLayers();
		} else {
			features = mapping ? mapping.features : [];
		}
		
		if(features){
			for(var i=0;i<features.length;i++){
				this.options.featureGroup.removeLayer(features[i]);
			}
			this.options.classifyList[sort].features = [];
		}
    },
    /**
     * 根据分类获取分类的要素
     * @method L.FeatureManager#getFeatures
     * @param {String} sort - 要素类别
     * @return {L.Marker[]} features - 添加的要素数组
     */
    getFeatures : function(sort){
     	if(!sort||typeof(sort) != "string"){ return;}
     	if(this.options.classifyList[sort]){
     		return this.options.classifyList[sort].features;
     	}else{
     		return;
     	}
    },
    /**
     * 要素重置为默认样式
     * @method L.FeatureManager#resetFeatureIcon
     */
    resetFeatureIcon : function(){
    	this.options.featureGroup.eachLayer(function(layer){
			layer.setIcon(layer.options.unhightIcon);
		});
	}
});

L.featureManager = function (options) {
	return new L.FeatureManager(options);
};/**
 * @class
 * @classdesc 内容显示弹框，必须主动才能关闭，跟随地图放大缩小和漫游位置同步
 * @alias L.TipPopup
 * @param {Object} options
 * @param {Object} source
 * @extends L.Popup
 */
L.TipPopup = L.Popup.extend({
	includes: L.Mixin.Events,
	
	initialize: function (options, source) {
		this._sort = "tip-popup";
		L.Popup.prototype.initialize.call(this, options, source);
	},
	_getEvents: function () {
		var events = {
			viewreset: this._updatePosition
		};
		if (this._animated) {
			events.zoomanim = this._zoomAnimation;
		}
		if (this.options.keepInView) {
			events.moveend = this._adjustPan;
		}
		return events;
	},
	/**
    * 在地图上开启弹框
    * @method L.TipPopup#openOn
    * @param {L.Map} map - 地图对象
    */
	openOn : function(map){
		map.openTipPopup(this);
	},
	_initLayout: function () {
		var prefix = 'leaflet-popup',
			containerClass = prefix + ' ' + this.options.className + ' leaflet-zoom-' +
			        (this._animated ? 'animated' : 'hide'),
			container = this._container = L.DomUtil.create('div', containerClass);

		var wrapper = this._wrapper =
		        L.DomUtil.create('div', prefix + '-content-wrapper measure-tip-wrapper', container);
		L.DomEvent.disableClickPropagation(wrapper);

		this._contentNode = L.DomUtil.create('div', prefix + '-tipcontent', wrapper);

		L.DomEvent.disableScrollPropagation(this._contentNode);
		L.DomEvent.on(wrapper, 'contextmenu', L.DomEvent.stopPropagation);

	}
});

L.Map.include({
	/**
    * 在地图上开启弹框
    * @method L.Map#openTipPopup
    * @param {L.TipPopup} popup - 提示框
    * @param {L.LatLng} latlng - 弹框坐标位置
    * @param {object} options - 弹框参数，参见L.Popup
    */
	openTipPopup: function (popup, latlng, options) {
		if (!(popup instanceof L.Popup)) {
			var content = popup;

			popup = new L.TipPopup(options)
			    .setLatLng(latlng)
			    .setContent(content);
		}
		popup._isOpen = true;

		this._popup = popup;
		return this.addLayer(popup);
	},
	/**
    * 在地图上关闭弹框
    * @method L.Map#closePopup
    * @param {L.TipPopup} popup - 提示框
    */
	closePopup: function (popup) {
		if (!popup || popup === this._popup) {
			popup = this._popup;
			this._popup = null;
		}
		/*重写弹框关闭时不关闭提示浮云框*/
		if (popup && popup._sort != "tip-popup") {
			this.removeLayer(popup);
			popup._isOpen = false;
		}
		return this;
	}
});
/*
 * L.LatLngUtil contains different utility functions for LatLngs.
 */
L.LatLngUtil = {
	// Clones a LatLngs[], returns [][]
	cloneLatLngs: function (latlngs) {
		var clone = [];
		for (var i = 0, l = latlngs.length; i < l; i++) {
			clone.push(this.cloneLatLng(latlngs[i]));
		}
		return clone;
	},

	cloneLatLng: function (latlng) {
		return L.latLng(latlng.lat, latlng.lng);
	}
};

L.ProxyUtil = function( fn, context ) {  
	var args, proxy, tmp;  
	if ( typeof context === "string" ) {  
	   tmp = fn[ context ];  
	   context = fn;  
	   fn = tmp;  
	}  
	if ( !(typeof fn == 'function')) {  
		return undefined;  
	}  
	args = Array.prototype.slice.call( arguments, 2 );  
	proxy = function() {  
		return fn.apply( context || this, args.concat( Array.prototype.slice.call( arguments ) ) );  
	};
	return proxy;  
} 

L.GeometryUtil = L.extend(L.GeometryUtil || {}, {
	// Ported from the OpenLayers implementation. See https://github.com/openlayers/openlayers/blob/master/lib/OpenLayers/Geometry/LinearRing.js#L270
	geodesicArea: function (latLngs) {
		var pointsCount = latLngs.length,
			area = 0.0,
			d2r = L.LatLng.DEG_TO_RAD,
			p1, p2;

		if (pointsCount > 2) {
			for (var i = 0; i < pointsCount; i++) {
				p1 = latLngs[i];
				p2 = latLngs[(i + 1) % pointsCount];
				area += ((p2.lng - p1.lng) * d2r) *
						(2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
			}
			area = area * 6378137.0 * 6378137.0 / 2.0;
		}

		return Math.abs(area);
	},

	readableArea: function (area, isMetric) {
		var areaStr;

		if (isMetric) {
			if (area >= 1000000) {
				areaStr = (area * 0.000001).toFixed(2) + ' 平方公里';
			} else {
				areaStr = area.toFixed(2) + ' 平方米;';
			}
		} else {
			area /= 0.836127; // Square yards in 1 meter

			if (area >= 3097600) { //3097600 square yards in 1 square mile
				areaStr = (area / 3097600).toFixed(2) + ' mi&sup2;';
			} else if (area >= 4840) {//48040 square yards in 1 acre
				areaStr = (area / 4840).toFixed(2) + ' acres';
			} else {
				areaStr = Math.ceil(area) + ' yd&sup2;';
			}
		}

		return areaStr;
	},

	readableDistance: function (distance, isMetric, useFeet) {
		var distanceStr;

		if (isMetric) {
			// show metres when distance is < 1km, then show km
			if (distance > 1000) {
				distanceStr = (distance  / 1000).toFixed(2) + ' 千米';
			} else {
				distanceStr = Math.ceil(distance) + ' 米';
			}
		} else {
			distance *= 1.09361;

			if (distance > 1760) {
				distanceStr = (distance / 1760).toFixed(2) + ' miles';
			} else {
				var suffix = ' yd';
				if (useFeet) {
					distance = distance * 3;
					suffix = ' ft';
				}
				distanceStr = Math.ceil(distance) + suffix;
			}
		}

		return distanceStr;
	}
});


L.Util.extend(L.LineUtil, {
	// Checks to see if two line segments intersect. Does not handle degenerate cases.
	// http://compgeom.cs.uiuc.edu/~jeffe/teaching/373/notes/x06-sweepline.pdf
	segmentsIntersect: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2, /*Point*/ p3) {
		return	this._checkCounterclockwise(p, p2, p3) !==
				this._checkCounterclockwise(p1, p2, p3) &&
				this._checkCounterclockwise(p, p1, p2) !==
				this._checkCounterclockwise(p, p1, p3);
	},

	// check to see if points are in counterclockwise order
	_checkCounterclockwise: function (/*Point*/ p, /*Point*/ p1, /*Point*/ p2) {
		return (p2.y - p.y) * (p1.x - p.x) > (p1.y - p.y) * (p2.x - p.x);
	}
});

L.Polyline.include({
	// Check to see if this polyline has any linesegments that intersect.
	// NOTE: does not support detecting intersection for degenerate cases.
	intersects: function () {
		var points = this._originalPoints,
			len = points ? points.length : 0,
			i, p, p1;

		if (this._tooFewPointsForIntersection()) {
			return false;
		}

		for (i = len - 1; i >= 3; i--) {
			p = points[i - 1];
			p1 = points[i];


			if (this._lineSegmentsIntersectsRange(p, p1, i - 2)) {
				return true;
			}
		}

		return false;
	},

	// Check for intersection if new latlng was added to this polyline.
	// NOTE: does not support detecting intersection for degenerate cases.
	newLatLngIntersects: function (latlng, skipFirst) {
		// Cannot check a polyline for intersecting lats/lngs when not added to the map
		if (!this._map) {
			return false;
		}

		return this.newPointIntersects(this._map.latLngToLayerPoint(latlng), skipFirst);
	},

	// Check for intersection if new point was added to this polyline.
	// newPoint must be a layer point.
	// NOTE: does not support detecting intersection for degenerate cases.
	newPointIntersects: function (newPoint, skipFirst) {
		var points = this._originalPoints,
			len = points ? points.length : 0,
			lastPoint = points ? points[len - 1] : null,
			// The previous previous line segment. Previous line segment doesn't need testing.
			maxIndex = len - 2;

		if (this._tooFewPointsForIntersection(1)) {
			return false;
		}

		return this._lineSegmentsIntersectsRange(lastPoint, newPoint, maxIndex, skipFirst ? 1 : 0);
	},

	// Polylines with 2 sides can only intersect in cases where points are collinear (we don't support detecting these).
	// Cannot have intersection when < 3 line segments (< 4 points)
	_tooFewPointsForIntersection: function (extraPoints) {
		var points = this._originalPoints,
			len = points ? points.length : 0;
		// Increment length by extraPoints if present
		len += extraPoints || 0;

		return !this._originalPoints || len <= 3;
	},

	// Checks a line segment intersections with any line segments before its predecessor.
	// Don't need to check the predecessor as will never intersect.
	_lineSegmentsIntersectsRange: function (p, p1, maxIndex, minIndex) {
		var points = this._originalPoints,
			p2, p3;

		minIndex = minIndex || 0;

		// Check all previous line segments (beside the immediately previous) for intersections
		for (var j = maxIndex; j > minIndex; j--) {
			p2 = points[j - 1];
			p3 = points[j];

			if (L.LineUtil.segmentsIntersect(p, p1, p2, p3)) {
				return true;
			}
		}

		return false;
	}
});


L.Polygon.include({
	// Checks a polygon for any intersecting line segments. Ignores holes.
	intersects: function () {
		var polylineIntersects,
			points = this._originalPoints,
			len, firstPoint, lastPoint, maxIndex;

		if (this._tooFewPointsForIntersection()) {
			return false;
		}

		polylineIntersects = L.Polyline.prototype.intersects.call(this);

		// If already found an intersection don't need to check for any more.
		if (polylineIntersects) {
			return true;
		}

		len = points.length;
		firstPoint = points[0];
		lastPoint = points[len - 1];
		maxIndex = len - 2;

		// Check the line segment between last and first point. Don't need to check the first line segment (minIndex = 1)
		return this._lineSegmentsIntersectsRange(lastPoint, firstPoint, maxIndex, 1);
	}
});

L.FormatUtil = {
	tryFunc : function(){
		var returnValue = null;
	    for (var i=0, len=arguments.length; i<len; i++) {
	      var lambda = arguments[i];
	      try {
	        returnValue = lambda();
	        break;
	      } catch (e) {}
	    }
	    return returnValue;
	},
	bind: function(func, object) {
        // create a reference to all arguments past the second one
        var args = Array.prototype.slice.apply(arguments, [2]);
        return function() {
            // Push on any additional arguments from the actual function call.
            // These will come after those sent to the bind call.
            var newArgs = args.concat(
                Array.prototype.slice.apply(arguments, [0])
            );
            return func.apply(object, newArgs);
        };
    },
    applyDefaults : function(to, from){
    	to = to || {};
        /*
         * FF/Windows < 2.0.0.13 reports "Illegal operation on WrappedNative
         * prototype object" when calling hawOwnProperty if the source object is an
         * instance of window.Event.
         */
        var fromIsEvt = typeof window.Event == "function"
                        && from instanceof window.Event;

        for (var key in from) {
            if (to[key] === undefined ||
                (!fromIsEvt && from.hasOwnProperty
                 && from.hasOwnProperty(key) && !to.hasOwnProperty(key))) {
                to[key] = from[key];
            }
        }
        /**
         * IE doesn't include the toString property when iterating over an object's
         * properties with the for(property in object) syntax.  Explicitly check if
         * the source has its own toString property.
         */
        if(!fromIsEvt && from && from.hasOwnProperty
           && from.hasOwnProperty('toString') && !to.hasOwnProperty('toString')) {
            to.toString = from.toString;
        }
        
        return to;
    }
};

L.Util.writeGeometryToWKT = function(geometry,type){
	var wkt;
	if(type == "point"){
		wkt = 'POLYGON(' + geometry.lng + ' ' + geometry.lat +')';
	}else if(type == "line"){
		wkt = 'LINESTRING(';
		var points = [];
		for(var i=0;i<geometry.length;i++){
			points.push(geometry[i].lng + " " + geometry[i].lat);
		}
		wkt += points.join(",");
		wkt += ')';
	}else if(type == "polygon"){
		wkt = 'POLYGON(';
		var polygons = [];
		for(var i=0;i<geometry.length;i++){
			var points = [];
			for(var j=0;j<geometry[i].length;j++){
				points.push(geometry[i][j].lng + " " + geometry[i][j].lat);
			}
			polygons.push("(" +points.join(",")+ ")");
		}
		wkt += polygons.join(",");
		wkt += ')';
	}
	return wkt;
};

L.Util.getParam = function(param){
	var local = document.location.search.substring(1);
    var splits = local.split("&");
    for (var i = 0; i < splits.length; i++) {
        var sp = splits[i];
        if (sp.indexOf(param + "=") == 0) {
            var val = sp.substring(param.length + 1);
            return decodeURIComponent(val);
        }
    }
};
/**
 * 公共的http请求模块
 * 支持 get jsonp post请求
 * 
 * */
L._LeafletCallbacks = {};
L.Request = {
	support: !!(window.XMLHttpRequest && 'withCredentials' in new XMLHttpRequest()),
	callbacks: 0,
	serialize: function(params){
	    var data = '';
	    for (var key in params){
	    	if(key == "async") continue;
	    	if(params.hasOwnProperty(key)){
		        var param = params[key];
		        var type = Object.prototype.toString.call(param);
		        var value;
		
		        if(data.length){
		          data += '&';
		        }
		
		        if (type === '[object Array]'){
		          value = (Object.prototype.toString.call(param[0]) === '[object Object]') ? JSON.stringify(param) : param.join(',');
		        } else if (type === '[object Object]') {
		          value = JSON.stringify(param);
		        } else if (type === '[object Date]'){
		          value = param.valueOf();
		        } else {
		          value = param;
		        }
		        data += encodeURIComponent(key) + '=' + encodeURIComponent(value);
		    }
	    }
	    return data;
	},
	createRequest: function(callback, context, format){
	    var httpRequest = new XMLHttpRequest();

	    httpRequest.onerror = function(e) {
	      httpRequest.onreadystatechange = L.Util.falseFn;

	      callback.call(context, {
	        error: {
	          code: 500,
	          message: 'XMLHttpRequest error'
	        }
	      }, null);
	    };

	    httpRequest.onreadystatechange = function(){
	      var response;
	      var error;
	      if (httpRequest.readyState === 4) {
	    	if(format == "json"){
	    	  response = JSON.parse(httpRequest.responseText);
	    	}else{
	    	  response = httpRequest.responseText;
	    	}
	        if (!error && response.error) {
	          error = response.error;
	          response = null;
	        }

	        httpRequest.onerror = L.Util.falseFn;

	        callback.call(context, response, error);
	      }
	    };

	    return httpRequest;
	},
	request: function(url, params, callback, context){
      var paramString = L.Request.serialize(params);
      var httpRequest = L.Request.createRequest(callback, context);
      if(paramString != ''){
    	  if(url.indexOf("proxy.jsp?") != -1){
    		  var temp = url.replace("proxy.jsp?", "");
    		  if(temp.indexOf("?") != -1){
    			  url += '&' + paramString;
    		  }else{
    			  url += '?' + paramString;
    		  }
    	  }else{
    		  if(url.indexOf("?") != -1){
    			  url += '&' + paramString;
    		  }else{
    			  url += '?' + paramString;
    		  }
    	  }
      }
      var requestLength = url.length;
      var asyncValue = true;
      if(params){
    	  asyncValue = params.async;
      }
      // request is less then 2000 characters and the browser supports CORS, make GET request with XMLHttpRequest
      if(requestLength <= 2000 && L.Request.support){
        httpRequest.open('GET', url, asyncValue);
        httpRequest.send(null);

      // request is less more then 2000 characters and the browser supports CORS, make POST request with XMLHttpRequest
      } else if (requestLength > 2000 && L.Request.support){
        httpRequest.open('POST', url, asyncValue);
        httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        httpRequest.send(paramString);

      // request is less more then 2000 characters and the browser does not support CORS, make a JSONP request
      } else if(requestLength <= 2000 && !L.Request.support){
        return L.Request.get.JSONP(url, params, callback, context);

      // request is longer then 2000 characters and the browser does not support CORS, log a warning
      }
      return httpRequest;
    },
    post: {
        XMLHTTP: function (url, params, callback, context) {
          var httpRequest = L.Request.createRequest(callback, context);
          var asyncValue = true;
          if(params){
        	  asyncValue = params.async;
          }
          httpRequest.open('POST', url, asyncValue);
          httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          httpRequest.send(L.Request.serialize(params));

          return httpRequest;
        }
      },

      get: {
        CORS: function (url, params, callback, context) {
          var paramString = L.Request.serialize(params);
          var httpRequest = L.Request.createRequest(callback, context);
          if(paramString != ''){
        	  if(url.indexOf("proxy.jsp?") != -1){
	    		  var temp = url.replace("proxy.jsp?", "");
	    		  if(temp.indexOf("?") != -1){
	    			  url += '&' + paramString;
	    		  }else{
	    			  url += '?' + paramString;
	    		  }
	    	  }else{
	    		  if(url.indexOf("?") != -1){
	    			  url += '&' + paramString;
	    		  }else{
	    			  url += '?' + paramString;
	    		  }
	    	  }
          }
          var asyncValue = true;
          if(params){
        	  asyncValue = params.async;
          }
          httpRequest.open('GET', url, asyncValue);
          httpRequest.send(null);

          return httpRequest;
        },
        JSON: function(url, params, callback, context){
        	var paramString = L.Request.serialize(params);
        	var httpRequest = L.Request.createRequest(callback, context,"json");
	          if(paramString != ''){
	        	  if(url.indexOf("proxy.jsp?") != -1){
	        		  var temp = url.replace("proxy.jsp?", "");
		    		  if(temp.indexOf("?") != -1){
		    			  url += '&' + paramString;
		    		  }else{
		    			  url += '?' + paramString;
		    		  }
		    	  }else{
		    		  if(url.indexOf("?") != -1){
		    			  url += '&' + paramString;
		    		  }else{
		    			  url += '?' + paramString;
		    		  }
		    	  }
	          }
	          var asyncValue = true;
	          if(params){
	        	  asyncValue = params.async;
	          }
	          httpRequest.open('GET', url, asyncValue);
	          httpRequest.send(null);
	
	          return httpRequest;
        },
        JSONP: function(url, params, callback, context){
          var callbackId = 'c' + L.Request.callbacks;
          params = params ? params : {};
          params.callback = 'L._LeafletCallbacks.' + callbackId;

          var script = L.DomUtil.create('script', null, document.body);
          script.type = 'text/javascript';
          if(url.indexOf("?") != -1){
        	  script.src = url + '&' +  L.Request.serialize(params);
          }else{
        	  script.src = url + '?' +  L.Request.serialize(params);
          }
          script.id = callbackId;

          L._LeafletCallbacks[callbackId] = function(response){
            if(L._LeafletCallbacks[callbackId] !== true){
              var error;
              var responseType = Object.prototype.toString.call(response);

              if(!(responseType === '[object Object]' || responseType === '[object Array]')){
                error = {
                  error: {
                    code: 500,
                    message: 'Expected array or object as JSONP response'
                  }
                };
                response = null;
              }

              if (!error && response.error) {
                error = response;
                response = null;
              }

              callback.call(context, response, error);
              L._LeafletCallbacks[callbackId] = true;
            }
          };

          L.Request.callbacks++;

          return {
            id: callbackId,
            url: script.src,
            abort: function(){
              L._LeafletCallbacks._callback[callbackId]({
                code: 0,
                message: 'Request aborted.'
              });
            }
          };
        }
     }
};
L.get = (L.Request.support) ? L.Request.get.CORS : L.Request.get.JSONP;
L.getJSON = L.Request.get.JSON;
L.jsonp = L.Request.get.JSONP;
L.post = L.Request.post.XMLHTTP;
L.request = L.Request.request;
/*
 * 标绘交互类，主要用点、线、面、矩形、圆形等要素的绘制功能
 * 
 */
L.drawLocal = {
	draw: {
		toolbar: {
			actions: {
				title: '取消绘制',
				text: '取消'
			},
			finish: {
				title: '完成绘制',
				text: '完成'
			},
			undo: {
				title: '清除最后一个绘制点',
				text: '清除最后一个点'
			},
			buttons: {
				polyline: '绘制折线',
				polygon: '绘制多边形',
				rectangle: '绘制矩形',
				circle: '绘制圆形',
				marker: '绘制标注'
			}
		},
		handlers: {
			circle: {
				tooltip: {
					start: '点击并且拖动绘制圆形'
				},
				radius: '半径'
			},
			marker: {
				tooltip: {
					start: '点击地图放置标记'
				}
			},
			polygon: {
				tooltip: {
					start: '点击开始绘制面',
					cont: '点击继续绘制面',
					end: '点击起点或双击结束绘制'
				}
			},
			polyline: {
				error: '<strong>错误:</strong> 形状边缘不能交叉!',
				tooltip: {
					start: '点击开始绘制线',
					cont: '点击继续绘制线',
					end: '点击最后一个点或双击结束绘制'
				}
			},
			rectangle: {
				tooltip: {
					start: '点击并且拖动绘制矩形'
				}
			},
			simpleshape: {
				tooltip: {
					end: '松开鼠标完成绘制'
				}
			}
		}
	},
	edit: {
		toolbar: {
			actions: {
				save: {
					title: '保存编辑',
					text: '保存'
				},
				cancel: {
					title: '取消编辑',
					text: '取消'
				}
			},
			buttons: {
				edit: '编辑图层',
				editDisabled: '没有可编辑的图层',
				remove: '删除图层',
				removeDisabled: '没有可删除的图层'
			}
		},
		handlers: {
			edit: {
				tooltip: {
					text: '拖动编辑要素',
					subtext: ''
				}
			},
			remove: {
				tooltip: {
					text: '点击一个要素删除它'
				}
			}
		}
	}
};

L.Edit = {};
L.Draw = {};
/**
 * @class
 * @classdesc 内容显示弹框，必须主动才能关闭，跟随地图放大缩小和漫游位置同步
 * @alias L.Draw.Feature
 * @param {L.Map} map - 地图对象
 * @param {Object} options
 * @extends L.Handler
 */
L.Draw.Feature = L.Handler.extend({
	includes: L.Mixin.Events,

	initialize: function (map, options) {
		this._map = map;
		this._container = map._container;
		this._overlayPane = map._panes.overlayPane;
		this._popupPane = map._panes.popupPane;

		// Merge default shapeOptions options with custom shapeOptions
		if (options && options.shapeOptions) {
			options.shapeOptions = L.Util.extend({}, this.options.shapeOptions, options.shapeOptions);
		}
		L.setOptions(this, options);
	},
	/**
    * 控件激活
    * @method L.Draw.Feature#enable
    */
	enable: function () {
		if (this._enabled) { return; }

		L.Handler.prototype.enable.call(this);

		this.fire('enabled', { handler: this.type });

		this._map.fire('draw:drawstart', { layerType: this.type });
	},
	/**
    * 控件注销
    * @method L.Draw.Feature#disable
    */
	disable: function () {
		if (!this._enabled) { return; }

		L.Handler.prototype.disable.call(this);

		this._map.fire('draw:drawstop', { layerType: this.type });

		this.fire('disabled', { handler: this.type });
	},

	addHooks: function () {
		var map = this._map;

		if (map) {
			L.DomUtil.disableTextSelection();

			map.getContainer().focus();

			this._tooltip = new L.Drawtip(this._map);

			L.DomEvent.on(this._container, 'keyup', this._cancelDrawing, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			L.DomUtil.enableTextSelection();

			this._tooltip.dispose();
			this._tooltip = null;

			L.DomEvent.off(this._container, 'keyup', this._cancelDrawing, this);
		}
	},

	setOptions: function (options) {
		L.setOptions(this, options);
	},

	_fireCreatedEvent: function (layer) {
		this._map.fire('draw:created', { layer: layer, layerType: this.type });
	},

	// Cancel drawing when the escape key is pressed
	_cancelDrawing: function (e) {
		this._map.fire('draw:canceled', { layerType: this.type });
		if (e.keyCode === 27) {
			this.disable();
		}
	}
});

/**
 * @class
 * @classdesc 线绘制控件
 * @alias L.Draw.Polyline
 * @param {L.Map} map - 地图对象
 * @param {object} options - 标注参数
 * @property {L.Icon}  options.icon     - 绘制标注图标
 * @property {boolean} options.repeatMode  - 是否开启重复显示模式
 * @property {object}  options.shapeOptions  - 线条样式
 * @property {string}   options.shapeOptions.color  - 线条颜色，16进制颜色值
 * @property {number}  options.shapeOptions.weight  - 线条宽度
 * @property {float}   options.shapeOptions.opacity  - 线条透明度，0-1
 * @property {number}  options.zIndexOffset - 标注的z-index
 * @extends L.Draw.Feature
 */
L.Draw.Polyline = L.Draw.Feature.extend({
	statics: {
		TYPE: 'polyline'
	},

	Poly: L.Polyline,

	options: {
		allowIntersection: true,
		repeatMode: false,
		drawError: {
			color: '#b00b00',
			timeout: 2500
		},
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		}),
		touchIcon: new L.DivIcon({
			iconSize: new L.Point(20, 20),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
		}),
		guidelineDistance: 20,
		maxGuideLineLength: 4000,
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: false,
			clickable: true
		},
		metric: true, // Whether to use the metric measurement system or imperial
		feet: true, // When not metric, to use feet instead of yards for display.
		showLength: true, // Whether to display distance in the tooltip
		zIndexOffset: 2000 // This should be > than the highest z-index any map layers
	},

	initialize: function (map, options) {
		// if touch, switch to touch icon
		if (L.Browser.touch) {
			this.options.icon = this.options.touchIcon;
		}

		// Need to set this here to ensure the correct message is used.
		this.options.drawError.message = L.drawLocal.draw.handlers.polyline.error;

		// Merge default drawError options with custom options
		if (options && options.drawError) {
			options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
		}

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Polyline.TYPE;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map) {
			this._markers = [];

			this._markerGroup = new L.LayerGroup();
			this._map.addLayer(this._markerGroup);

			this._poly = new L.Polyline([], this.options.shapeOptions);

			this._tooltip.updateContent(this._getTooltipText());

			// Make a transparent marker that will used to catch click events. These click
			// events will create the vertices. We need to do this so we can ensure that
			// we can create vertices over other map layers (markers, vector layers). We
			// also do not want to trigger any click handlers of objects we are clicking on
			// while drawing.
			if (!this._mouseMarker) {
				this._mouseMarker = L.marker(this._map.getCenter(), {
					icon: L.divIcon({
						className: 'leaflet-mouse-marker',
						iconAnchor: [20, 20],
						iconSize: [40, 40]
					}),
					opacity: 0,
					zIndexOffset: this.options.zIndexOffset
				});
			}

			if (!L.Browser.touch) {
				this._map.on('mouseup', this._onMouseUp, this); // Necessary for 0.7 compatibility
			}

			this._mouseMarker
				.on('mousedown', this._onMouseDown, this)
				.on('mouseout', this._onMouseOut, this)
				.on('mouseup', this._onMouseUp, this) // Necessary for 0.8 compatibility
				.on('mousemove', this._onMouseMove, this) // Necessary to prevent 0.8 stutter
				.addTo(this._map);

			this._map
				.on('mouseup', this._onMouseUp, this) // Necessary for 0.7 compatibility
				.on('mousemove', this._onMouseMove, this)
				.on('zoomlevelschange', this._onZoomEnd, this)
				.on('click', this._onTouch, this)
				.on('zoomend', this._onZoomEnd, this);
		}
	},

	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);

		this._clearHideErrorTimeout();

		this._cleanUpShape();

		// remove markers from map
		this._map.removeLayer(this._markerGroup);
		delete this._markerGroup;
		delete this._markers;

		this._map.removeLayer(this._poly);
		delete this._poly;

		this._mouseMarker
			.off('mousedown', this._onMouseDown, this)
			.off('mouseout', this._onMouseOut, this)
			.off('mouseup', this._onMouseUp, this)
			.off('mousemove', this._onMouseMove, this);
		this._map.removeLayer(this._mouseMarker);
		delete this._mouseMarker;

		// clean up DOM
		this._clearGuides();

		this._map
			.off('mouseup', this._onMouseUp, this)
			.off('mousemove', this._onMouseMove, this)
			.off('zoomlevelschange', this._onZoomEnd, this)
			.off('zoomend', this._onZoomEnd, this)
			.off('click', this._onTouch, this);
	},

	deleteLastVertex: function () {
		if (this._markers.length <= 1) {
			return;
		}

		var lastMarker = this._markers.pop(),
			poly = this._poly,
			latlng = this._poly.spliceLatLngs(poly.getLatLngs().length - 1, 1)[0];

		this._markerGroup.removeLayer(lastMarker);

		if (poly.getLatLngs().length < 2) {
			this._map.removeLayer(poly);
		}

		this._vertexChanged(latlng, false);
	},

	addVertex: function (latlng) {
		var markersLength = this._markers.length;

		if (markersLength > 0 && !this.options.allowIntersection && this._poly.newLatLngIntersects(latlng)) {
			this._showErrorTooltip();
			return;
		}
		else if (this._errorShown) {
			this._hideErrorTooltip();
		}

		this._markers.push(this._createMarker(latlng));

		this._poly.addLatLng(latlng);

		if (this._poly.getLatLngs().length === 2) {
			this._map.addLayer(this._poly);
		}

		this._vertexChanged(latlng, true);
	},

	completeShape: function () {
		if (this._markers.length <= 1) {
			return;
		}

		this._fireCreatedEvent();
		this.disable();

		if (this.options.repeatMode) {
			this.enable();
		}
	},

	_finishShape: function () {
		var intersects = this._poly.newLatLngIntersects(this._poly.getLatLngs()[this._poly.getLatLngs().length - 1]);

		if ((!this.options.allowIntersection && intersects) || !this._shapeIsValid()) {
			this._showErrorTooltip();
			return;
		}

		this._fireCreatedEvent();
		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},

	//Called to verify the shape is valid when the user tries to finish it
	//Return false if the shape is not valid
	_shapeIsValid: function () {
		return true;
	},

	_onZoomEnd: function () {
		if (this._markers !== null) {
			this._updateGuide();
		}
	},

	_onMouseMove: function (e) {
		var newPos = this._map.mouseEventToLayerPoint(e.originalEvent);
		var latlng = this._map.layerPointToLatLng(newPos);

		// Save latlng
		// should this be moved to _updateGuide() ?
		this._currentLatLng = latlng;

		this._updateTooltip(latlng);

		// Update the guide line
		this._updateGuide(newPos);

		// Update the mouse marker position
		this._mouseMarker.setLatLng(latlng);

		L.DomEvent.preventDefault(e.originalEvent);
	},

	_vertexChanged: function (latlng, added) {
		this._map.fire('draw:drawvertex', { layers: this._markerGroup });
		this._updateFinishHandler();

		this._updateRunningMeasure(latlng, added);

		this._clearGuides();

		this._updateTooltip();
	},

	_onMouseDown: function (e) {
		var originalEvent = e.originalEvent;
		this._mouseDownOrigin = L.point(originalEvent.clientX, originalEvent.clientY);
	},

	_onMouseUp: function (e) {
		if (this._mouseDownOrigin) {
			// We detect clicks within a certain tolerance, otherwise let it
			// be interpreted as a drag by the map
			var distance = L.point(e.originalEvent.clientX, e.originalEvent.clientY)
				.distanceTo(this._mouseDownOrigin);
			if (Math.abs(distance) < 9 * (window.devicePixelRatio || 1)) {
				this.addVertex(e.latlng);
			}
		}
		this._mouseDownOrigin = null;
	},

	_onTouch: function (e) {
		// #TODO: use touchstart and touchend vs using click(touch start & end).
		if (L.Browser.touch) { // #TODO: get rid of this once leaflet fixes their click/touch.
			this._onMouseDown(e);
			this._onMouseUp(e);
		}
	},

	_onMouseOut: function () {
		if (this._tooltip) {
			this._tooltip._onMouseOut.call(this._tooltip);
		}
	},

	_updateFinishHandler: function () {
		var markerCount = this._markers.length;
		// The last marker should have a click handler to close the polyline
		if (markerCount > 1) {
			this._markers[markerCount - 1].on('click', this._finishShape, this);
		}

		// Remove the old marker click handler (as only the last point should close the polyline)
		if (markerCount > 2) {
			this._markers[markerCount - 2].off('click', this._finishShape, this);
		}
	},

	_createMarker: function (latlng) {
		var marker = new L.Marker(latlng, {
			icon: this.options.icon,
			zIndexOffset: this.options.zIndexOffset * 2
		});

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_updateGuide: function (newPos) {
		var markerCount = this._markers ? this._markers.length : 0;

		if (markerCount > 0) {
			newPos = newPos || this._map.latLngToLayerPoint(this._currentLatLng);

			// draw the guide line
			this._clearGuides();
			this._drawGuide(
				this._map.latLngToLayerPoint(this._markers[markerCount - 1].getLatLng()),
				newPos
			);
		}
	},

	_updateTooltip: function (latLng) {
		var text = this._getTooltipText();

		if (latLng) {
			this._tooltip.updatePosition(latLng);
		}

		if (!this._errorShown) {
			this._tooltip.updateContent(text);
		}
	},

	_drawGuide: function (pointA, pointB) {
		var length = Math.floor(Math.sqrt(Math.pow((pointB.x - pointA.x), 2) + Math.pow((pointB.y - pointA.y), 2))),
			guidelineDistance = this.options.guidelineDistance,
			maxGuideLineLength = this.options.maxGuideLineLength,
			// Only draw a guideline with a max length
			i = length > maxGuideLineLength ? length - maxGuideLineLength : guidelineDistance,
			fraction,
			dashPoint,
			dash;

		//create the guides container if we haven't yet
		if (!this._guidesContainer) {
			this._guidesContainer = L.DomUtil.create('div', 'leaflet-draw-guides', this._overlayPane);
		}

		//draw a dash every GuildeLineDistance
		for (; i < length; i += this.options.guidelineDistance) {
			//work out fraction along line we are
			fraction = i / length;

			//calculate new x,y point
			dashPoint = {
				x: Math.floor((pointA.x * (1 - fraction)) + (fraction * pointB.x)),
				y: Math.floor((pointA.y * (1 - fraction)) + (fraction * pointB.y))
			};

			//add guide dash to guide container
			dash = L.DomUtil.create('div', 'leaflet-draw-guide-dash', this._guidesContainer);
			dash.style.backgroundColor =
				!this._errorShown ? this.options.shapeOptions.color : this.options.drawError.color;

			L.DomUtil.setPosition(dash, dashPoint);
		}
	},

	_updateGuideColor: function (color) {
		if (this._guidesContainer) {
			for (var i = 0, l = this._guidesContainer.childNodes.length; i < l; i++) {
				this._guidesContainer.childNodes[i].style.backgroundColor = color;
			}
		}
	},

	// removes all child elements (guide dashes) from the guides container
	_clearGuides: function () {
		if (this._guidesContainer) {
			while (this._guidesContainer.firstChild) {
				this._guidesContainer.removeChild(this._guidesContainer.firstChild);
			}
		}
	},

	_getTooltipText: function () {
		var showLength = this.options.showLength,
			labelText, distanceStr;

		if (this._markers.length === 0) {
			labelText = {
				text: L.drawLocal.draw.handlers.polyline.tooltip.start
			};
		} else {
			distanceStr = showLength ? this._getMeasurementString() : '';

			if (this._markers.length === 1) {
				labelText = {
					text: L.drawLocal.draw.handlers.polyline.tooltip.cont,
					subtext: distanceStr
				};
			} else {
				labelText = {
					text: L.drawLocal.draw.handlers.polyline.tooltip.end,
					subtext: distanceStr
				};
			}
		}
		return labelText;
	},

	_updateRunningMeasure: function (latlng, added) {
		var markersLength = this._markers.length,
			previousMarkerIndex, distance;

		if (this._markers.length === 1) {
			this._measurementRunningTotal = 0;
		} else {
			previousMarkerIndex = markersLength - (added ? 2 : 1);
			distance = latlng.distanceTo(this._markers[previousMarkerIndex].getLatLng());

			this._measurementRunningTotal += distance * (added ? 1 : -1);
		}
	},

	_getMeasurementString: function () {
		var currentLatLng = this._currentLatLng,
			previousLatLng = this._markers[this._markers.length - 1].getLatLng(),
			distance;

		// calculate the distance from the last fixed point to the mouse position
		distance = this._measurementRunningTotal + currentLatLng.distanceTo(previousLatLng);

		return L.GeometryUtil.readableDistance(distance, this.options.metric, this.options.feet);
	},

	_showErrorTooltip: function () {
		this._errorShown = true;

		// Update tooltip
		this._tooltip
			.showAsError()
			.updateContent({ text: this.options.drawError.message });

		// Update shape
		this._updateGuideColor(this.options.drawError.color);
		this._poly.setStyle({ color: this.options.drawError.color });

		// Hide the error after 2 seconds
		this._clearHideErrorTimeout();
		this._hideErrorTimeout = setTimeout(L.Util.bind(this._hideErrorTooltip, this), this.options.drawError.timeout);
	},

	_hideErrorTooltip: function () {
		this._errorShown = false;

		this._clearHideErrorTimeout();

		// Revert tooltip
		this._tooltip
			.removeError()
			.updateContent(this._getTooltipText());

		// Revert shape
		this._updateGuideColor(this.options.shapeOptions.color);
		this._poly.setStyle({ color: this.options.shapeOptions.color });
	},

	_clearHideErrorTimeout: function () {
		if (this._hideErrorTimeout) {
			clearTimeout(this._hideErrorTimeout);
			this._hideErrorTimeout = null;
		}
	},

	_cleanUpShape: function () {
		if (this._markers.length > 1) {
			this._markers[this._markers.length - 1].off('click', this._finishShape, this);
		}
	},

	_fireCreatedEvent: function () {
		var poly = new this.Poly(this._poly.getLatLngs(), this.options.shapeOptions);
		L.Draw.Feature.prototype._fireCreatedEvent.call(this, poly);
	}
});

/**
 * @class
 * @classdesc 多边形绘制控件
 * @alias L.Draw.Polygon
 * @param {L.Map} map - 地图对象
 * @param {object} options - 标注参数
 * @property {L.Icon}  options.icon     - 绘制标注图标
 * @property {boolean} options.repeatMode  - 是否开启重复显示模式
 * @property {object}  options.shapeOptions  - 线条样式
 * @property {string}   options.shapeOptions.color  - 边框颜色，16进制颜色值
 * @property {number}  options.shapeOptions.weight  - 边框宽度
 * @property {float}   options.shapeOptions.opacity  - 边框透明度，0-1
 * @property {string}   options.shapeOptions.fillColor  - 填充色，16进制颜色值
 * @property {float}   options.shapeOptions.fillOpacity  - 填充透明度，0-1
 * @property {number}  options.zIndexOffset - 标注的z-index
 * @extends L.Draw.Polyline
 */
L.Draw.Polygon = L.Draw.Polyline.extend({
	statics: {
		TYPE: 'polygon'
	},

	Poly: L.Polygon,

	options: {
		showArea: false,
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		metric: true // Whether to use the metric measurement system or imperial
	},

	initialize: function (map, options) {
		L.Draw.Polyline.prototype.initialize.call(this, map, options);

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Polygon.TYPE;
	},

	_updateFinishHandler: function () {
		var markerCount = this._markers.length;

		// The first marker should have a click handler to close the polygon
		if (markerCount === 1) {
			this._markers[0].on('click', this._finishShape, this);
		}

		// Add and update the double click handler
		if (markerCount > 2) {
			this._markers[markerCount - 1].on('dblclick', this._finishShape, this);
			// Only need to remove handler if has been added before
			if (markerCount > 3) {
				this._markers[markerCount - 2].off('dblclick', this._finishShape, this);
			}
		}
	},

	_getTooltipText: function () {
		var text, subtext;

		if (this._markers.length === 0) {
			text = L.drawLocal.draw.handlers.polygon.tooltip.start;
		} else if (this._markers.length < 3) {
			text = L.drawLocal.draw.handlers.polygon.tooltip.cont;
		} else {
			text = L.drawLocal.draw.handlers.polygon.tooltip.end;
			subtext = this._getMeasurementString();
		}

		return {
			text: text,
			subtext: subtext
		};
	},

	_getMeasurementString: function () {
		var area = this._area;

		if (!area) {
			return null;
		}

		return L.GeometryUtil.readableArea(area, this.options.metric);
	},

	_shapeIsValid: function () {
		return this._markers.length >= 3;
	},

	_vertexChanged: function (latlng, added) {
		var latLngs;

		// Check to see if we should show the area
		if (!this.options.allowIntersection && this.options.showArea) {
			latLngs = this._poly.getLatLngs();

			this._area = L.GeometryUtil.geodesicArea(latLngs);
		}

		L.Draw.Polyline.prototype._vertexChanged.call(this, latlng, added);
	},

	_cleanUpShape: function () {
		var markerCount = this._markers.length;

		if (markerCount > 0) {
			this._markers[0].off('click', this._finishShape, this);

			if (markerCount > 2) {
				this._markers[markerCount - 1].off('dblclick', this._finishShape, this);
			}
		}
	}
});


L.Draw.SimpleShape = L.Draw.Feature.extend({
	options: {
		repeatMode: false
	},

	initialize: function (map, options) {
		this._endLabelText = L.drawLocal.draw.handlers.simpleshape.tooltip.end;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);
		if (this._map) {
			this._mapDraggable = this._map.dragging.enabled();

			if (this._mapDraggable) {
				this._map.dragging.disable();
			}

			//TODO refactor: move cursor to styles
			this._container.style.cursor = 'crosshair';

			this._tooltip.updateContent({ text: this._initialLabelText });

			this._map
				.on('mousedown', this._onMouseDown, this)
				.on('mousemove', this._onMouseMove, this)
				.on('touchstart', this._onMouseDown, this)
				.on('touchmove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);
		if (this._map) {
			if (this._mapDraggable) {
				this._map.dragging.enable();
			}

			//TODO refactor: move cursor to styles
			this._container.style.cursor = '';

			this._map
				.off('mousedown', this._onMouseDown, this)
				.off('mousemove', this._onMouseMove, this)
				.off('touchstart', this._onMouseDown, this)
				.off('touchmove', this._onMouseMove, this);

			L.DomEvent.off(document, 'mouseup', this._onMouseUp, this);
			L.DomEvent.off(document, 'touchend', this._onMouseUp, this);

			// If the box element doesn't exist they must not have moved the mouse, so don't need to destroy/return
			if (this._shape) {
				this._map.removeLayer(this._shape);
				delete this._shape;
			}
		}
		this._isDrawing = false;
	},

	_getTooltipText: function () {
		return {
			text: this._endLabelText
		};
	},

	_onMouseDown: function (e) {
		this._isDrawing = true;
		this._startLatLng = e.latlng;

		L.DomEvent
			.on(document, 'mouseup', this._onMouseUp, this)
			.on(document, 'touchend', this._onMouseUp, this)
			.preventDefault(e.originalEvent);
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng;

		this._tooltip.updatePosition(latlng);
		if (this._isDrawing) {
			this._tooltip.updateContent(this._getTooltipText());
			this._drawShape(latlng);
		}
	},

	_onMouseUp: function () {
		if (this._shape) {
			this._fireCreatedEvent();
		}

		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	}
});

L.Draw.Rectangle = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'rectangle'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		metric: true // Whether to use the metric measurement system or imperial
	},

	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Rectangle.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.rectangle.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
		if (!this._shape) {
			this._shape = new L.Rectangle(new L.LatLngBounds(this._startLatLng, latlng), this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setBounds(new L.LatLngBounds(this._startLatLng, latlng));
		}
	},

	_fireCreatedEvent: function () {
		var rectangle = new L.Rectangle(this._shape.getBounds(), this.options.shapeOptions);
		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, rectangle);
	},

	_getTooltipText: function () {
		var tooltipText = L.Draw.SimpleShape.prototype._getTooltipText.call(this),
			shape = this._shape,
			latLngs, area, subtext;

		if (shape) {
			latLngs = this._shape.getLatLngs();
			area = L.GeometryUtil.geodesicArea(latLngs);
			subtext = L.GeometryUtil.readableArea(area, this.options.metric);
		}

		return {
			text: tooltipText.text,
			subtext: subtext
		};
	}
});

L.Draw.Circle = L.Draw.SimpleShape.extend({
	statics: {
		TYPE: 'circle'
	},

	options: {
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		showRadius: true,
		metric: true, // Whether to use the metric measurement system or imperial
		feet: true // When not metric, use feet instead of yards for display
	},

	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Circle.TYPE;

		this._initialLabelText = L.drawLocal.draw.handlers.circle.tooltip.start;

		L.Draw.SimpleShape.prototype.initialize.call(this, map, options);
	},

	_drawShape: function (latlng) {
		if (!this._shape) {
			this._shape = new L.Circle(this._startLatLng, this._startLatLng.distanceTo(latlng), this.options.shapeOptions);
			this._map.addLayer(this._shape);
		} else {
			this._shape.setRadius(this._startLatLng.distanceTo(latlng));
		}
	},

	_fireCreatedEvent: function () {
		var circle = new L.Circle(this._startLatLng, this._shape.getRadius(), this.options.shapeOptions);
		L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this, circle);
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng,
			showRadius = this.options.showRadius,
			useMetric = this.options.metric,
			radius;

		this._tooltip.updatePosition(latlng);
		if (this._isDrawing) {
			this._drawShape(latlng);

			// Get the new radius (rounded to 1 dp)
			radius = this._shape.getRadius().toFixed(1);

			this._tooltip.updateContent({
				text: this._endLabelText,
				subtext: showRadius ? L.drawLocal.draw.handlers.circle.radius + ': ' +
					L.GeometryUtil.readableDistance(radius, useMetric, this.options.feet) : ''
			});
		}
	}
});

/**
 * @class
 * @classdesc 点标注绘制控件
 * @alias L.Draw.Marker
 * @param {L.Map} map - 地图对象
 * @param {object} options - 标注参数
 * @property {L.Icon}  options.icon     - 绘制标注图标
 * @property {boolean} options.repeatMode  - 是否开启重复显示模式
 * @property {number}  options.zIndexOffset - 标注的z-index
 * @extends L.Draw.Feature
 */
L.Draw.Marker = L.Draw.Feature.extend({
	statics: {
		TYPE: 'marker'
	},

	options: {
		icon: new L.Icon.Default(),
		repeatMode: false,
		zIndexOffset: 2000 // This should be > than the highest z-index any markers
	},

	initialize: function (map, options) {
		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.Draw.Marker.TYPE;

		L.Draw.Feature.prototype.initialize.call(this, map, options);
	},

	addHooks: function () {
		L.Draw.Feature.prototype.addHooks.call(this);

		if (this._map) {
			this._tooltip.updateContent({ text: L.drawLocal.draw.handlers.marker.tooltip.start });

			// Same mouseMarker as in Draw.Polyline
			if (!this._mouseMarker) {
				this._mouseMarker = L.marker(this._map.getCenter(), {
					icon: L.divIcon({
						className: 'leaflet-mouse-marker',
						iconAnchor: [20, 20],
						iconSize: [40, 40]
					}),
					opacity: 0,
					zIndexOffset: this.options.zIndexOffset
				});
			}

			this._mouseMarker
				.on('click', this._onClick, this)
				.addTo(this._map);

			this._map.on('mousemove', this._onMouseMove, this);
			this._map.on('click', this._onTouch, this);
		}
	},

	removeHooks: function () {
		L.Draw.Feature.prototype.removeHooks.call(this);

		if (this._map) {
			if (this._marker) {
				this._marker.off('click', this._onClick, this);
				this._map
					.off('click', this._onClick, this)
					.off('click', this._onTouch, this)
					.removeLayer(this._marker);
				delete this._marker;
			}

			this._mouseMarker.off('click', this._onClick, this);
			this._map.removeLayer(this._mouseMarker);
			delete this._mouseMarker;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	_onMouseMove: function (e) {
		var latlng = e.latlng;

		this._tooltip.updatePosition(latlng);
		this._mouseMarker.setLatLng(latlng);

		if (!this._marker) {
			this._marker = new L.Marker(latlng, {
				icon: this.options.icon,
				zIndexOffset: this.options.zIndexOffset
			});
			// Bind to both marker and map to make sure we get the click event.
			this._marker.on('click', this._onClick, this);
			this._map
				.on('click', this._onClick, this)
				.addLayer(this._marker);
		}
		else {
			latlng = this._mouseMarker.getLatLng();
			this._marker.setLatLng(latlng);
		}
	},

	_onClick: function () {
		this._fireCreatedEvent();

		this.disable();
		if (this.options.repeatMode) {
			this.enable();
		}
	},

	_onTouch: function (e) {
		// called on click & tap, only really does any thing on tap
		this._onMouseMove(e); // creates & places marker
		this._onClick(); // permanently places marker & ends interaction
	},

	_fireCreatedEvent: function () {
		var marker = new L.Marker(this._marker.getLatLng(), { icon: this.options.icon });
		L.Draw.Feature.prototype._fireCreatedEvent.call(this, marker);
	}
});

L.Edit.Marker = L.Handler.extend({
	initialize: function (marker, options) {
		this._marker = marker;
		L.setOptions(this, options);
	},

	addHooks: function () {
		var marker = this._marker;

		marker.dragging.enable();
		marker.on('dragend', this._onDragEnd, marker);
		this._toggleMarkerHighlight();
	},

	removeHooks: function () {
		var marker = this._marker;

		marker.dragging.disable();
		marker.off('dragend', this._onDragEnd, marker);
		this._toggleMarkerHighlight();
	},

	_onDragEnd: function (e) {
		var layer = e.target;
		layer.edited = true;
		this._map.fire('draw:editmove', {layer: layer});
	},

	_toggleMarkerHighlight: function () {
		var icon = this._marker._icon;


		// Don't do anything if this layer is a marker but doesn't have an icon. Markers
		// should usually have icons. If using Leaflet.draw with Leaflet.markercluster there
		// is a chance that a marker doesn't.
		if (!icon) {
			return;
		}

		// This is quite naughty, but I don't see another way of doing it. (short of setting a new icon)
		icon.style.display = 'none';

		if (L.DomUtil.hasClass(icon, 'leaflet-edit-marker-selected')) {
			L.DomUtil.removeClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, -4);

		} else {
			L.DomUtil.addClass(icon, 'leaflet-edit-marker-selected');
			// Offset as the border will make the icon move.
			this._offsetMarker(icon, 4);
		}

		icon.style.display = '';
	},

	_offsetMarker: function (icon, offset) {
		var iconMarginTop = parseInt(icon.style.marginTop, 10) - offset,
			iconMarginLeft = parseInt(icon.style.marginLeft, 10) - offset;

		icon.style.marginTop = iconMarginTop + 'px';
		icon.style.marginLeft = iconMarginLeft + 'px';
	}
});

L.Marker.addInitHook(function () {
	if (L.Edit.Marker) {
		this.editing = new L.Edit.Marker(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}
});

/*
 * L.Edit.Poly is an editing handler for polylines and polygons.
 */
L.Edit.Poly = L.Handler.extend({
	options: {},

	initialize: function (poly, options) {
		if(poly._latlngs.length > 1){
			this.latlngs = [poly._latlngs];
		}else{
			this.latlngs = poly._latlngs;
		}
		if (poly._holes) {
			this.latlngs = this.latlngs.concat(poly._holes);
		}

		this._poly = poly;
		L.setOptions(this, options);

		this._poly.on('revert-edited', this._updateLatLngs, this);
	},

	_eachVertexHandler: function (callback) {
		for (var i = 0; i < this._verticesHandlers.length; i++) {
			callback(this._verticesHandlers[i]);
		}
	},

	addHooks: function () {
		this._initHandlers();
		this._eachVertexHandler(function (handler) {
			handler.addHooks();
		});
	},

	removeHooks: function () {
		this._eachVertexHandler(function (handler) {
			handler.removeHooks();
		});
	},

	updateMarkers: function () {
		this._eachVertexHandler(function (handler) {
			handler.updateMarkers();
		});
	},

	_initHandlers: function () {
		this._verticesHandlers = [];
		for (var i = 0; i < this.latlngs.length; i++) {
			this._verticesHandlers.push(new L.Edit.PolyVerticesEdit(this._poly, this.latlngs[i], this.options));
		}
	},

	_updateLatLngs: function (e) {
		this.latlngs = [e.layer._latlngs];
		if (e.layer._holes) {
			this.latlngs = this.latlngs.concat(e.layer._holes);
		}
	}

});

L.Edit.PolyVerticesEdit = L.Handler.extend({
	options: {
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		}),
		touchIcon: new L.DivIcon({
			iconSize: new L.Point(20, 20),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
		}),
		drawError: {
			color: '#b00b00',
			timeout: 1000
		}


	},

	initialize: function (poly, latlngs, options) {
		// if touch, switch to touch icon
		if (L.Browser.touch) {
			this.options.icon = this.options.touchIcon;
		}
		this._poly = poly;

		if (options && options.drawError) {
			options.drawError = L.Util.extend({}, this.options.drawError, options.drawError);
		}

		this._latlngs = latlngs;

		L.setOptions(this, options);
	},

	addHooks: function () {
		var poly = this._poly;

		if (!(poly instanceof L.Polygon)) {
			poly.options.fill = false;
		}

		poly.setStyle(poly.options.editing);

		if (this._poly._map) {

			this._map = this._poly._map; // Set map

			if (!this._markerGroup) {
				this._initMarkers();
			}
			this._poly._map.addLayer(this._markerGroup);
		}
	},

	removeHooks: function () {
		var poly = this._poly;

		poly.setStyle(poly.options.original);

		if (poly._map) {
			poly._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
			delete this._markers;
		}
	},

	updateMarkers: function () {
		this._markerGroup.clearLayers();
		this._initMarkers();
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}
		this._markers = [];

		var latlngs = this._latlngs,
			i, j, len, marker;

		for (i = 0, len = latlngs.length; i < len; i++) {

			marker = this._createMarker(latlngs[i], i);
			marker.on('click', this._onMarkerClick, this);
			this._markers.push(marker);
		}

		var markerLeft, markerRight;

		for (i = 0, j = len - 1; i < len; j = i++) {
			if (i === 0 && !(L.Polygon && (this._poly instanceof L.Polygon))) {
				continue;
			}

			markerLeft = this._markers[j];
			markerRight = this._markers[i];

			this._createMiddleMarker(markerLeft, markerRight);
			this._updatePrevNext(markerLeft, markerRight);
		}
	},

	_createMarker: function (latlng, index) {
		var marker = new L.Marker(latlng, {
			draggable: true,
			icon: this.options.icon,
		});

		marker._origLatLng = latlng;
		marker._index = index;

		marker
			.on('dragstart', this._onMarkerDragStart, this)
			.on('drag', this._onMarkerDrag, this)
			.on('dragend', this._fireEdit, this)
			.on('touchmove', this._onTouchMove, this)
			.on('MSPointerMove', this._onTouchMove, this)
			.on('touchend', this._fireEdit, this)
			.on('MSPointerUp', this._fireEdit, this);

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_onMarkerDragStart: function () {
		this._poly.fire('editstart');
	},

	_spliceLatLngs: function () {
		var removed = [].splice.apply(this._latlngs, arguments);
		this._poly._convertLatLngs(this._latlngs, true);
		this._poly.redraw();
		return removed;
	},

	_removeMarker: function (marker) {
		var i = marker._index;

		this._markerGroup.removeLayer(marker);
		this._markers.splice(i, 1);
		this._spliceLatLngs(i, 1);
		this._updateIndexes(i, -1);

		marker
			.off('dragstart', this._onMarkerDragStart, this)
			.off('drag', this._onMarkerDrag, this)
			.off('dragend', this._fireEdit, this)
			.off('touchmove', this._onMarkerDrag, this)
			.off('touchend', this._fireEdit, this)
			.off('click', this._onMarkerClick, this)
			.off('MSPointerMove', this._onTouchMove, this)
			.off('MSPointerUp', this._fireEdit, this);
	},

	_fireEdit: function () {
		this._poly.edited = true;
		this._poly.fire('edit');
		this._poly._map.fire('draw:editvertex', { layers: this._markerGroup });
	},

	_onMarkerDrag: function (e) {
		var marker = e.target;
		var poly = this._poly;

		L.extend(marker._origLatLng, marker._latlng);

		if (marker._middleLeft) {
			marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
		}
		if (marker._middleRight) {
			marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
		}

		if (poly.options.poly) {
			var tooltip = poly._map._editTooltip; // Access the tooltip

			// If we don't allow intersections and the polygon intersects
			if (!poly.options.poly.allowIntersection && poly.intersects()) {

				var originalColor = poly.options.color;
				poly.setStyle({ color: this.options.drawError.color });

				if (tooltip) {
					tooltip.updateContent({
						text: L.drawLocal.draw.handlers.polyline.error
					});
				}

				// Reset everything back to normal after a second
				setTimeout(function () {
					poly.setStyle({ color: originalColor });
					if (tooltip) {
						tooltip.updateContent({
							text:  L.drawLocal.edit.handlers.edit.tooltip.text,
							subtext:  L.drawLocal.edit.handlers.edit.tooltip.subtext
						});
					}
				}, 1000);
				this._onMarkerClick(e); // Reset the marker to it's original position
			}
		}

		this._poly.redraw();
		this._poly.fire('editdrag');
	},

	_onMarkerClick: function (e) {

		var minPoints = L.Polygon && (this._poly instanceof L.Polygon) ? 4 : 3,
			marker = e.target;

		// If removing this point would create an invalid polyline/polygon don't remove
		if (this._latlngs.length < minPoints) {
			return;
		}

		// remove the marker
		this._removeMarker(marker);

		// update prev/next links of adjacent markers
		this._updatePrevNext(marker._prev, marker._next);

		// remove ghost markers near the removed marker
		if (marker._middleLeft) {
			this._markerGroup.removeLayer(marker._middleLeft);
		}
		if (marker._middleRight) {
			this._markerGroup.removeLayer(marker._middleRight);
		}

		// create a ghost marker in place of the removed one
		if (marker._prev && marker._next) {
			this._createMiddleMarker(marker._prev, marker._next);

		} else if (!marker._prev) {
			marker._next._middleLeft = null;

		} else if (!marker._next) {
			marker._prev._middleRight = null;
		}

		this._fireEdit();
	},

	_onTouchMove: function (e) {

		var layerPoint = this._map.mouseEventToLayerPoint(e.originalEvent.touches[0]),
			latlng = this._map.layerPointToLatLng(layerPoint),
			marker = e.target;

		L.extend(marker._origLatLng, latlng);

		if (marker._middleLeft) {
			marker._middleLeft.setLatLng(this._getMiddleLatLng(marker._prev, marker));
		}
		if (marker._middleRight) {
			marker._middleRight.setLatLng(this._getMiddleLatLng(marker, marker._next));
		}

		this._poly.redraw();
		this.updateMarkers();
	},

	_updateIndexes: function (index, delta) {
		this._markerGroup.eachLayer(function (marker) {
			if (marker._index > index) {
				marker._index += delta;
			}
		});
	},

	_createMiddleMarker: function (marker1, marker2) {
		var latlng = this._getMiddleLatLng(marker1, marker2),
			marker = this._createMarker(latlng),
			onClick,
			onDragStart,
			onDragEnd;

		marker.setOpacity(0.6);

		marker1._middleRight = marker2._middleLeft = marker;

		onDragStart = function () {
			marker.off('touchmove', onDragStart, this);
			var i = marker2._index;

			marker._index = i;

			marker
				.off('click', onClick, this)
				.on('click', this._onMarkerClick, this);

			latlng.lat = marker.getLatLng().lat;
			latlng.lng = marker.getLatLng().lng;
			this._spliceLatLngs(i, 0, latlng);
			this._markers.splice(i, 0, marker);

			marker.setOpacity(1);

			this._updateIndexes(i, 1);
			marker2._index++;
			this._updatePrevNext(marker1, marker);
			this._updatePrevNext(marker, marker2);

			this._poly.fire('editstart');
		};

		onDragEnd = function () {
			marker.off('dragstart', onDragStart, this);
			marker.off('dragend', onDragEnd, this);
			marker.off('touchmove', onDragStart, this);

			this._createMiddleMarker(marker1, marker);
			this._createMiddleMarker(marker, marker2);
		};

		onClick = function () {
			onDragStart.call(this);
			onDragEnd.call(this);
			this._fireEdit();
		};

		marker
			.on('click', onClick, this)
			.on('dragstart', onDragStart, this)
			.on('dragend', onDragEnd, this)
			.on('touchmove', onDragStart, this);

		this._markerGroup.addLayer(marker);
	},

	_updatePrevNext: function (marker1, marker2) {
		if (marker1) {
			marker1._next = marker2;
		}
		if (marker2) {
			marker2._prev = marker1;
		}
	},

	_getMiddleLatLng: function (marker1, marker2) {
		var map = this._poly._map,
			p1 = map.project(marker1.getLatLng()),
			p2 = map.project(marker2.getLatLng());

		return map.unproject(p1._add(p2)._divideBy(2));
	}
});

L.Polyline.addInitHook(function () {
	// Check to see if handler has already been initialized. This is to support versions of Leaflet that still have L.Handler.PolyEdit
	if (this.editing) {
		return;
	}

	if (L.Edit.Poly) {

		this.editing = new L.Edit.Poly(this, this.options.poly);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
});

L.Edit.SimpleShape = L.Handler.extend({
	options: {
		moveIcon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move'
		}),
		resizeIcon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize'
		}),
		touchMoveIcon: new L.DivIcon({
			iconSize: new L.Point(20, 20),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-move leaflet-touch-icon'
		}),
		touchResizeIcon: new L.DivIcon({
			iconSize: new L.Point(20, 20),
			className: 'leaflet-div-icon leaflet-editing-icon leaflet-edit-resize leaflet-touch-icon'
		}),
	},

	initialize: function (shape, options) {
		// if touch, switch to touch icon
		if (L.Browser.touch) {
			this.options.moveIcon = this.options.touchMoveIcon;
			this.options.resizeIcon = this.options.touchResizeIcon;
		}

		this._shape = shape;
		L.Util.setOptions(this, options);
	},

	addHooks: function () {
		var shape = this._shape;
		if (this._shape._map) {
			this._map = this._shape._map;
			shape.setStyle(shape.options.editing);

			if (shape._map) {
				this._map = shape._map;
				if (!this._markerGroup) {
					this._initMarkers();
				}
				this._map.addLayer(this._markerGroup);
			}
		}
	},

	removeHooks: function () {
		var shape = this._shape;

		shape.setStyle(shape.options.original);

		if (shape._map) {
			this._unbindMarker(this._moveMarker);

			for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
				this._unbindMarker(this._resizeMarkers[i]);
			}
			this._resizeMarkers = null;

			this._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
		}

		this._map = null;
	},

	updateMarkers: function () {
		this._markerGroup.clearLayers();
		this._initMarkers();
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}

		// Create center marker
		this._createMoveMarker();

		// Create edge marker
		this._createResizeMarker();
	},

	_createMoveMarker: function () {
		// Children override
	},

	_createResizeMarker: function () {
		// Children override
	},

	_createMarker: function (latlng, icon) {
		// Extending L.Marker in TouchEvents.js to include touch.
		var marker = new L.Marker(latlng, {
			draggable: true,
			icon: icon,
			zIndexOffset: 10
		});

		this._bindMarker(marker);

		this._markerGroup.addLayer(marker);

		return marker;
	},

	_bindMarker: function (marker) {
		marker
			.on('dragstart', this._onMarkerDragStart, this)
			.on('drag', this._onMarkerDrag, this)
			.on('dragend', this._onMarkerDragEnd, this)
			.on('touchstart', this._onTouchStart, this)
			.on('touchmove', this._onTouchMove, this)
			.on('MSPointerMove', this._onTouchMove, this)
			.on('touchend', this._onTouchEnd, this)
			.on('MSPointerUp', this._onTouchEnd, this);
	},

	_unbindMarker: function (marker) {
		marker
			.off('dragstart', this._onMarkerDragStart, this)
			.off('drag', this._onMarkerDrag, this)
			.off('dragend', this._onMarkerDragEnd, this)
			.off('touchstart', this._onTouchStart, this)
			.off('touchmove', this._onTouchMove, this)
			.off('MSPointerMove', this._onTouchMove, this)
			.off('touchend', this._onTouchEnd, this)
			.off('MSPointerUp', this._onTouchEnd, this);
	},

	_onMarkerDragStart: function (e) {
		var marker = e.target;
		marker.setOpacity(0);

		this._shape.fire('editstart');
	},

	_fireEdit: function () {
		this._shape.edited = true;
		this._shape.fire('edit');
	},

	_onMarkerDrag: function (e) {
		var marker = e.target,
			latlng = marker.getLatLng();

		if (marker === this._moveMarker) {
			this._move(latlng);
		} else {
			this._resize(latlng);
		}

		this._shape.redraw();
		this._shape.fire('editdrag');
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target;
		marker.setOpacity(1);

		this._fireEdit();
	},

	_onTouchStart: function (e) {
		L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);

		if (typeof(this._getCorners) === 'function') {
			// Save a reference to the opposite point
			var corners = this._getCorners(),
				marker = e.target,
				currentCornerIndex = marker._cornerIndex;
			
			marker.setOpacity(0);

			// Copyed from Edit.Rectangle.js line 23 _onMarkerDragStart()
			// Latlng is null otherwise.
			this._oppositeCorner = corners[(currentCornerIndex + 2) % 4];
			this._toggleCornerMarkers(0, currentCornerIndex);
		}
	
		this._shape.fire('editstart');
	},

	_onTouchMove: function (e) {
		var layerPoint = this._map.mouseEventToLayerPoint(e.originalEvent.touches[0]),
			latlng = this._map.layerPointToLatLng(layerPoint),
			marker = e.target;

		if (marker === this._moveMarker) {
			this._move(latlng);
		} else {
			this._resize(latlng);
		}

		this._shape.redraw();
		
		// prevent touchcancel in IOS
		// e.preventDefault();
		return false;
	},

	_onTouchEnd: function (e) {
		var marker = e.target;
		marker.setOpacity(1);
		this.updateMarkers();
		this._fireEdit();
	},

	_move: function () {
		// Children override
	},

	_resize: function () {
		// Children override
	}
});

L.Edit.Rectangle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var bounds = this._shape.getBounds(),
			center = bounds.getCenter();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var corners = this._getCorners();

		this._resizeMarkers = [];

		for (var i = 0, l = corners.length; i < l; i++) {
			this._resizeMarkers.push(this._createMarker(corners[i], this.options.resizeIcon));
			// Monkey in the corner index as we will need to know this for dragging
			this._resizeMarkers[i]._cornerIndex = i;
		}
	},

	_onMarkerDragStart: function (e) {
		L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this, e);

		// Save a reference to the opposite point
		var corners = this._getCorners(),
			marker = e.target,
			currentCornerIndex = marker._cornerIndex;

		this._oppositeCorner = corners[(currentCornerIndex + 2) % 4];

		this._toggleCornerMarkers(0, currentCornerIndex);
	},

	_onMarkerDragEnd: function (e) {
		var marker = e.target,
			bounds, center;

		// Reset move marker position to the center
		if (marker === this._moveMarker) {
			bounds = this._shape.getBounds();
			center = bounds.getCenter();

			marker.setLatLng(center);
		}

		this._toggleCornerMarkers(1);

		this._repositionCornerMarkers();

		L.Edit.SimpleShape.prototype._onMarkerDragEnd.call(this, e);
	},

	_move: function (newCenter) {
		var latlngs = this._shape.getLatLngs(),
			bounds = this._shape.getBounds(),
			center = bounds.getCenter(),
			offset, newLatLngs = [];

		// Offset the latlngs to the new center
		for (var i = 0, l = latlngs.length; i < l; i++) {
			offset = [latlngs[i].lat - center.lat, latlngs[i].lng - center.lng];
			newLatLngs.push([newCenter.lat + offset[0], newCenter.lng + offset[1]]);
		}

		this._shape.setLatLngs(newLatLngs);

		// Reposition the resize markers
		this._repositionCornerMarkers();

		this._map.fire('draw:editmove', {layer: this._shape});
	},

	_resize: function (latlng) {
		var bounds;

		// Update the shape based on the current position of this corner and the opposite point
		this._shape.setBounds(L.latLngBounds(latlng, this._oppositeCorner));

		// Reposition the move marker
		bounds = this._shape.getBounds();
		this._moveMarker.setLatLng(bounds.getCenter());

		this._map.fire('draw:editresize', {layer: this._shape});
	},

	_getCorners: function () {
		var bounds = this._shape.getBounds(),
			nw = bounds.getNorthWest(),
			ne = bounds.getNorthEast(),
			se = bounds.getSouthEast(),
			sw = bounds.getSouthWest();

		return [nw, ne, se, sw];
	},

	_toggleCornerMarkers: function (opacity) {
		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
			this._resizeMarkers[i].setOpacity(opacity);
		}
	},

	_repositionCornerMarkers: function () {
		var corners = this._getCorners();

		for (var i = 0, l = this._resizeMarkers.length; i < l; i++) {
			this._resizeMarkers[i].setLatLng(corners[i]);
		}
	}
});

L.Rectangle.addInitHook(function () {
	if (L.Edit.Rectangle) {
		this.editing = new L.Edit.Rectangle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}
});

L.Edit.Circle = L.Edit.SimpleShape.extend({
	_createMoveMarker: function () {
		var center = this._shape.getLatLng();

		this._moveMarker = this._createMarker(center, this.options.moveIcon);
	},

	_createResizeMarker: function () {
		var center = this._shape.getLatLng(),
			resizemarkerPoint = this._getResizeMarkerPoint(center);

		this._resizeMarkers = [];
		this._resizeMarkers.push(this._createMarker(resizemarkerPoint, this.options.resizeIcon));
	},

	_getResizeMarkerPoint: function (latlng) {
		// From L.shape.getBounds()
		var delta = this._shape._radius * Math.cos(Math.PI / 4),
			point = this._map.project(latlng);
		return this._map.unproject([point.x + delta, point.y - delta]);
	},

	_move: function (latlng) {
		var resizemarkerPoint = this._getResizeMarkerPoint(latlng);

		// Move the resize marker
		this._resizeMarkers[0].setLatLng(resizemarkerPoint);

		// Move the circle
		this._shape.setLatLng(latlng);

		this._map.fire('draw:editmove', {layer: this._shape});
	},

	_resize: function (latlng) {
		var moveLatLng = this._moveMarker.getLatLng(),
			radius = moveLatLng.distanceTo(latlng);

		this._shape.setRadius(radius);

		this._map.fire('draw:editresize', {layer: this._shape});
	}
});

L.Circle.addInitHook(function () {
	if (L.Edit.Circle) {
		this.editing = new L.Edit.Circle(this);

		if (this.options.editable) {
			this.editing.enable();
		}
	}

	this.on('add', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.addHooks();
		}
	});

	this.on('remove', function () {
		if (this.editing && this.editing.enabled()) {
			this.editing.removeHooks();
		}
	});
});

L.Drawtip = L.Class.extend({
	initialize: function (map) {
		this._map = map;
		this._popupPane = map._panes.popupPane;

		this._container = map.options.drawControlTooltips ? L.DomUtil.create('div', 'leaflet-draw-tooltip', this._popupPane) : null;
		this._singleLineLabel = false;

		this._map.on('mouseout', this._onMouseOut, this);
	},

	dispose: function () {
		this._map.off('mouseout', this._onMouseOut, this);

		if (this._container) {
			this._popupPane.removeChild(this._container);
			this._container = null;
		}
	},

	updateContent: function (labelText) {
		if (!this._container) {
			return this;
		}
		labelText.subtext = labelText.subtext || '';

		// update the vertical position (only if changed)
		if (labelText.subtext.length === 0 && !this._singleLineLabel) {
			L.DomUtil.addClass(this._container, 'leaflet-draw-tooltip-single');
			this._singleLineLabel = true;
		}
		else if (labelText.subtext.length > 0 && this._singleLineLabel) {
			L.DomUtil.removeClass(this._container, 'leaflet-draw-tooltip-single');
			this._singleLineLabel = false;
		}

		this._container.innerHTML =
			(labelText.subtext.length > 0 ? '<span class="leaflet-draw-tooltip-subtext">' + labelText.subtext + '</span>' + '<br />' : '') +
			'<span>' + labelText.text + '</span>';

		return this;
	},

	updatePosition: function (latlng) {
		var pos = this._map.latLngToLayerPoint(latlng),
			tooltipContainer = this._container;

		if (this._container) {
			tooltipContainer.style.visibility = 'inherit';
			L.DomUtil.setPosition(tooltipContainer, pos);
		}

		return this;
	},

	showAsError: function () {
		if (this._container) {
			L.DomUtil.addClass(this._container, 'leaflet-error-draw-tooltip');
		}
		return this;
	},

	removeError: function () {
		if (this._container) {
			L.DomUtil.removeClass(this._container, 'leaflet-error-draw-tooltip');
		}
		return this;
	},

	_onMouseOut: function () {
		if (this._container) {
			this._container.style.visibility = 'hidden';
		}
	}
});

L.Map.mergeOptions({
	drawControlTooltips: true
});

L.EditTool = L.EditTool || {};
/**
 * @class
 * @classdesc 要素编辑器控件
 * @alias L.EditTool.Edit
 * @param {L.Map} map - 地图对象
 * @param {object} options
 * @property {object}  options.featureGroup	- 指定可编辑的图层
 * @extends L.Handler
 */
L.EditTool.Edit = L.Handler.extend({
	statics: {
		TYPE: 'edit'
	},

	includes: L.Mixin.Events,

	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		L.setOptions(this, options);

		// Store the selectable layer group for ease of access
		this._featureGroup = options.featureGroup;

		if (!(this._featureGroup instanceof L.FeatureGroup)) {
			throw new Error('options.featureGroup must be a L.FeatureGroup');
		}

		this._uneditedLayerProps = {};

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.EditTool.Edit.TYPE;
	},
	/**
    * 控件激活
    * @method L.EditTool.Edit#enable
    */
	enable: function () {
		if (this._enabled || !this._hasAvailableLayers()) {
			return;
		}
		this.fire('enabled', {handler: this.type});
			//this disable other handlers

		this._map.fire('draw:editstart', { handler: this.type });
			//allow drawLayer to be updated before beginning edition.

		L.Handler.prototype.enable.call(this);
		this._featureGroup
			.on('layeradd', this._enableLayerEdit, this)
			.on('layerremove', this._disableLayerEdit, this);
	},
	/**
    * 控件注销
    * @method L.EditTool.Edit#disable
    */
	disable: function () {
		if (!this._enabled) { return; }
		this._featureGroup
			.off('layeradd', this._enableLayerEdit, this)
			.off('layerremove', this._disableLayerEdit, this);
		L.Handler.prototype.disable.call(this);
		this._map.fire('draw:editstop', { handler: this.type });
		this.fire('disabled', {handler: this.type});
	},

	addHooks: function () {
		var map = this._map;

		if (map) {
			map.getContainer().focus();

			this._featureGroup.eachLayer(this._enableLayerEdit, this);

			this._tooltip = new L.Drawtip(this._map);
			this._tooltip.updateContent({
				text: L.drawLocal.edit.handlers.edit.tooltip.text,
				subtext: L.drawLocal.edit.handlers.edit.tooltip.subtext
			});

			// Quickly access the tooltip to update for intersection checking
			map._editTooltip = this._tooltip;

			this._updateTooltip();

			this._map
				.on('mousemove', this._onMouseMove, this)
				.on('touchmove', this._onMouseMove, this)
				.on('MSPointerMove', this._onMouseMove, this)
				.on('click', this._editStyle, this)
				.on('draw:editvertex', this._updateTooltip, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			// Clean up selected layers.
			this._featureGroup.eachLayer(this._disableLayerEdit, this);

			// Clear the backups of the original layers
			this._uneditedLayerProps = {};

			this._tooltip.dispose();
			this._tooltip = null;

			this._map
				.off('mousemove', this._onMouseMove, this)
				.off('touchmove', this._onMouseMove, this)
				.off('MSPointerMove', this._onMouseMove, this)
				.off('click', this._editStyle, this)
				.off('draw:editvertex', this._updateTooltip, this);
		}
	},

	revertLayers: function () {
		this._featureGroup.eachLayer(function (layer) {
			this._revertLayer(layer);
		}, this);
	},

	save: function () {
		var editedLayers = new L.LayerGroup();
		this._featureGroup.eachLayer(function (layer) {
			if (layer.edited) {
				editedLayers.addLayer(layer);
				layer.edited = false;
			}
		});
		this._map.fire('draw:edited', {layers: editedLayers});
	},

	_backupLayer: function (layer) {
		var id = L.Util.stamp(layer);

		if (!this._uneditedLayerProps[id]) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				this._uneditedLayerProps[id] = {
					latlngs: L.LatLngUtil.cloneLatLngs(layer.getLatLngs())
				};
			} else if (layer instanceof L.Circle) {
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng()),
					radius: layer.getRadius()
				};
			} else if (layer instanceof L.Marker) { // Marker
				this._uneditedLayerProps[id] = {
					latlng: L.LatLngUtil.cloneLatLng(layer.getLatLng())
				};
			}
		}
	},

	_getTooltipText: function () {
		return ({
			text: L.drawLocal.edit.handlers.edit.tooltip.text,
			subtext: L.drawLocal.edit.handlers.edit.tooltip.subtext
		});
	},

	_updateTooltip: function () {
		this._tooltip.updateContent(this._getTooltipText());
	},

	_revertLayer: function (layer) {
		var id = L.Util.stamp(layer);
		layer.edited = false;
		if (this._uneditedLayerProps.hasOwnProperty(id)) {
			// Polyline, Polygon or Rectangle
			if (layer instanceof L.Polyline || layer instanceof L.Polygon || layer instanceof L.Rectangle) {
				layer.setLatLngs(this._uneditedLayerProps[id].latlngs);
			} else if (layer instanceof L.Circle) {
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
				layer.setRadius(this._uneditedLayerProps[id].radius);
			} else if (layer instanceof L.Marker) { // Marker
				layer.setLatLng(this._uneditedLayerProps[id].latlng);
			}

			layer.fire('revert-edited', { layer: layer });
		}
	},

	_enableLayerEdit: function (e) {
		var layer = e.layer || e.target || e,
			pathOptions, poly;

		// Back up this layer (if haven't before)
		this._backupLayer(layer);

		if (this.options.poly) {
			poly = L.Util.extend({}, this.options.poly);
			layer.options.poly = poly;
		}

		// Set different style for editing mode
		if (this.options.selectedPathOptions) {
			pathOptions = L.Util.extend({}, this.options.selectedPathOptions);

			// Use the existing color of the layer
			if (pathOptions.maintainColor) {
				pathOptions.color = layer.options.color;
				pathOptions.fillColor = layer.options.fillColor;
			}

			layer.options.original = L.extend({}, layer.options);
			layer.options.editing = pathOptions;

		}

		if (this.isMarker) {
			layer.dragging.enable();
			layer
				.on('dragend', this._onMarkerDragEnd)
				// #TODO: remove when leaflet finally fixes their draggable so it's touch friendly again.
				.on('touchmove', this._onTouchMove, this)
				.on('MSPointerMove', this._onTouchMove, this)
				.on('touchend', this._onMarkerDragEnd, this)
				.on('MSPointerUp', this._onMarkerDragEnd, this);
		} else {
			layer.editing.enable();
		}
	},

	_disableLayerEdit: function (e) {
		var layer = e.layer || e.target || e;

		layer.edited = false;
		layer.editing.disable();

		delete layer.options.editing;
		delete layer.options.original;
		// Reset layer styles to that of before select
		if (this._selectedPathOptions) {
			if (layer instanceof L.Marker) {
				this._toggleMarkerHighlight(layer);
			} else {
				// reset the layer style to what is was before being selected
				layer.setStyle(layer.options.previousOptions);
				// remove the cached options for the layer object
				delete layer.options.previousOptions;
			}
		}

		if (layer instanceof L.Marker) {
			layer.dragging.disable();
			layer
				.off('dragend', this._onMarkerDragEnd, this)
				.off('touchmove', this._onTouchMove, this)
				.off('MSPointerMove', this._onTouchMove, this)
				.off('touchend', this._onMarkerDragEnd, this)
				.off('MSPointerUp', this._onMarkerDragEnd, this);
		} else {
			layer.editing.disable();
		}
	},

	_onMouseMove: function (e) {
		this._tooltip.updatePosition(e.latlng);
	},

	_onTouchMove: function (e) {
		var touchEvent = e.originalEvent.changedTouches[0],
			layerPoint = this._map.mouseEventToLayerPoint(touchEvent),
			latlng = this._map.layerPointToLatLng(layerPoint);
		e.target.setLatLng(latlng);
	},

	_hasAvailableLayers: function () {
		return this._featureGroup.getLayers().length !== 0;
	}
});


L.EditTool.Delete = L.Handler.extend({
	statics: {
		TYPE: 'remove' // not delete as delete is reserved in js
	},

	includes: L.Mixin.Events,

	initialize: function (map, options) {
		L.Handler.prototype.initialize.call(this, map);

		L.Util.setOptions(this, options);

		// Store the selectable layer group for ease of access
		this._deletableLayers = this.options.featureGroup;

		if (!(this._deletableLayers instanceof L.FeatureGroup)) {
			throw new Error('options.featureGroup must be a L.FeatureGroup');
		}

		// Save the type so super can fire, need to do this as cannot do this.TYPE :(
		this.type = L.EditTool.Delete.TYPE;
	},

	enable: function () {
		if (this._enabled || !this._hasAvailableLayers()) {
			return;
		}
		this.fire('enabled', { handler: this.type});

		this._map.fire('draw:deletestart', { handler: this.type });

		L.Handler.prototype.enable.call(this);

		this._deletableLayers
			.on('layeradd', this._enableLayerDelete, this)
			.on('layerremove', this._disableLayerDelete, this);
	},

	disable: function () {
		if (!this._enabled) { return; }

		this._deletableLayers
			.off('layeradd', this._enableLayerDelete, this)
			.off('layerremove', this._disableLayerDelete, this);

		L.Handler.prototype.disable.call(this);

		this._map.fire('draw:deletestop', { handler: this.type });

		this.fire('disabled', { handler: this.type});
	},

	addHooks: function () {
		var map = this._map;

		if (map) {
			map.getContainer().focus();

			this._deletableLayers.eachLayer(this._enableLayerDelete, this);
			this._deletedLayers = new L.LayerGroup();

			this._tooltip = new L.Drawtip(this._map);
			this._tooltip.updateContent({ text: L.drawLocal.edit.handlers.remove.tooltip.text });

			this._map.on('mousemove', this._onMouseMove, this);
		}
	},

	removeHooks: function () {
		if (this._map) {
			this._deletableLayers.eachLayer(this._disableLayerDelete, this);
			this._deletedLayers = null;

			this._tooltip.dispose();
			this._tooltip = null;

			this._map.off('mousemove', this._onMouseMove, this);
		}
	},

	revertLayers: function () {
		// Iterate of the deleted layers and add them back into the featureGroup
		this._deletedLayers.eachLayer(function (layer) {
			this._deletableLayers.addLayer(layer);
			layer.fire('revert-deleted', { layer: layer });
		}, this);
	},

	save: function () {
		this._map.fire('draw:deleted', { layers: this._deletedLayers });
	},

	_enableLayerDelete: function (e) {
		var layer = e.layer || e.target || e;

		layer.on('click', this._removeLayer, this);
	},

	_disableLayerDelete: function (e) {
		var layer = e.layer || e.target || e;

		layer.off('click', this._removeLayer, this);

		// Remove from the deleted layers so we can't accidentally revert if the user presses cancel
		this._deletedLayers.removeLayer(layer);
	},

	_removeLayer: function (e) {
		var layer = e.layer || e.target || e;

		this._deletableLayers.removeLayer(layer);

		this._deletedLayers.addLayer(layer);

		layer.fire('deleted');
	},

	_onMouseMove: function (e) {
		this._tooltip.updatePosition(e.latlng);
	},

	_hasAvailableLayers: function () {
		return this._deletableLayers.getLayers().length !== 0;
	}
});

/**
 * @class
 * @classdesc 测距组件
 * @alias L.Measure.Path
 * @param {L.Map}  map       - 容器对象
 * @param {object}  options 
 * @extend L.Draw.Polyline
 */
L.Measure = L.Measure || {};
L.Measure.Path = L.Draw.Polyline.extend({
	initialize: function (map, options) {
		L.Draw.Polyline.prototype.initialize.call(this, map, options);
		this._cache = [];
	},
    addHooks: function () {
    	L.Draw.Polyline.prototype.addHooks.call(this);
    	if (this._map) {
    		this._markerGroup = new L.LayerGroup();
    		this._map.addLayer(this._markerGroup);

    		this._markers = [];
    		this._popups = [];
    		this._map.on('click', this._onClick, this);
    		this._startShape();
    	}
    },

    removeHooks: function () {
	    this._clearHideErrorTimeout();
	    this._mouseMarker
			.off('mousedown', this._onMouseDown, this)
			.off('mouseout', this._onMouseOut, this)
			.off('mouseup', this._onMouseUp, this)
			.off('mousemove', this._onMouseMove, this);
		this._map.removeLayer(this._mouseMarker);
		delete this._mouseMarker;
	    this._map
	      .off('pointermove', this._onMouseMove, this)
	      .off('mousemove', this._onMouseMove, this)
	      .off('click', this._onClick, this);
	
	    this._clearGuides();
	    this._container.style.cursor = '';
	    this._tooltip.dispose();
    },

    _startShape: function () {
    	this._drawing = true;
    	this._poly = new L.Polyline([], this.options.shapeOptions);
    	// this is added as a placeholder, if leaflet doesn't recieve
    	// this when the tool is turned off all onclick events are removed
    	this._poly._onClick = function () {};

    	this._container.style.cursor = 'crosshair';

    	this._updateTooltip();
    	this._map
    		.on('pointermove', this._onMouseMove, this)
    		.on('mousemove', this._onMouseMove, this);
    },
    
    _finishShape: function () {
    	this._drawing = false;

    	this._cleanUpShape();
    	this._clearGuides();

    	this._updateTooltip();

    	this._map
    		.off('pointermove', this._onMouseMove, this)
    		.off('mousemove', this._onMouseMove, this);

    	this._container.style.cursor = '';

		this.disable();
		
		var polyId = L.stamp(this._poly);
		var measureId = "measure-" + polyId;
		var cache = {
			id : measureId,
			popups : this._popups,
			markers : this._markers,
			poly : this._poly
		};
		this._cache.push(cache);
		
		if(this._tippopup){
			var content = this._tippopup.getContent();
			var closeBtn = L.DomUtil.create('div', "leaflet-measure-tipclose");
			closeBtn.id = measureId;
			closeBtn.title = '清除本次测距';
			this._tippopup._contentNode.appendChild(closeBtn);
			var w = this._tippopup._contentNode.offsetWidth;
			this._tippopup._contentNode.style.width = (w + 30) + "px";
			L.DomEvent.on(closeBtn, 'click', this._onTipClose, this);
		}
    },

    _removeShape: function () {
    	if (!this._poly) return;
    	this._map.removeLayer(this._poly);
    	delete this._poly;
    	this._markers.splice(0);
    	this._markerGroup.clearLayers();
    },

    _onClick: function () {
    	if (!this._drawing) {
    		this._removeShape();
    		this._startShape();
    		return;
    	}
    },

    _getTooltipText: function () {
    	var labelText = L.Draw.Polyline.prototype._getTooltipText.call(this);
    	if (!this._drawing) {
    		labelText.text = '';
    	}
    	return labelText;
    },
    
    addVertex: function (latlng) {
		var markersLength = this._markers.length;

		if (markersLength > 0 && !this.options.allowIntersection && this._poly.newLatLngIntersects(latlng)) {
			this._showErrorTooltip();
			return;
		}
		else if (this._errorShown) {
			this._hideErrorTooltip();
		}

		var marker = this._createMarker(latlng);
		L.DomEvent.on(marker, "dblclick", this._preventMouseEvent, this);
		var text = this._getTooltipText();
		var content = "";
		var w;
		if(text.subtext){
			content = text.subtext;
			w = 46;
		}else{
			content = "起点";
			w = 40;
		}
		var popup = new L.TipPopup({offset : new L.Point(w,24)});
		popup.setLatLng(latlng).setContent(content).openOn(this._map);
		popup._sort = "tip-popup";
		this._tippopup = popup;
		this._popups.push(popup);
		
		this._markers.push(marker);

		this._poly.addLatLng(latlng);

		if (this._poly.getLatLngs().length === 2) {
			this._map.addLayer(this._poly);
		}
		
		this._vertexChanged(latlng, true);
	},
	_onTipClose : function(e){
		var el = e.target || e.srcElement;
		var measureId = el.id;
		var cache = this._getCacheById(measureId);
		if(cache){
			var popups = cache.popups;
			var markers = cache.markers;
			var poly = cache.poly;
			this._map.removeLayer(poly);
			for(var i = 0;i< markers.length;i++){
				if(markers[i] && popups[i]){
					this._map.removeLayer(markers[i]);
					this._map.removeLayer(popups[i]);
				}
			}
			this._deleteCacheById(measureId);
		}
	},
	_getCacheById : function(id){
		var cache;
		for(var i = 0;i < this._cache.length;i++){
			if(this._cache[i].id == id){
				cache = this._cache[i];
				break;
			}
		}
		return cache;
	},
	_deleteCacheById : function(id){
		for(var i = this._cache.length-1;i >=0;i--){
			if(this._cache[i].id == id){
				this._cache.splice(i,1);
				break;
			}
		}
	},
	_preventMouseEvent: function(e){
		if (e.type === 'contextmenu' && this.hasEventListeners(e.type)) {
			L.DomEvent.preventDefault(e);
		}
		if (e.type !== 'mousedown') {
			L.DomEvent.stopPropagation(e);
		} else {
			L.DomEvent.preventDefault(e);
		}
	},
	clear : function(){
		var caches = this._cache;
		for(var k=0;k<caches.length;k++){
			var cache = caches[k];
			var popups = cache.popups;
			var markers = cache.markers;
			var poly = cache.poly;
			this._map.removeLayer(poly);
			for(var i = 0;i < markers.length;i++){
				if(markers[i] && popups[i]){
					this._map.removeLayer(markers[i]);
					this._map.removeLayer(popups[i]);
				}
			}
		}
		this._popups = [];
		this._markers = [];
		this._poly = null;
		this._cache = [];
	}
});
/**
 * @class
 * @classdesc 面积测量组件
 * @alias L.Measure.Area
 * @param {L.Map}  map       - 容器对象
 * @param {object}  options 
 * @extend L.Draw.Polygon
 */
L.Measure = L.Measure || {};
L.Measure.Area = L.Draw.Polygon.extend({
	options: {
		showArea: true,
		shapeOptions: {
			stroke: true,
			color: '#f06eaa',
			weight: 4,
			opacity: 0.5,
			fill: true,
			fillColor: null, //same as color by default
			fillOpacity: 0.2,
			clickable: true
		},
		metric: true // Whether to use the metric measurement system or imperial
	},
	initialize: function (map, options) {
		L.Draw.Polygon.prototype.initialize.call(this, map, options);
		this._cache = [];
	},
	addHooks: function () {
		L.Draw.Polygon.prototype.addHooks.call(this);
    	if (this._map && !this._areaGroup) {
    		this._areaGroup = new L.LayerGroup();
    		this._map.addLayer(this._areaGroup);
    	}
    },
    
    removeHooks: function () {
		this._clearHideErrorTimeout();

		this._cleanUpShape();

		// remove markers from map
		this._map.removeLayer(this._markerGroup);
		delete this._markerGroup;
		delete this._markers;

		this._map.removeLayer(this._poly);
		delete this._poly;
		
		this._mouseMarker
			.off('mousedown', this._onMouseDown, this)
			.off('mouseout', this._onMouseOut, this)
			.off('mouseup', this._onMouseUp, this)
			.off('mousemove', this._onMouseMove, this);
		this._map.removeLayer(this._mouseMarker);
		delete this._mouseMarker;

		// clean up DOM
		this._clearGuides();

		this._map
			.off('mouseup', this._onMouseUp, this)
			.off('mousemove', this._onMouseMove, this)
			.off('zoomlevelschange', this._onZoomEnd, this)
			.off('zoomend', this._onZoomEnd, this)
			.off('click', this._onTouch, this);
	    this._container.style.cursor = '';
	    this._tooltip.dispose();
	},
	
	_finishShape: function () {
		this._cleanUpShape();
    	this._clearGuides();
    	
    	var latlngs = this._poly.getLatLngs();
    	var lastLatlng = latlngs[latlngs.length - 1];
		var intersects = this._poly.newLatLngIntersects(lastLatlng);
		if ((!this.options.allowIntersection && intersects) || !this._shapeIsValid()) {
			this._showErrorTooltip();
			return;
		}
		
		var area = L.GeometryUtil.geodesicArea(latlngs);
		area = L.GeometryUtil.readableArea(area, this.options.metric)
		
		var poly = new this.Poly(this._poly.getLatLngs(), this.options.shapeOptions);
		this._areaGroup.addLayer(poly);
		var polyId = L.stamp(poly);
		var measureId = "measure-" + polyId;
		
		var popup = new L.TipPopup({offset : new L.Point(36,-4)});
		popup.setLatLng(lastLatlng).setContent(area).openOn(this._map);
		popup._sort = "tip-popup";
		
		var content = popup.getContent();
		var closeBtn = L.DomUtil.create('div', "leaflet-measure-tipclose");
		closeBtn.id = measureId;
		closeBtn.title = '清除本次测面';
		popup._contentNode.appendChild(closeBtn);
		var w = popup._contentNode.offsetWidth;
		popup._contentNode.style.width = (w + 30) + "px";
		L.DomEvent.on(closeBtn, 'click', this._onTipClose, this);
		
		var cache = {
			id : measureId,
			popup : popup,
			poly : poly
		};
		this._cache.push(cache);
		
		this.disable();
		
	},
	_onTipClose : function(e){
		var el = e.target || e.srcElement;
		var measureId = el.id;
		var cache = this._getCacheById(measureId);
		if(cache){
			var popup = cache.popup;
			var poly = cache.poly;
			this._map.removeLayer(poly);
			this._map.removeLayer(popup);
			this._deleteCacheById(measureId);
		}
	},
	_getCacheById : function(id){
		var cache;
		for(var i = 0;i < this._cache.length;i++){
			if(this._cache[i].id == id){
				cache = this._cache[i];
				break;
			}
		}
		return cache;
	},
	_deleteCacheById : function(id){
		for(var i = this._cache.length-1;i >=0;i--){
			if(this._cache[i].id == id){
				this._cache.splice(i,1);
				break;
			}
		}
	},
	clear : function(){
		var caches = this._cache;
		for(var k=0;k<caches.length;k++){
			var cache = caches[k];
			var popup = cache.popup;
			var poly = cache.poly;
			this._map.removeLayer(poly);
			this._map.removeLayer(popup);
		}
		this._cache = [];
	}
	
});L.Knob = L.Draggable.extend({
	initialize: function (element, stepHeight, knobHeight) {
		L.Draggable.prototype.initialize.call(this, element, element);
		this._element = element;

		this._stepHeight = stepHeight;
		this._knobHeight = knobHeight;

		this.on('predrag', function () {
			this._newPos.x = 0;
			this._newPos.y = this._adjust(this._newPos.y);
		}, this);
	},

	_adjust: function (y) {
		var value = Math.round(this._toValue(y));
		value = Math.max(0, Math.min(this._maxValue, value));
		return this._toY(value);
	},

	// y = k*v + m
	_toY: function (value) {
		return this._k * value + this._m;
	},
	// v = (y - m) / k
	_toValue: function (y) {
		return (y - this._m) / this._k;
	},

	setSteps: function (steps) {
		var sliderHeight = steps * this._stepHeight;
		this._maxValue = steps - 1;

		// conversion parameters
		// the conversion is just a common linear function.
		this._k = -this._stepHeight;
		this._m = sliderHeight - (this._stepHeight + this._knobHeight) / 2;
	},

	setPosition: function (y) {
		L.DomUtil.setPosition(this._element,
							  L.point(0, this._adjust(y)));
	},

	setValue: function (v) {
		this.setPosition(this._toY(v));
	},

	getValue: function () {
		return this._toValue(L.DomUtil.getPosition(this._element).y);
	}
});

/**
 * @class
 * @classdesc 鱼骨树控件
 * @alias L.Control.Zoomslider
 * @param {object} options - 鱼骨树初始化参数
 * @property {String}  position    - 位置，默认值topleft 左上角
 * @property {number}  stepHeight  - 每缩放一级滑块变化的像素高度，默认值为8
 */
L.Control.Zoomslider = L.Control.extend({
	options: {
		position: 'topleft',
		// Height of zoom-slider.png in px
		stepHeight: 8,
		// Height of the knob div in px (including border)
		knobHeight: 6,
		styleNS: 'leaflet-control-zoomslider'
	},

	onAdd: function (map) {
		this._map = map;
		this._ui = this._createUI();
		this._knob = new L.Knob(this._ui.knob,
							  this.options.stepHeight,
							  this.options.knobHeight);

		map.whenReady(this._initKnob,        this)
			.whenReady(this._initEvents,      this)
			.whenReady(this._updateSize,      this)
			.whenReady(this._updateKnobValue, this)
			.whenReady(this._updateDisabled,  this);
		return this._ui.bar;
	},

	onRemove: function (map) {
		map.off('zoomlevelschange',         this._updateSize,      this)
			.off('zoomend zoomlevelschange', this._updateKnobValue, this)
			.off('zoomend zoomlevelschange', this._updateDisabled,  this);
	},

	_createUI: function () {
		var ui = {},
			ns = this.options.styleNS;

		ui.bar     = L.DomUtil.create('div', ns + ' leaflet-bar');
		ui.zoomIn  = this._createZoomBtn('in', 'top', ui.bar);
		ui.wrap    = L.DomUtil.create('div', ns + '-wrap leaflet-bar-part', ui.bar);
		ui.zoomOut = this._createZoomBtn('out', 'bottom', ui.bar);
		ui.body    = L.DomUtil.create('div', ns + '-body', ui.wrap);
		ui.knob    = L.DomUtil.create('div', ns + '-knob');

		L.DomEvent.disableClickPropagation(ui.bar);
		L.DomEvent.disableClickPropagation(ui.knob);

		return ui;
	},
	_createZoomBtn: function (zoomDir, end, container) {
		var classDef = this.options.styleNS + '-' + zoomDir +
				' leaflet-bar-part' +
				' leaflet-bar-part-' + end,
			link = L.DomUtil.create('a', classDef, container);

		link.href = '#';
		if(zoomDir == "in"){
			link.title = '放大一级';
		}else{
			link.title = '缩小一级';
		}

		L.DomEvent.on(link, 'click', L.DomEvent.preventDefault);

		return link;
	},

	_initKnob: function () {
		this._knob.enable();
		this._ui.body.appendChild(this._ui.knob);
	},
	_initEvents: function () {
		this._map
			.on('zoomlevelschange',         this._updateSize,      this)
			.on('zoomend zoomlevelschange', this._updateKnobValue, this)
			.on('zoomend zoomlevelschange', this._updateDisabled,  this);

		L.DomEvent.on(this._ui.body,    'click', this._onSliderClick, this);
		L.DomEvent.on(this._ui.zoomIn,  'click', this._zoomIn,        this);
		L.DomEvent.on(this._ui.zoomOut, 'click', this._zoomOut,       this);

		this._knob.on('dragend', this._updateMapZoom, this);
	},

	_onSliderClick: function (e) {
		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
			y = L.DomEvent.getMousePosition(first, this._ui.body).y;

		this._knob.setPosition(y);
		this._updateMapZoom();
	},

	_zoomIn: function (e) {
		this._map.zoomIn(e.shiftKey ? 3 : 1);
	},
	_zoomOut: function (e) {
		this._map.zoomOut(e.shiftKey ? 3 : 1);
	},

	_zoomLevels: function () {
		var zoomLevels = this._map.getMaxZoom() - this._map.getMinZoom() + 1;
		return zoomLevels < Infinity ? zoomLevels : 0;
	},
	_toZoomLevel: function (value) {
		return value + this._map.getMinZoom();
	},
	_toValue: function (zoomLevel) {
		return zoomLevel - this._map.getMinZoom();
	},

	_updateSize: function () {
		var steps = this._zoomLevels();

		this._ui.body.style.height = this.options.stepHeight * steps + 'px';
		this._knob.setSteps(steps);
	},
	_updateMapZoom: function () {
		this._map.setZoom(this._toZoomLevel(this._knob.getValue()));
	},
	_updateKnobValue: function () {
		this._knob.setValue(this._toValue(this._map.getZoom()));
	},
	_updateDisabled: function () {
		var zoomLevel = this._map.getZoom(),
			className = this.options.styleNS + '-disabled';

		L.DomUtil.removeClass(this._ui.zoomIn,  className);
		L.DomUtil.removeClass(this._ui.zoomOut, className);

		if (zoomLevel === this._map.getMinZoom()) {
			L.DomUtil.addClass(this._ui.zoomOut, className);
		}
		if (zoomLevel === this._map.getMaxZoom()) {
			L.DomUtil.addClass(this._ui.zoomIn, className);
		}
	}
});

L.control.zoomslider = function (options) {
    return new L.Control.Zoomslider(options);
};L.Control.MousePosition = L.Control.extend({
  options: {
    position: 'bottomleft',
    separator: ' : ',
    emptyString: 'Unavailable',
    lngFirst: true,
    numDigits: 5,
    lngFormatter: undefined,
    latFormatter: undefined,
    prefix: ""
  },

  onAdd: function (map) {
    this._container = L.DomUtil.create('div', 'leaflet-control-mouseposition');
    L.DomEvent.disableClickPropagation(this._container);
    map.on('mousemove', this._onMouseMove, this);
    this._container.innerHTML=this.options.emptyString;
    return this._container;
  },

  onRemove: function (map) {
    map.off('mousemove', this._onMouseMove)
  },

  _onMouseMove: function (e) {
    var lng = this.options.lngFormatter ? this.options.lngFormatter(e.latlng.lng) : L.Util.formatNum(e.latlng.lng, this.options.numDigits);
    var lat = this.options.latFormatter ? this.options.latFormatter(e.latlng.lat) : L.Util.formatNum(e.latlng.lat, this.options.numDigits);
    var value = this.options.lngFirst ? lng + this.options.separator + lat : lat + this.options.separator + lng;
    var prefixAndValue = this.options.prefix + ' ' + value;
    this._container.innerHTML = prefixAndValue;
  }

});

L.Map.mergeOptions({
    positionControl: false
});

L.Map.addInitHook(function () {
    if (this.options.positionControl) {
        this.positionControl = new L.Control.MousePosition();
        this.addControl(this.positionControl);
    }
});

L.control.mousePosition = function (options) {
    return new L.Control.MousePosition(options);
};
/**
 * @class
 * @classdesc 测距组件
 * @alias L.Measure.Path
 * @param {string}  url       - 服务地址
 * @param {object}  options   -服务参数
 * @property {number}  options.tileSize  - 瓦片大小，如256
 * @property {string}  options.layer  - 图层标识符
 * @property {string}  options.style  - 样式
 * @property {string}  options.tilematrixSet  - 瓦片数据集
 * @property {string}  options.formats  - 瓦片格式，如image/png
 * @property {object[]}  options.matrixIds - 瓦片比例尺和分辨率信息
 * @extend L.TileLayer
 */
L.TileLayer.WMTS = L.TileLayer.extend({

    defaultWmtsParams: {
        service: 'WMTS',
        request: 'GetTile',
        version: '1.0.0',
        layer: '',
        style: '',
        tilematrixSet: '',
        format: 'image/jpeg'
    },

    initialize: function (url, options) { // (String, Object)
        this._url = url;
        var wmtsParams = L.extend({}, this.defaultWmtsParams),
        tileSize = options.tileSize || this.options.tileSize;
        if (options.detectRetina && L.Browser.retina) {
            wmtsParams.width = wmtsParams.height = tileSize * 2;
        } else {
            wmtsParams.width = wmtsParams.height = tileSize;
        }
        for (var i in options) {
            // all keys that are not TileLayer options go to WMTS params
            if (!this.options.hasOwnProperty(i) && i!="matrixIds") {
                wmtsParams[i] = options[i];
            }
        }
        this.wmtsParams = wmtsParams;
        this.matrixIds = options.matrixIds||this.getDefaultMatrix();
        L.setOptions(this, options);
    },

    onAdd: function (map) {
        L.TileLayer.prototype.onAdd.call(this, map);
    },

    getTileUrl: function (tilePoint) { // (Point, Number) -> String
        var map = this._map;
        var crs = map.options.crs;
        var tileSize = this.options.tileSize;
        var nwPoint = tilePoint.multiplyBy(tileSize);
        //+/-1 in order to be on the tile
        nwPoint.x+=1;
        nwPoint.y-=1;
        var sePoint = nwPoint.add(new L.Point(tileSize, tileSize));
        var nw = crs.project(map.unproject(nwPoint));
        var se = crs.project(map.unproject(sePoint));
        var tilewidth = se.x-nw.x;
        var zoom = this._getZoomForUrl();
        var scale = map.getScales()[zoom];
        //用当前的scale去匹配matrixIds
        var matrix = this.getMatrixIdByScale(scale);
        var ident = matrix.identifier;
        var X0 = matrix.topLeftCorner.lng;
        var Y0 = matrix.topLeftCorner.lat;
        var tilecol=Math.round((nw.x-X0)/tilewidth);
        var tilerow=-Math.round((nw.y-Y0)/tilewidth);
        var url = L.Util.template(this._url, {s: this._getSubdomain(tilePoint)});
        return url + L.Util.getParamString(this.wmtsParams, url) + "&tilematrix=" + ident + "&tilerow=" + tilerow +"&tilecol=" + tilecol ;
    },

    setParams: function (params, noRedraw) {
        L.extend(this.wmtsParams, params);
        if (!noRedraw) {
            this.redraw();
        }
        return this;
    },
    
    getDefaultMatrix : function () {
        /**
         * the matrix3857 represents the projection 
         * for in the IGN WMTS for the google coordinates.
         */
        var matrixIds3857 = new Array(22);
        for (var i= 0; i<22; i++) {
            matrixIds3857[i]= {
                identifier    : "" + i,
                topLeftCorner : new L.LatLng(20037508.3428,-20037508.3428)
            };
        }
        return matrixIds3857;
    },
    getMatrixIdByScale : function(scale){
    	var matrix;
    	for(var i=0;i<this.matrixIds.length;i++){
    		var scaleDenominator = this.matrixIds[i].scaleDenominator;
    		var ratio =  parseFloat(scaleDenominator) / parseFloat(scale);
    		if(ratio > 0.9 && ratio < 1.1){
    			matrix = this.matrixIds[i];
    			break;
    		}
    	}
    	return matrix;
    }
});

L.tileLayer.wmts = function (url, options) {
    return new L.TileLayer.WMTS(url, options);
};
/**
 * Ime 动态地图服务类
 * ImeDynamicMapService
 * 
 */
L.TileLayer.ImeDynamicMapService = L.TileLayer.extend({
	params: {
		FORMAT: 'png',
		TRANSPARENT: true
	},
	options: {
		tileSize: 256,
		layers: false,
		FORMAT: 'png',
		TRANSPARENT: true
	},

	initialize: function (url, options) {
		this._url = url + "/export";
		options = L.setOptions(this, options);
		options.width = options.height = options.tileSize * (options.detectRetina && L.Browser.retina ? 2 : 1);
		this.mapService = new L.ImeMapService({url:url});
	},

	onAdd: function (map) {
		this._crs = map.options.crs;
		L.TileLayer.prototype.onAdd.call(this, map);
	},

	getTileUrl: function (coords) {
		var tileBounds = this._tileCoordsToBounds(coords),
		    nw = this._crs.project(tileBounds.getNorthWest()),
		    se = this._crs.project(tileBounds.getSouthEast());
		var params = {
			TRANSPARENT: this.options.TRANSPARENT,
			FORMAT: this.options.FORMAT,
			xmin: nw.x,
			ymin: se.y,
			xmax: se.x,
			ymax: nw.y,
			width: this.options.width,
			height: this.options.height
		};
		if(this.options.layers){
	       params.layers = this.options.layers.join(',');
	    }
		L.extend(this.params, params);
		url = L.TileLayer.prototype.getTileUrl.call(this, coords);
		return url + L.Util.getParamString(this.params, url);
	},

	setParams: function (params, noRedraw) {
		L.extend(this.params, params);
		if (!noRedraw) {
			this.redraw();
		}
		return this;
	},
	setLayers: function(layers, noRedraw){
		this.options.layers = layers;
		if (!noRedraw) {
			this.redraw();
		}
	}
});


L.imeDynamicMapService = function(url, options){
  return new L.TileLayer.ImeDynamicMapService(url, options);
};
L.BaseImageLayer =  L.Layer.extend({
	includes: L.Mixin.Events,
	options: {
		opacity: 1,
		position: 'front',
		f: 'image'
	},
	onAdd: function (map) {
		this._map = map;
		
		this._update = this.limitExecByInterval(this._update, this.options.updateInterval, this);
		
		if (map.options.crs && map.options.crs.code) {
		  var sr = map.options.crs.code.split(':')[1];
		}
		
		map.on('moveend', this._update, this);
		
		// if we had an image loaded and it matches the
		// current bounds show the image otherwise remove it
		if(this._currentImage && this._currentImage._bounds.equals(this._map.getBounds())){
		  map.addLayer(this._currentImage);
		} else if(this._currentImage) {
		  this._map.removeLayer(this._currentImage);
		  this._currentImage = null;
		}
		
		this._update();
	},

	onRemove: function (map) {
	    if (this._currentImage) {
	      this._map.removeLayer(this._currentImage);
	    }
	
	    this._map.off('moveend', this._update, this);
	    this._map = null;
	},

	bringToFront: function(){
	    this.options.position = 'front';
	    if(this._currentImage){
	      this._currentImage.bringToFront();
	    }
	    return this;
	},

	bringToBack: function(){
	    this.options.position = 'back';
	    if(this._currentImage){
	      this._currentImage.bringToBack();
	    }
	    return this;
	},

	getAttribution: function () {
	    return this.options.attribution;
	},

	getOpacity: function(){
	    return this.options.opacity;
	},

	setOpacity: function(opacity){
	    this.options.opacity = opacity;
	    this._currentImage.setOpacity(opacity);
	    return this;
	},

	_renderImage: function(url, bounds){
	    if(this._map){
	      // create a new image overlay and add it to the map
	      // to start loading the image
	      // opacity is 0 while the image is loading
	      var image = new L.ImageOverlay(url, bounds, {
	        opacity: 0
	      }).addTo(this._map);
	
	      // once the image loads
	      image.once('load', function(e){
	        var newImage = e.target;
	        var oldImage = this._currentImage;
	
	        // if the bounds of this image matches the bounds that
	        // _renderImage was called with and we have a map with the same bounds
	        // hide the old image if there is one and set the opacity
	        // of the new image otherwise remove the new image
	        if(newImage._bounds.equals(bounds) && newImage._bounds.equals(this._map.getBounds())){
	          this._currentImage = newImage;
	
	          if(this.options.position === 'front'){
	            this.bringToFront();
	          } else {
	            this.bringToBack();
	          }
	
	          if(this._map && this._currentImage._map){
	            this._currentImage.setOpacity(this.options.opacity);
	          } else {
	            this._currentImage._map.removeLayer(this._currentImage);
	          }
	
	          if(oldImage && this._map) {
	            this._map.removeLayer(oldImage);
	          }
	
	          if(oldImage && oldImage._map){
	            oldImage._map.removeLayer(oldImage);
	          }
	        } else {
	          this._map.removeLayer(newImage);
	        }
	
	        this.fire('load', {
	          bounds: bounds
	        });
	
	      }, this);
	
	      this.fire('loading', {
	        bounds: bounds
	      });
	    }
	},

	_update: function () {
	    if(!this._map){
	      return;
	    }
	
	    var zoom = this._map.getZoom();
	    var bounds = this._map.getBounds();
	
	    if(this._animatingZoom){
	      return;
	    }
	
	    if (this._map._panTransition && this._map._panTransition._inProgress) {
	      return;
	    }
	
	    if (zoom > this.options.maxZoom || zoom < this.options.minZoom) {
	      if (this._currentImage) {
	        this._currentImage._map.removeLayer(this._currentImage);
	      }
	      return;
	    }
	    var params = this._buildExportParams();
	
	    this._requestExport(params, bounds);
	},
	limitExecByInterval: function (fn, time, context) {
		var lock, execOnUnlock;
		return function wrapperFn() {
			var args = arguments;
	
			if (lock) {
				execOnUnlock = true;
				return;
			}
			lock = true;
			setTimeout(function () {
				lock = false;
	
				if (execOnUnlock) {
					wrapperFn.apply(context, args);
					execOnUnlock = false;
				}
			}, time);
			fn.apply(context, args);
		};
	}
});
/**
 * IME动态地图服务，主要支持单张瓦片请求
 * 
 * 
 * */
L.BaseImageLayer.ImeDynamicMapService = L.BaseImageLayer.extend({
	options: {
	    updateInterval: 150,
	    layers: false,
	    format: 'png',
	    transparent: true
	},
	initialize: function (options) {
	    L.Util.setOptions(this, options);
	    this.mapService = new L.ImeMapService({url:options.url});
	},
	getLayers: function(){
	    return this.options.layers;
	},
	setLayers: function(layers){
	    this.options.layers = layers;
	    this._update();
	    return this;
	},
	clearLayers: function(){
		delete this.options["layers"];
		this._update();
	},
	setFilter : function(layerid, filter){
		this.options.filter = filter;
		this.options.layerid = layerid;
		this._setFilterOrRender(layerid);
	},
	setRender : function(layerid, render){
		this.options.render = render;
		this.options.layerid = layerid;
		this._setFilterOrRender(layerid);
	},
	clearFilter : function(){
		if(this.options.layerid){
			delete this.options["filter"];
			this._setFilterOrRender(this.options.layerid);
		}
	},
	clearRender : function(){
		if(this.options.layerid){
			delete this.options["render"];
			this._setFilterOrRender(this.options.layerid);
		}
	},
	clearLayersRender : function(){
		delete this.options["layerid"]; 
		delete this.options["filter"]; 
		delete this.options["render"]; 
		delete this.options["layersRender"]; 
		this._update();
	},
	_setFilterOrRender : function(layerid){
		//layersRender={"layerid" : "TBDatum_53685","filter" : "objectid in (2,3)","render" : {"rgbaBands" : [1, 0, 2, -1]}}
		var keys = ["layerid","filter","render"];
		var param = {
			layerid: layerid
		};
		if(!this.options.filter && !this.options.render){
			this.clearLayersRender();
			return false;
		}
		if(this.options.filter){
			param.filter = this.options.filter;
		}
		if(this.options.render){
			param.render = this.options.render;
		}
		var paramStrArr = [];
		for (var i = 0; i < keys.length; i++) {
			var key = keys[i];
			if (key in param) {
				var str = '';
				if (key == "render") {
					if(typeof(param[key]) == "string" ){
						str += '"' + key + '"' + ':' + param[key];
					}else{
						str += '"' + key + '"' + ':' + JSON.stringify(param[key]);
					}
				} else {
					str += '"' + key + '"' + ':' + '"' + param[key] + '"';
				}
				paramStrArr.push(str);
			}
		}
		var layers_render = "{" + paramStrArr.join(",") +"}";
		this.options.layersRender = layers_render;
		this._update();
	    return this;
	},
	_buildExportParams: function () {
	    var bounds = this._map.getBounds();
	    var size = this._map.getSize();
	    var ne = this._map.options.crs.project(bounds._northEast);
	    var sw = this._map.options.crs.project(bounds._southWest);
	
	    //ensure that we don't ask ArcGIS Server for a taller image than we have actual map displaying
	    var top = this._map.latLngToLayerPoint(bounds._northEast);
	    var bottom = this._map.latLngToLayerPoint(bounds._southWest);
	
	    if (top.y > 0 || bottom.y < size.y){
	      size.y = bottom.y - top.y;
	    }
	
	    var params = {
			xmin: sw.x,
			ymin: sw.y,
			xmax: ne.x,
			ymax: ne.y,
			width: size.x,
			height: size.y,
		    format: this.options.format,
		    transparent: this.options.transparent
	    };
	
	    if(this.options.layers){
	      params.layers = this.options.layers.join(',');
	    }
	    
	    if(this.options.layersRender){
	      params.layersRender = this.options.layersRender;
	    }
	    this.params = params;
	    return params;
	},
	_requestExport: function (params, bounds) {
		this._renderImage(this.options.url + '/export' + L.Util.getParamString(params), bounds);
	}
});

L.BaseImageLayer.imeDynamicMapService = function(options){
	return new L.BaseImageLayer.ImeDynamicMapService(options);
};L.Format = L.Class.extend({
	options : null,
	initialize : function(options){
		this.options = L.setOptions(this, options);
	},
	destroy: function() {
		
    },
	read: function(data) {
       
    },
    write: function(object) {
        
    }
});L.Format.XML = L.Format.extend({
	namespaces: null,
	namespaceAlias: null,
	defaultPrefix: null,
	readers: {},
	writers: {},
	xmldom: null,
	initialize: function(options) {
        if(window.ActiveXObject) {
            this.xmldom = new ActiveXObject("Microsoft.XMLDOM");
        }
        L.Format.prototype.initialize.apply(this, [options]);
        // clone the namespace object and set all namespace aliases
        this.namespaces = L.extend({}, this.namespaces);
        this.namespaceAlias = {};
        for(var alias in this.namespaces) {
            this.namespaceAlias[this.namespaces[alias]] = alias;
        }
    },
    destroy: function() {
        this.xmldom = null;
        L.Format.prototype.destroy.apply(this, arguments);
    },
    setNamespace: function(alias, uri) {
        this.namespaces[alias] = uri;
        this.namespaceAlias[uri] = alias;
    },
    read: function(text) {
        var index = text.indexOf('<');
        if(index > 0) {
            text = text.substring(index);
        }
        var node = L.FormatUtil.tryFunc(
        	L.FormatUtil.bind((
                function() {
                    var xmldom;
                    /**
                     * Since we want to be able to call this method on the prototype
                     * itself, this.xmldom may not exist even if in IE.
                     */
                    if(window.ActiveXObject && !this.xmldom) {
                        xmldom = new ActiveXObject("Microsoft.XMLDOM");
                    } else {
                        xmldom = this.xmldom;
                        
                    }
                    xmldom.loadXML(text);
                    return xmldom;
                }
            ), this),
            function() {
                return new DOMParser().parseFromString(text, 'text/xml');
            },
            function() {
                var req = new XMLHttpRequest();
                req.open("GET", "data:" + "text/xml" +
                         ";charset=utf-8," + encodeURIComponent(text), false);
                if(req.overrideMimeType) {
                    req.overrideMimeType("text/xml");
                }
                req.send(null);
                return req.responseXML;
            }
        );
        return node;
    },
    write: function(node) {
        var data;
        if(this.xmldom) {
            data = node.xml;
        } else {
            var serializer = new XMLSerializer();
            if (node.nodeType == 1) {
                // Add nodes to a document before serializing. Everything else
                // is serialized as is. This may need more work. See #1218 .
                var doc = document.implementation.createDocument("", "", null);
                if (doc.importNode) {
                    node = doc.importNode(node, true);
                }
                doc.appendChild(node);
                data = serializer.serializeToString(doc);
            } else {
                data = serializer.serializeToString(node);
            }
        }
        return data;
    },
    createElementNS: function(uri, name) {
        var element;
        if(this.xmldom) {
            if(typeof uri == "string") {
                element = this.xmldom.createNode(1, name, uri);
            } else {
                element = this.xmldom.createNode(1, name, "");
            }
        } else {
            element = document.createElementNS(uri, name);
        }
        return element;
    },
    createDocumentFragment: function() {
        var element;
        if (this.xmldom) {
            element = this.xmldom.createDocumentFragment();
        } else {
            element = document.createDocumentFragment();
        }
        return element;
    },
    createTextNode: function(text) {
        var node;
        if (typeof text !== "string") {
            text = String(text);
        }
        if(this.xmldom) {
            node = this.xmldom.createTextNode(text);
        } else {
            node = document.createTextNode(text);
        }
        return node;
    },
    getElementsByTagNameNS: function(node, uri, name) {
        var elements = [];
        if(node.getElementsByTagNameNS) {
            elements = node.getElementsByTagNameNS(uri, name);
        } else {
            // brute force method
            var allNodes = node.getElementsByTagName("*");
            var potentialNode, fullName;
            for(var i=0, len=allNodes.length; i<len; ++i) {
                potentialNode = allNodes[i];
                fullName = (potentialNode.prefix) ?
                           (potentialNode.prefix + ":" + name) : name;
                if((name == "*") || (fullName == potentialNode.nodeName)) {
                    if((uri == "*") || (uri == potentialNode.namespaceURI)) {
                        elements.push(potentialNode);
                    }
                }
            }
        }
        return elements;
    },
    getAttributeNodeNS: function(node, uri, name) {
        var attributeNode = null;
        if(node.getAttributeNodeNS) {
            attributeNode = node.getAttributeNodeNS(uri, name);
        } else {
            var attributes = node.attributes;
            var potentialNode, fullName;
            for(var i=0, len=attributes.length; i<len; ++i) {
                potentialNode = attributes[i];
                if(potentialNode.namespaceURI == uri) {
                    fullName = (potentialNode.prefix) ?
                               (potentialNode.prefix + ":" + name) : name;
                    if(fullName == potentialNode.nodeName) {
                        attributeNode = potentialNode;
                        break;
                    }
                }
            }
        }
        return attributeNode;
    },
    getAttributeNS: function(node, uri, name) {
        var attributeValue = "";
        if(node.getAttributeNS) {
            attributeValue = node.getAttributeNS(uri, name) || "";
        } else {
            var attributeNode = this.getAttributeNodeNS(node, uri, name);
            if(attributeNode) {
                attributeValue = attributeNode.nodeValue;
            }
        }
        return attributeValue;
    },
    getChildValue: function(node, def) {
        var value = def || "";
        if(node) {
            for(var child=node.firstChild; child; child=child.nextSibling) {
                switch(child.nodeType) {
                    case 3: // text node
                    case 4: // cdata section
                        value += child.nodeValue;
                }
            }
        }
        return value;
    },
    isSimpleContent: function(node) {
        var simple = true;
        for(var child=node.firstChild; child; child=child.nextSibling) {
            if(child.nodeType === 1) {
                simple = false;
                break;
            }
        }
        return simple;
    },
    hasAttributeNS: function(node, uri, name) {
        var found = false;
        if(node.hasAttributeNS) {
            found = node.hasAttributeNS(uri, name);
        } else {
            found = !!this.getAttributeNodeNS(node, uri, name);
        }
        return found;
    },
    setAttributeNS: function(node, uri, name, value) {
        if(node.setAttributeNS) {
            node.setAttributeNS(uri, name, value);
        } else {
            if(this.xmldom) {
                if(uri) {
                    var attribute = node.ownerDocument.createNode(
                        2, name, uri
                    );
                    attribute.nodeValue = value;
                    node.setAttributeNode(attribute);
                } else {
                    node.setAttribute(name, value);
                }
            } else {
                throw "setAttributeNS not implemented";
            }
        }
    },
    createElementNSPlus: function(name, options) {
        options = options || {};
        // order of prefix preference
        // 1. in the uri option
        // 2. in the prefix option
        // 3. in the qualified name
        // 4. from the defaultPrefix
        var uri = options.uri || this.namespaces[options.prefix];
        if(!uri) {
            var loc = name.indexOf(":");
            uri = this.namespaces[name.substring(0, loc)];
        }
        if(!uri) {
            uri = this.namespaces[this.defaultPrefix];
        }
        var node = this.createElementNS(uri, name);
        if(options.attributes) {
            this.setAttributes(node, options.attributes);
        }
        var value = options.value;
        if(value != null) {
            node.appendChild(this.createTextNode(value));
        }
        return node;
    },
    setAttributes: function(node, obj) {
        var value, uri;
        for(var name in obj) {
            if(obj[name] != null && obj[name].toString) {
                value = obj[name].toString();
                // check for qualified attribute name ("prefix:local")
                uri = this.namespaces[name.substring(0, name.indexOf(":"))] || null;
                this.setAttributeNS(node, uri, name, value);
            }
        }
    },
    readNode: function(node, obj) {
        if(!obj) {
            obj = {};
        }
        var group = this.readers[node.namespaceURI ? this.namespaceAlias[node.namespaceURI]: this.defaultPrefix];
        if(group) {
            var local = node.localName || node.nodeName.split(":").pop();
            var reader = group[local] || group["*"];
            if(reader) {
                reader.apply(this, [node, obj]);
            }
        }
        return obj;
    },
    readChildNodes: function(node, obj) {
        if(!obj) {
            obj = {};
        }
        var children = node.childNodes;
        var child;
        for(var i=0, len=children.length; i<len; ++i) {
            child = children[i];
            if(child.nodeType == 1) {
                this.readNode(child, obj);
            }
        }
        return obj;
    },
    writeNode: function(name, obj, parent) {
        var prefix, local;
        var split = name.indexOf(":");
        if(split > 0) {
            prefix = name.substring(0, split);
            local = name.substring(split + 1);
        } else {
            if(parent) {
                prefix = this.namespaceAlias[parent.namespaceURI];
            } else {
                prefix = this.defaultPrefix;
            }
            local = name;
        }
        var child = this.writers[prefix][local].apply(this, [obj]);
        if(parent) {
            parent.appendChild(child);
        }
        return child;
    },
    getChildEl: function(node, name, uri) {
        return node && this.getThisOrNextEl(node.firstChild, name, uri);
    },
    getNextEl: function(node, name, uri) {
        return node && this.getThisOrNextEl(node.nextSibling, name, uri);
    },
    getThisOrNextEl: function(node, name, uri) {
        outer: for(var sibling=node; sibling; sibling=sibling.nextSibling) {
            switch(sibling.nodeType) {
                case 1: // Element
                    if((!name || name === (sibling.localName || sibling.nodeName.split(":").pop())) &&
                       (!uri || uri === sibling.namespaceURI)) {
                        // matches
                        break outer;
                    }
                    sibling = null;
                    break outer;
                case 3: // Text
                    if(/^\s*$/.test(sibling.nodeValue)) {
                        break;
                    }
                case 4: // CDATA
                case 6: // ENTITY_NODE
                case 12: // NOTATION_NODE
                case 10: // DOCUMENT_TYPE_NODE
                case 11: // DOCUMENT_FRAGMENT_NODE
                    sibling = null;
                    break outer;
            } // ignore comments and processing instructions
        }
        return sibling || null;
    },
    lookupNamespaceURI: function(node, prefix) {
        var uri = null;
        if(node) {
            if(node.lookupNamespaceURI) {
                uri = node.lookupNamespaceURI(prefix);
            } else {
                outer: switch(node.nodeType) {
                    case 1: // ELEMENT_NODE
                        if(node.namespaceURI !== null && node.prefix === prefix) {
                            uri = node.namespaceURI;
                            break outer;
                        }
                        var len = node.attributes.length;
                        if(len) {
                            var attr;
                            for(var i=0; i<len; ++i) {
                                attr = node.attributes[i];
                                if(attr.prefix === "xmlns" && attr.name === "xmlns:" + prefix) {
                                    uri = attr.value || null;
                                    break outer;
                                } else if(attr.name === "xmlns" && prefix === null) {
                                    uri = attr.value || null;
                                    break outer;
                                }
                            }
                        }
                        uri = this.lookupNamespaceURI(node.parentNode, prefix);
                        break outer;
                    case 2: // ATTRIBUTE_NODE
                        uri = this.lookupNamespaceURI(node.ownerElement, prefix);
                        break outer;
                    case 9: // DOCUMENT_NODE
                        uri = this.lookupNamespaceURI(node.documentElement, prefix);
                        break outer;
                    case 6: // ENTITY_NODE
                    case 12: // NOTATION_NODE
                    case 10: // DOCUMENT_TYPE_NODE
                    case 11: // DOCUMENT_FRAGMENT_NODE
                        break outer;
                    default: 
                        // TEXT_NODE (3), CDATA_SECTION_NODE (4), ENTITY_REFERENCE_NODE (5),
                        // PROCESSING_INSTRUCTION_NODE (7), COMMENT_NODE (8)
                        uri =  this.lookupNamespaceURI(node.parentNode, prefix);
                        break outer;
                }
            }
        }
        return uri;
    },
    getXMLDoc: function() {
        if (!L.Format.XML.document && !this.xmldom) {
            if (document.implementation && document.implementation.createDocument) {
            	L.Format.XML.document =
                    document.implementation.createDocument("", "", null);
            } else if (!this.xmldom && window.ActiveXObject) {
                this.xmldom = new ActiveXObject("Microsoft.XMLDOM");
            }
        }
        return L.Format.XML.document || this.xmldom;
    },
});

L.Format.XML.document = null;/**
 * @class
 * @classdesc XML版本解析类，根据不同版本生成不同的解析器
 * @alias L.Format.XML.VersionedOGC
 * @extends L.Format.XML
 */
L.Format.XML.VersionedOGC = L.Format.XML.extend({
    defaultVersion: null,
    
    version: null,

    profile: null,

    allowFallback: false,

    name: null,

    stringifyOutput: false,

    parser: null,

    initialize: function(options) {
    	L.Format.XML.prototype.initialize.apply(this, [options]);
    },

    getVersion: function(root, options) {
        var version;
        // read
        if (root) {
            version = this.version;
            if(!version) {
                version = root.getAttribute("version");
                if(!version) {
                    version = this.defaultVersion;
                }
            }
        } else { // write
            version = (options && options.version) || 
                this.version || this.defaultVersion;
        }
        return version;
    },

    getParser: function(version) {
        version = version || this.defaultVersion;
        var profile = this.profile ? "_" + this.profile : "";
        if(!this.parser || this.parser.VERSION != version) {
            var format = L.Format[this.name][
                "v" + version.replace(/\./g, "_") + profile
            ];
            if(format) {
            	this.parser = new format(this.options);
            }
        }
        return this.parser;
    },

    /**
     * write document 对象
     * @method L.Format.XML.VersionedOGC#write
     * @param {Object} obj - document对象
     * @param {Object} options - 版本参数，默认不用写
     * @return {String} document - string to document
     */
    write: function(obj, options) {
        var version = this.getVersion(null, options);
        this.parser = this.getParser(version);
        var root = this.parser.write(obj, options);
        if (this.stringifyOutput === false) {
            return root;
        } else {
            return L.Format.XML.prototype.write.apply(this, [root]);
        }
    },

    /**
     * read string xml
     * @method L.Format.XML.VersionedOGC#read
     * @param {string} data - xml string
     * @param {Object} options - 版本参数，默认不用写
     * @return {Object} obj - string to document
     */
    read: function(data, options) {
        if(typeof data == "string") {
            data = L.Format.XML.prototype.read.apply(this, [data]);
        }
        var root = data.documentElement;
        var version = this.getVersion(root);
        this.parser = this.getParser(version);          // Select the parser
        var obj = this.parser.read(data, options);      // Parse the data

        obj.version = version;
        return obj;
    }
});

L.Format.OWSCommon = L.Format.XML.VersionedOGC.extend({
    defaultVersion: "1.0.0",
    
    getVersion: function(root, options) {
        var version = this.version;
        if(!version) {
            // remember version does not correspond to the OWS version
            // it corresponds to the WMS/WFS/WCS etc. request version
            var uri = root.getAttribute("xmlns:ows");
            // the above will fail if the namespace prefix is different than
            // ows and if the namespace is declared on a different element
            if (uri && uri.substring(uri.lastIndexOf("/")+1) === "1.1") {
                version ="1.1.0";
            } 
            if(!version) {
                version = this.defaultVersion;
            }
        }
        return version;
    }
});/**
 * @class
 * @classdesc WMTS XML 解析类
 * @alias L.Format.WMTSCapabilities
 * @extends L.Format.XML.VersionedOGC
 */
L.Format.WMTSCapabilities = L.Format.XML.VersionedOGC.extend({
	name: "WMTSCapabilities",
	defaultVersion: "1.0.0",
	yx: {
        "urn:ogc:def:crs:EPSG::4326": true,
        "urn:ogc:def:crs:EPSG::4490": true,
        "urn:ogc:def:crs:EPSG::900913": true
    },
    xy: {
        "urn:ogc:def:crs:EPSG::3857": true,
        "urn:ogc:def:crs:EPSG::3785": true,
        "urn:ogc:def:crs:EPSG::102100": true
    }
});L.Format.OWSCommon.v1 = L.Format.XML.extend({
   
    regExes: {
        trimSpace: (/^\s*|\s*$/g),
        removeSpace: (/\s*/g),
        splitSpace: (/\s+/),
        trimComma: (/\s*,\s*/g)
    },

    read: function(data, options) {
        options = L.FormatUtil.applyDefaults(options, this.options);
        var ows = {};
        this.readChildNodes(data, ows);
        return ows;
    },

    readers: {
        "ows": {
            "Exception": function(node, exceptionReport) {
                var exception = {
                    code: node.getAttribute('exceptionCode'),
                    locator: node.getAttribute('locator'),
                    texts: []
                };
                exceptionReport.exceptions.push(exception);
                this.readChildNodes(node, exception);
            },
            "ExceptionText": function(node, exception) {
                var text = this.getChildValue(node);
                exception.texts.push(text);
            },
            "ServiceIdentification": function(node, obj) {
                obj.serviceIdentification = {};
                this.readChildNodes(node, obj.serviceIdentification);
            },
            "Title": function(node, obj) {
                obj.title = this.getChildValue(node);
            },
            "Abstract": function(node, serviceIdentification) {
                serviceIdentification["abstract"] = this.getChildValue(node);
            },
            "Keywords": function(node, serviceIdentification) {
                serviceIdentification.keywords = {};
                this.readChildNodes(node, serviceIdentification.keywords);
            },
            "Keyword": function(node, keywords) {
                keywords[this.getChildValue(node)] = true;
            },
            "ServiceType": function(node, serviceIdentification) {
                serviceIdentification.serviceType = {
                    codeSpace: node.getAttribute('codeSpace'), 
                    value: this.getChildValue(node)};
            },
            "ServiceTypeVersion": function(node, serviceIdentification) {
                serviceIdentification.serviceTypeVersion = this.getChildValue(node);
            },
            "Fees": function(node, serviceIdentification) {
                serviceIdentification.fees = this.getChildValue(node);
            },
            "AccessConstraints": function(node, serviceIdentification) {
                serviceIdentification.accessConstraints = 
                    this.getChildValue(node);
            },
            "ServiceProvider": function(node, obj) {
                obj.serviceProvider = {};
                this.readChildNodes(node, obj.serviceProvider);
            },
            "ProviderName": function(node, serviceProvider) {
                serviceProvider.providerName = this.getChildValue(node);
            },
            "ProviderSite": function(node, serviceProvider) {
                serviceProvider.providerSite = this.getAttributeNS(node, 
                    this.namespaces.xlink, "href");
            },
            "ServiceContact": function(node, serviceProvider) {
                serviceProvider.serviceContact = {};
                this.readChildNodes(node, serviceProvider.serviceContact);
            },
            "IndividualName": function(node, serviceContact) {
                serviceContact.individualName = this.getChildValue(node);
            },
            "PositionName": function(node, serviceContact) {
                serviceContact.positionName = this.getChildValue(node);
            },
            "ContactInfo": function(node, serviceContact) {
                serviceContact.contactInfo = {};
                this.readChildNodes(node, serviceContact.contactInfo);
            },
            "Phone": function(node, contactInfo) {
                contactInfo.phone = {};
                this.readChildNodes(node, contactInfo.phone);
            },
            "Voice": function(node, phone) {
                phone.voice = this.getChildValue(node);
            },
            "Address": function(node, contactInfo) {
                contactInfo.address = {};
                this.readChildNodes(node, contactInfo.address);
            },
            "DeliveryPoint": function(node, address) {
                address.deliveryPoint = this.getChildValue(node);
            },
            "City": function(node, address) {
                address.city = this.getChildValue(node);
            },
            "AdministrativeArea": function(node, address) {
                address.administrativeArea = this.getChildValue(node);
            },
            "PostalCode": function(node, address) {
                address.postalCode = this.getChildValue(node);
            },
            "Country": function(node, address) {
                address.country = this.getChildValue(node);
            },
            "ElectronicMailAddress": function(node, address) {
                address.electronicMailAddress = this.getChildValue(node);
            },
            "Role": function(node, serviceContact) {
                serviceContact.role = this.getChildValue(node);
            },
            "OperationsMetadata": function(node, obj) {
                obj.operationsMetadata = {};
                this.readChildNodes(node, obj.operationsMetadata);
            },
            "Operation": function(node, operationsMetadata) {
                var name = node.getAttribute("name");
                operationsMetadata[name] = {};
                this.readChildNodes(node, operationsMetadata[name]);
            },
            "DCP": function(node, operation) {
                operation.dcp = {};
                this.readChildNodes(node, operation.dcp);
            },
            "HTTP": function(node, dcp) {
                dcp.http = {};
                this.readChildNodes(node, dcp.http);
            },
            "Get": function(node, http) {
                if (!http.get) {
                    http.get = [];
                }
                var obj = {
                    url: this.getAttributeNS(node, this.namespaces.xlink, "href")
                };
                this.readChildNodes(node, obj);
                http.get.push(obj);
            },
            "Post": function(node, http) {
                if (!http.post) {
                    http.post = [];
                }
                var obj = {
                    url: this.getAttributeNS(node, this.namespaces.xlink, "href")
                };
                this.readChildNodes(node, obj);
                http.post.push(obj);
            },
            "Parameter": function(node, operation) {
                if (!operation.parameters) {
                    operation.parameters = {};
                }
                var name = node.getAttribute("name");
                operation.parameters[name] = {};
                this.readChildNodes(node, operation.parameters[name]);
            },
            "Constraint": function(node, obj) {
                if (!obj.constraints) {
                    obj.constraints = {};
                }
                var name = node.getAttribute("name");
                obj.constraints[name] = {};
                this.readChildNodes(node, obj.constraints[name]);
            },
            "Value": function(node, allowedValues) {
                allowedValues[this.getChildValue(node)] = true;
            },
            "OutputFormat": function(node, obj) {
                obj.formats.push({value: this.getChildValue(node)});
                this.readChildNodes(node, obj);
            },
            "WGS84BoundingBox": function(node, obj) {
                var boundingBox = {};
                boundingBox.crs = node.getAttribute("crs");
                if (obj.BoundingBox) {
                    obj.BoundingBox.push(boundingBox);
                } else {
                    obj.projection = boundingBox.crs;
                    boundingBox = obj;
               }
               this.readChildNodes(node, boundingBox);
            },
            "BoundingBox": function(node, obj) {
                // FIXME: We consider that BoundingBox is the same as WGS84BoundingBox
                // LowerCorner = "min_x min_y"
                // UpperCorner = "max_x max_y"
                // It should normally depend on the projection
                this.readers['ows']['WGS84BoundingBox'].apply(this, [node, obj]);
            },
            "LowerCorner": function(node, obj) {
                var str = this.getChildValue(node).replace(
                    this.regExes.trimSpace, "");
                str = str.replace(this.regExes.trimComma, ",");
                var pointList = str.split(this.regExes.splitSpace);
                obj.left = pointList[0];
                obj.bottom = pointList[1];
            },
            "UpperCorner": function(node, obj) {
                var str = this.getChildValue(node).replace(
                    this.regExes.trimSpace, "");
                str = str.replace(this.regExes.trimComma, ",");
                var pointList = str.split(this.regExes.splitSpace);
                obj.right = pointList[0];
                obj.top = pointList[1];
                var southWest = L.latLng(obj.bottom,obj.left);
                var northEast = L.latLng(obj.top,obj.right);
                obj.bounds = L.latLngBounds(southWest, northEast);
                delete obj.left;
                delete obj.bottom;
                delete obj.right;
                delete obj.top;
            },
            "Language": function(node, obj) {
                obj.language = this.getChildValue(node);
            }
        }
    },

    writers: {
        "ows": {
            "BoundingBox": function(options, nodeName) {
                var node = this.createElementNSPlus(nodeName || "ows:BoundingBox", {
                    attributes: {
                        crs: options.projection
                    }
                });
                this.writeNode("ows:LowerCorner", options, node);
                this.writeNode("ows:UpperCorner", options, node);
                return node;
            },
            "LowerCorner": function(options) {
                var node = this.createElementNSPlus("ows:LowerCorner", {
                    value: options.bounds.left + " " + options.bounds.bottom });
                return node;
            },
            "UpperCorner": function(options) {
                var node = this.createElementNSPlus("ows:UpperCorner", {
                    value: options.bounds.right + " " + options.bounds.top });
                return node;
            },
            "Identifier": function(identifier) {
                var node = this.createElementNSPlus("ows:Identifier", {
                    value: identifier });
                return node;
            },
            "Title": function(title) {
                var node = this.createElementNSPlus("ows:Title", {
                    value: title });
                return node;
            },
            "Abstract": function(abstractValue) {
                var node = this.createElementNSPlus("ows:Abstract", {
                    value: abstractValue });
                return node;
            },
            "OutputFormat": function(format) {
                var node = this.createElementNSPlus("ows:OutputFormat", {
                    value: format });
                return node;
            }
        }
    }
});L.Format.OWSCommon.v1_1_0 = L.Format.OWSCommon.v1.extend({

    namespaces: {
        ows: "http://www.opengis.net/ows/1.1",
        xlink: "http://www.w3.org/1999/xlink"
    },    
    
    readers: {
        "ows": L.FormatUtil.applyDefaults({
            "ExceptionReport": function(node, obj) {
                obj.exceptionReport = {
                    version: node.getAttribute('version'),
                    language: node.getAttribute('xml:lang'),
                    exceptions: []
                };
                this.readChildNodes(node, obj.exceptionReport);
            },
            "AllowedValues": function(node, parameter) {
                parameter.allowedValues = {};
                this.readChildNodes(node, parameter.allowedValues);
            },
            "AnyValue": function(node, parameter) {
                parameter.anyValue = true;
            },
            "DataType": function(node, parameter) {
                parameter.dataType = this.getChildValue(node);
            },
            "Range": function(node, allowedValues) {
                allowedValues.range = {};
                this.readChildNodes(node, allowedValues.range);
            },
            "MinimumValue": function(node, range) {
                range.minValue = this.getChildValue(node);
            },
            "MaximumValue": function(node, range) {
                range.maxValue = this.getChildValue(node);
            },
            "Identifier": function(node, obj) {
                obj.identifier = this.getChildValue(node);
            },
            "SupportedCRS": function(node, obj) {
                obj.supportedCRS = this.getChildValue(node);
            }
        }, L.Format.OWSCommon.v1.prototype.readers["ows"])
    },

    writers: {
        "ows": L.FormatUtil.applyDefaults({
            "Range": function(range) {
                var node = this.createElementNSPlus("ows:Range", {
                    attributes: {
                        'ows:rangeClosure': range.closure
                    }
                });
                this.writeNode("ows:MinimumValue", range.minValue, node);
                this.writeNode("ows:MaximumValue", range.maxValue, node);
                return node;
            },
            "MinimumValue": function(minValue) {
                var node = this.createElementNSPlus("ows:MinimumValue", {
                    value: minValue
                });
                return node;
            },
            "MaximumValue": function(maxValue) {
                var node = this.createElementNSPlus("ows:MaximumValue", {
                    value: maxValue
                });
                return node;
            },
            "Value": function(value) {
                var node = this.createElementNSPlus("ows:Value", {
                    value: value
                });
                return node;
            }
        }, L.Format.OWSCommon.v1.prototype.writers["ows"])
    }

});L.Format.WMTSCapabilities.v1_0_0 = L.Format.OWSCommon.v1_1_0.extend({
    version: "1.0.0",

    namespaces: {
        ows: "http://www.opengis.net/ows/1.1",
        wmts: "http://www.opengis.net/wmts/1.0",
        xlink: "http://www.w3.org/1999/xlink"
    },    
    
    yx: null,

    defaultPrefix: "wmts",

    initialize: function(options) {
    	L.Format.XML.prototype.initialize.apply(this, [options]);
        this.options = options;
        var yx = L.extend(
            {}, L.Format.WMTSCapabilities.prototype.yx
        );
        this.yx = L.extend(yx, this.yx);
    },

    read: function(data) {
        if(typeof data == "string") {
            data = L.Format.XML.prototype.read.apply(this, [data]);
        }
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }
        var capabilities = {};
        this.readNode(data, capabilities);
        capabilities.version = this.version;
        return capabilities;
    },

    readers: {        
        "wmts": {
            "Capabilities": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "Contents": function(node, obj) {
                obj.contents = {};                
                obj.contents.layers = [];
                obj.contents.tileMatrixSets = {};                
                this.readChildNodes(node, obj.contents);
            },
            "Layer": function(node, obj) {
                var layer = {
                    styles: [],
                    formats: [],
                    dimensions: [],
                    tileMatrixSetLinks: []
                };
                layer.layers = [];
                this.readChildNodes(node, layer);
                obj.layers.push(layer);
            },
            "Style": function(node, obj) {
                var style = {};
                style.isDefault = (node.getAttribute("isDefault") === "true");
                this.readChildNodes(node, style);
                obj.styles.push(style);
            },
            "Format": function(node, obj) {
                obj.formats.push(this.getChildValue(node)); 
            },
            "TileMatrixSetLink": function(node, obj) {
                var tileMatrixSetLink = {};
                this.readChildNodes(node, tileMatrixSetLink);
                obj.tileMatrixSetLinks.push(tileMatrixSetLink);
            },
            "TileMatrixSet": function(node, obj) {
                // node could be child of wmts:Contents or wmts:TileMatrixSetLink
                // duck type wmts:Contents by looking for layers
                if (obj.layers) {
                    // TileMatrixSet as object type in schema
                    var tileMatrixSet = {
                        matrixIds: []
                    };
                    this.readChildNodes(node, tileMatrixSet);
                    obj.tileMatrixSets[tileMatrixSet.identifier] = tileMatrixSet;
                } else {
                    // TileMatrixSet as string type in schema
                    obj.tileMatrixSet = this.getChildValue(node);
                }
            },
            "TileMatrix": function(node, obj) {
                var tileMatrix = {
                    supportedCRS: obj.supportedCRS
                };
                this.readChildNodes(node, tileMatrix);
                obj.matrixIds.push(tileMatrix);
            },
            "ScaleDenominator": function(node, obj) {
                obj.scaleDenominator = parseFloat(this.getChildValue(node)); 
            },
            "TopLeftCorner": function(node, obj) {                
                var topLeftCorner = this.getChildValue(node);
                var coords = topLeftCorner.split(" ");
                // decide on axis order for the given CRS
                var yx;
                if (obj.supportedCRS) {
                    // extract out version from URN
                    var crs = obj.supportedCRS.replace(
                        /urn:ogc:def:crs:(\w+):.+:(\w+)$/, 
                        "urn:ogc:def:crs:$1::$2"
                    );
                    yx = !!this.yx[crs];
                }
                if (yx) {
                    obj.topLeftCorner = L.latLng(
                    		coords[0], coords[1]
                    );
                } else {
                    obj.topLeftCorner = L.latLng(
                    		coords[1], coords[0]
                    );
                }
            },
            "TileWidth": function(node, obj) {
                obj.tileWidth = parseInt(this.getChildValue(node)); 
            },
            "TileHeight": function(node, obj) {
                obj.tileHeight = parseInt(this.getChildValue(node)); 
            },
            "MatrixWidth": function(node, obj) {
                obj.matrixWidth = parseInt(this.getChildValue(node)); 
            },
            "MatrixHeight": function(node, obj) {
                obj.matrixHeight = parseInt(this.getChildValue(node)); 
            },
            "ResourceURL": function(node, obj) {
                obj.resourceUrl = obj.resourceUrl || {};
                var resourceType = node.getAttribute("resourceType");
                if (!obj.resourceUrls) {
                    obj.resourceUrls = [];
                }
                var resourceUrl = obj.resourceUrl[resourceType] = {
                    format: node.getAttribute("format"),
                    template: node.getAttribute("template"),
                    resourceType: resourceType
                };
                obj.resourceUrls.push(resourceUrl);
            },
            // not used for now, can be added in the future though
            /*"Themes": function(node, obj) {
                obj.themes = [];
                this.readChildNodes(node, obj.themes);
            },
            "Theme": function(node, obj) {
                var theme = {};                
                this.readChildNodes(node, theme);
                obj.push(theme);
            },*/
            "WSDL": function(node, obj) {
                obj.wsdl = {};
                obj.wsdl.href = node.getAttribute("xlink:href");
                // TODO: other attributes of <WSDL> element                
            },
            "ServiceMetadataURL": function(node, obj) {
                obj.serviceMetadataUrl = {};
                obj.serviceMetadataUrl.href = node.getAttribute("xlink:href");
                // TODO: other attributes of <ServiceMetadataURL> element                
            },
            "LegendURL": function(node, obj) {
                obj.legend = {};
                obj.legend.href = node.getAttribute("xlink:href");
                obj.legend.format = node.getAttribute("format");
            },
            "Dimension": function(node, obj) {
                var dimension = {values: []};
                this.readChildNodes(node, dimension);
                obj.dimensions.push(dimension);
            },
            "Default": function(node, obj) {
                obj["default"] = this.getChildValue(node);
            },
            "Value": function(node, obj) {
                obj.values.push(this.getChildValue(node));
            }
        },
        "ows": L.Format.OWSCommon.v1_1_0.prototype.readers["ows"]
    }
});/**
 * @class
 * @classdesc WMS XML 解析类
 * @alias L.Format.WMSCapabilities
 * @extends L.Format.XML.VersionedOGC
 */
L.Format.WMSCapabilities = L.Format.XML.VersionedOGC.extend({
	name: "WMSCapabilities",
	defaultVersion: "1.1.1"
    
});L.Format.WMSCapabilities.v1 = L.Format.XML.extend({
    
    namespaces: {
        wms: "http://www.opengis.net/wms",
        xlink: "http://www.w3.org/1999/xlink",
        xsi: "http://www.w3.org/2001/XMLSchema-instance"
    },

    defaultPrefix: "wms",
    
    read: function(data) {
        if(typeof data == "string") {
            data = L.Format.XML.prototype.read.apply(this, [data]);
        }
        var raw = data;
        if(data && data.nodeType == 9) {
            data = data.documentElement;
        }
        var capabilities = {};
        this.readNode(data, capabilities);
        return capabilities;
    },

    readers: {
        "wms": {
            "Service": function(node, obj) {
                obj.service = {};
                this.readChildNodes(node, obj.service);
            },
            "Name": function(node, obj) {
                obj.name = this.getChildValue(node);
            },
            "Title": function(node, obj) {
                obj.title = this.getChildValue(node);
            },
            "Abstract": function(node, obj) {
                obj["abstract"] = this.getChildValue(node);
            },
            "BoundingBox": function(node, obj) {
                var bbox = {};
                bbox.bbox = [
                    parseFloat(node.getAttribute("minx")),
                    parseFloat(node.getAttribute("miny")),
                    parseFloat(node.getAttribute("maxx")),
                    parseFloat(node.getAttribute("maxy"))
                ];
                var res = {
                    x: parseFloat(node.getAttribute("resx")),
                    y: parseFloat(node.getAttribute("resy"))
                };

                if (! (isNaN(res.x) && isNaN(res.y))) {
                    bbox.res = res;
                }
                // return the bbox so that descendant classes can set the
                // CRS and SRS and add it to the obj
                return bbox;
            },
            "OnlineResource": function(node, obj) {
                obj.href = this.getAttributeNS(node, this.namespaces.xlink, 
                    "href");
            },
            "ContactInformation": function(node, obj) {
                obj.contactInformation = {};
                this.readChildNodes(node, obj.contactInformation);
            },
            "ContactPersonPrimary": function(node, obj) {
                obj.personPrimary = {};
                this.readChildNodes(node, obj.personPrimary);
            },
            "ContactPerson": function(node, obj) {
                obj.person = this.getChildValue(node);
            },
            "ContactOrganization": function(node, obj) {
                obj.organization = this.getChildValue(node);
            },
            "ContactPosition": function(node, obj) {
                obj.position = this.getChildValue(node);
            },
            "ContactAddress": function(node, obj) {
                obj.contactAddress = {};
                this.readChildNodes(node, obj.contactAddress);
            },
            "AddressType": function(node, obj) {
                obj.type = this.getChildValue(node);
            },
            "Address": function(node, obj) {
                obj.address = this.getChildValue(node);
            },
            "City": function(node, obj) {
                obj.city = this.getChildValue(node);
            },
            "StateOrProvince": function(node, obj) {
                obj.stateOrProvince = this.getChildValue(node);
            },
            "PostCode": function(node, obj) {
                obj.postcode = this.getChildValue(node);
            },
            "Country": function(node, obj) {
                obj.country = this.getChildValue(node);
            },
            "ContactVoiceTelephone": function(node, obj) {
                obj.phone = this.getChildValue(node);
            },
            "ContactFacsimileTelephone": function(node, obj) {
                obj.fax = this.getChildValue(node);
            },
            "ContactElectronicMailAddress": function(node, obj) {
                obj.email = this.getChildValue(node);
            },
            "Fees": function(node, obj) {
                var fees = this.getChildValue(node);
                if (fees && fees.toLowerCase() != "none") {
                    obj.fees = fees;
                }
            },
            "AccessConstraints": function(node, obj) {
                var constraints = this.getChildValue(node);
                if (constraints && constraints.toLowerCase() != "none") {
                    obj.accessConstraints = constraints;
                }
            },
            "Capability": function(node, obj) {
                obj.capability = {
                    nestedLayers: [],
                    layers: []
                };
                this.readChildNodes(node, obj.capability);
            },
            "Request": function(node, obj) {
                obj.request = {};
                this.readChildNodes(node, obj.request);
            },
            "GetCapabilities": function(node, obj) {
                obj.getcapabilities = {formats: []};
                this.readChildNodes(node, obj.getcapabilities);
            },
            "Format": function(node, obj) {
                if (L.Util.isArray(obj.formats)) {
                    obj.formats.push(this.getChildValue(node));
                } else {
                    obj.format = this.getChildValue(node);
                }
            },
            "DCPType": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "HTTP": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "Get": function(node, obj) {
                obj.get = {};
                this.readChildNodes(node, obj.get);
                // backwards compatibility
                if (!obj.href) {
                    obj.href = obj.get.href;
                }
            },
            "Post": function(node, obj) {
                obj.post = {};
                this.readChildNodes(node, obj.post);
                // backwards compatibility
                if (!obj.href) {
                    obj.href = obj.get.href;
                }
            },
            "GetMap": function(node, obj) {
                obj.getmap = {formats: []};
                this.readChildNodes(node, obj.getmap);
            },
            "GetFeatureInfo": function(node, obj) {
                obj.getfeatureinfo = {formats: []};
                this.readChildNodes(node, obj.getfeatureinfo);
            },
            "Exception": function(node, obj) {
                obj.exception = {formats: []};
                this.readChildNodes(node, obj.exception);
            },
            "Layer": function(node, obj) {
                var parentLayer, capability;
                if (obj.capability) {
                    capability = obj.capability;
                    parentLayer = obj;
                } else {
                    capability = obj;
                }
                var attrNode = node.getAttributeNode("queryable");
                var queryable = (attrNode && attrNode.specified) ? 
                    node.getAttribute("queryable") : null;
                attrNode = node.getAttributeNode("cascaded");
                var cascaded = (attrNode && attrNode.specified) ?
                    node.getAttribute("cascaded") : null;
                attrNode = node.getAttributeNode("opaque");
                var opaque = (attrNode && attrNode.specified) ?
                    node.getAttribute('opaque') : null;
                var noSubsets = node.getAttribute('noSubsets');
                var fixedWidth = node.getAttribute('fixedWidth');
                var fixedHeight = node.getAttribute('fixedHeight');
                var parent = parentLayer || {},
                    extend = L.Util.extend;
                var layer = {
                    nestedLayers: [],
                    styles: parentLayer ? [].concat(parentLayer.styles) : [],
                    srs: parentLayer ? extend({}, parent.srs) : {}, 
                    metadataURLs: [],
                    bbox: parentLayer ? extend({}, parent.bbox) : {},
                    llbbox: parent.llbbox,
                    dimensions: parentLayer ? extend({}, parent.dimensions) : {},
                    authorityURLs: parentLayer ? extend({}, parent.authorityURLs) : {},
                    identifiers: {},
                    keywords: [],
                    queryable: (queryable && queryable !== "") ? 
                        (queryable === "1" || queryable === "true" ) :
                        (parent.queryable || false),
                    cascaded: (cascaded !== null) ? parseInt(cascaded) :
                        (parent.cascaded || 0),
                    opaque: opaque ? 
                        (opaque === "1" || opaque === "true" ) :
                        (parent.opaque || false),
                    noSubsets: (noSubsets !== null) ? 
                        (noSubsets === "1" || noSubsets === "true" ) :
                        (parent.noSubsets || false),
                    fixedWidth: (fixedWidth != null) ? 
                        parseInt(fixedWidth) : (parent.fixedWidth || 0),
                    fixedHeight: (fixedHeight != null) ? 
                        parseInt(fixedHeight) : (parent.fixedHeight || 0),
                    minScale: parent.minScale,
                    maxScale: parent.maxScale,
                    attribution: parent.attribution
                };
                obj.nestedLayers.push(layer);
                layer.capability = capability;
                this.readChildNodes(node, layer);
                delete layer.capability;
                if(layer.name) {
                    var parts = layer.name.split(":"),
                        request = capability.request,
                        gfi = request.getfeatureinfo;
                    if(parts.length > 0) {
                        layer.prefix = parts[0];
                    }
                    capability.layers.push(layer);
                    if (layer.formats === undefined) {
                        layer.formats = request.getmap.formats;
                    }
                    if (layer.infoFormats === undefined && gfi) {
                        layer.infoFormats = gfi.formats;
                    }
                }
            },
            "Attribution": function(node, obj) {
                obj.attribution = {};
                this.readChildNodes(node, obj.attribution);
            },
            "LogoURL": function(node, obj) {
                obj.logo = {
                    width: node.getAttribute("width"),
                    height: node.getAttribute("height")
                };
                this.readChildNodes(node, obj.logo);
            },
            "Style": function(node, obj) {
                var style = {};
                obj.styles.push(style);
                this.readChildNodes(node, style);
            },
            "LegendURL": function(node, obj) {
                var legend = {
                    width: node.getAttribute("width"),
                    height: node.getAttribute("height")
                };
                obj.legend = legend;
                this.readChildNodes(node, legend);
            },
            "MetadataURL": function(node, obj) {
                var metadataURL = {type: node.getAttribute("type")};
                obj.metadataURLs.push(metadataURL);
                this.readChildNodes(node, metadataURL);
            },
            "DataURL": function(node, obj) {
                obj.dataURL = {};
                this.readChildNodes(node, obj.dataURL);
            },
            "FeatureListURL": function(node, obj) {
                obj.featureListURL = {};
                this.readChildNodes(node, obj.featureListURL);
            },
            "AuthorityURL": function(node, obj) {
                var name = node.getAttribute("name");
                var authority = {};
                this.readChildNodes(node, authority);
                obj.authorityURLs[name] = authority.href;
            },
            "Identifier": function(node, obj) {
                var authority = node.getAttribute("authority");
                obj.identifiers[authority] = this.getChildValue(node);
            },
            "KeywordList": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "SRS": function(node, obj) {
                obj.srs[this.getChildValue(node)] = true;
            }
        }
    }

});L.Format.WMSCapabilities.v1_1 = L.Format.WMSCapabilities.v1.extend({
    
    readers: {
        "wms": L.FormatUtil.applyDefaults({
            "WMT_MS_Capabilities": function(node, obj) {
                this.readChildNodes(node, obj);
            },
            "Keyword": function(node, obj) {
                if (obj.keywords) {
                    obj.keywords.push(this.getChildValue(node));
                }
            },
            "DescribeLayer": function(node, obj) {
                obj.describelayer = {formats: []};
                this.readChildNodes(node, obj.describelayer);
            },
            "GetLegendGraphic": function(node, obj) {
                obj.getlegendgraphic = {formats: []};
                this.readChildNodes(node, obj.getlegendgraphic);
            },
            "GetStyles": function(node, obj) {
                obj.getstyles = {formats: []};
                this.readChildNodes(node, obj.getstyles);
            },
            "PutStyles": function(node, obj) {
                obj.putstyles = {formats: []};
                this.readChildNodes(node, obj.putstyles);
            },
            "UserDefinedSymbolization": function(node, obj) {
                var userSymbols = {
                    supportSLD: parseInt(node.getAttribute("SupportSLD")) == 1,
                    userLayer: parseInt(node.getAttribute("UserLayer")) == 1,
                    userStyle: parseInt(node.getAttribute("UserStyle")) == 1,
                    remoteWFS: parseInt(node.getAttribute("RemoteWFS")) == 1
                };
                obj.userSymbols = userSymbols;
            },
            "LatLonBoundingBox": function(node, obj) {
                obj.llbbox = [
                    parseFloat(node.getAttribute("minx")),
                    parseFloat(node.getAttribute("miny")),
                    parseFloat(node.getAttribute("maxx")),
                    parseFloat(node.getAttribute("maxy"))
                ];
            },
            "BoundingBox": function(node, obj) {
                var bbox = L.Format.WMSCapabilities.v1.prototype.readers["wms"].BoundingBox.apply(this, [node, obj]);
                bbox.srs  = node.getAttribute("SRS");
                obj.bbox[bbox.srs] = bbox;
            },
            "ScaleHint": function(node, obj) {
                
            },
            "Dimension": function(node, obj) {
                var name = node.getAttribute("name").toLowerCase();
                var dim = {
                    name: name,
                    units: node.getAttribute("units"),
                    unitsymbol: node.getAttribute("unitSymbol")
                };
                obj.dimensions[dim.name] = dim;
            },
            "Extent": function(node, obj) {
                var name = node.getAttribute("name").toLowerCase();
                if (name in obj["dimensions"]) {
                    var extent = obj.dimensions[name];
                    extent.nearestVal = 
                        node.getAttribute("nearestValue") === "1";
                    extent.multipleVal = 
                        node.getAttribute("multipleValues") === "1";
                    extent.current = node.getAttribute("current") === "1";
                    extent["default"] = node.getAttribute("default") || "";
                    var values = this.getChildValue(node);
                    extent.values = values.split(",");
                }
            }
        }, L.Format.WMSCapabilities.v1.prototype.readers["wms"])
    }

});L.Format.WMSCapabilities.v1_1_1 = L.Format.WMSCapabilities.v1_1.extend({
    
    version: "1.1.1",
    
    readers: {
        "wms": L.FormatUtil.applyDefaults({
            "SRS": function(node, obj) {
                obj.srs[this.getChildValue(node)] = true;
            }
        }, L.Format.WMSCapabilities.v1_1.prototype.readers["wms"])
    }

});/**
 * @class
 * @classdesc 天地图驾车结果XML解析类
 * @alias L.Format.TRouteResultFormat
 * @extends L.Format.XML
 */
L.Format.TRouteResultFormat = L.Format.XML.extend({
	/**
     * @class 驾车查询结果解析类
     * @description 本类供内部调用，用户一般无需使用。
     * @constructor
     * @param {Object} data
     * @ignore
     */
    initialize: function(options) {
        L.Format.XML.prototype.initialize.apply(this, [options]);
    },

    /**
     * 读入服务端响应的XML内容并解析为JSON对象返回
     * @method L.Format.TRouteResultFormat#read
     * @param {String} data 服务端响应的XML
     * @return {Object} obj
     */
    read: function(data) {
        var result = null;

        if(typeof data == "string") {
            data = L.Format.XML.prototype.read.apply(this, [data]);
        }

        if(data && data.nodeType == 9) {
            result = {};
            var nodes = data.getElementsByTagName("result")[0].childNodes;
            for(var i=0; i<nodes.length; i++){
                var node = nodes[i];
                var nodeName = node.nodeName;
                if(this._resultPaser[nodeName]){
                    this._resultPaser[nodeName](node,result);
                }
            }
        }
        return result;
    },

    _resultPaser:{
        "parameters": function(node, obj){
            var nodes = node.childNodes;
            obj.parameters = {};
            for(var i=0; i<nodes.length; i++){
                var node = nodes[i];
                if(node.nodeName == "#text") continue;
                obj.parameters[node.nodeName] = node.text || node.textContent;
            }
        },
        "routes": function(node, obj){
            var attributes = node.attributes;
            var nodes = node.childNodes;
            obj.routes = {};

            for(var i=0; i<attributes.length; i++){
                var attribute = attributes[i];
                if(attribute.nodeName == "#text") continue;
                obj.routes[attribute.nodeName] = attribute.text || attribute.textContent;
            }

            for(var i=0; i<nodes.length; i++){
                if(!obj.routes.items){
                    obj.routes.items = [];
                }
                var node = nodes[i];
                if(node.nodeName == "#text") continue;
                var item = {}
                pase_item_label(node,item);
                obj.routes.items.push(item);
            }

            function pase_item_label(node, obj){
                var nodes = node.childNodes;
                for(var i=0; i<nodes.length; i++){
                	if(nodes[i].nodeName == "#text") continue;
                    obj[nodes[i].nodeName] = nodes[i].text || nodes[i].textContent;
                }
            }

        },
        "simple": function(node, obj){
            obj.simple = {};
            var nodes = node.childNodes;
            for(var i=0; i<nodes.length; i++){
                if(!obj.simple.items){
                    obj.simple.items = [];
                }
                var node = nodes[i];
                if(node.nodeName == "#text") continue;
                var item = {}
                pase_item_label(node,item);
                obj.simple.items.push(item);
            }

            function pase_item_label(node, obj){
                var nodes = node.childNodes;
                for(var i=0; i<nodes.length; i++){
                	if(nodes[i].nodeName == "#text") continue;
                    obj[nodes[i].nodeName] = nodes[i].text || nodes[i].textContent;
                }
            }
        },
        "distance": function(node, obj){
            obj.distance = node.text || node.textContent;
        },
        "duration": function(node, obj){
            obj.duration = node.text || node.textContent;
        },
        "routelatlon": function(node, obj){
            obj.routelatlon = node.text || node.textContent;
        },
        "mapinfo": function(node, obj){
            obj.mapinfo = {};
            var nodes = node.childNodes;
            for(var i=0; i<nodes.length; i++){
            	if(nodes[i].nodeName == "#text") continue;
                obj.mapinfo[nodes[i].nodeName] = nodes[i].text || nodes[i].textContent;
            }
        }
    }
});/**
 * @class
 * @classdesc 天地图驾车结果解析类，格式化JSON对象
 * @alias L.TRouteResult
 * @extends L.Class
 */
L.TRouteResult = L.Class.extend({
    data: null,

    //--parameters: null,

    orig: null,

    dest: null,

    startFeature: null,

    endFeature: null,

    routes: null,

    segmentFeatures: null,

    distance: null,

    duration: null,

    routelatlon: null,

    //--mapinfo: null,

    initialize: function(data) {
        if(data){
            this.data = data;
            for(var item in data){
                if(this._resultPaser[item]){
                    var fn = L.FormatUtil.bind(this._resultPaser[item],this);
                    fn(data[item]);
                }
            }
        }
    },
    lineStringToGeometry : function(str){
    	var points = [];
    	var lineArr = str.split(";");
    	for(var i=0;i<lineArr.length;i++){
    		if(lineArr[i] == "") continue;
    		var lonlatArr = lineArr[i].split(",");
    		var point = new L.LatLng(lonlatArr[1],lonlatArr[0]);
    		points.push(point);
    	}
    	var lineString = new L.Polyline(points);
    	return lineString;
    },
    _resultPaser:{
        "parameters": function(data){
        	var origs = data.orig.split(",");
        	var dests = data.dest.split(",");
            this.start = new L.LatLng(origs[1],origs[0]);
            this.end = new L.LatLng(dests[1],dests[0]);

            var p1 = new L.LatLng(this.start.lat,this.start.lng);
            this.startFeature = new L.Marker(p1);

            var p2 = new L.LatLng(this.end.lat,this.end.lng);
            this.endFeature = new L.Marker(p2);
        },
        "routes": function(data){
            this.routes = data;
        },
        "simple": function(data){
            this.simple = data;
            if(!data.items){return;}
            var items = data.items;
            var features = [];
            for(var i=0; i<items.length; i++){
                var linestring = this.lineStringToGeometry(items[i].streetLatLon);
                L.setOptions(linestring, items[i]);
                features.push(linestring);
            }
            this.simple.segmentFeatures = features;
        },
        "distance": function(data){
            this.distance = data;
        },
        "duration": function(data){
            this.duration = data;
        },
        "routelatlon": function(data){
            this.routelatlon = data;
        },
        "mapinfo": function(data){
            this.mapinfo = data;
        }
    }
});L.WMTSUtil = {
	getCapabilities: function(url, fnSuccess, fnFaisule){
		var param = {
			SERVICE : "WMTS",
			VERSION : "1.0.0",
			REQUEST : "GetCapabilities"	
		};
		L.get(L.ProxyHost + url,param,function(result){
			try{
				var doc = result;
				var format = new L.Format.WMTSCapabilities();
				var capabilities = format.read(doc);
				if (fnSuccess) {
					fnSuccess(capabilities);
				}
			}catch(e){
				if (fnFaisule) {
					fnFaisule(e);
				}
			}
		});
	},
	getUnitByEpsgCode: function(epsg){
		var epsgs = {
			"degrees" : ["4490","4326","4610"],
			"m" : ["3857","900913","102100"]
		};
		var lastNum = epsg.lastIndexOf(":");
		epsg = epsg.substring(lastNum + 1);
		var degreesStr = epsgs["degrees"].join(",");
		if(degreesStr.indexOf(epsg) != -1){
			return "degrees";
		}else{
			return "m";
		}
	},
	getCapAndUnit : function(url,callback){
		var fnSuccess = function(cap){
			cap.serviceURL = url;
			var contents = cap.contents;
			var matrixSets = contents.tileMatrixSets;

			var layers = contents.layers;
			var lastLayer = layers[layers.length-1];
			var strMatrixSet = '';
			var supportedCRS = '';
			if (lastLayer.tileMatrixSetLinks.length > 0) {
				var len = lastLayer.tileMatrixSetLinks.length;
				strMatrixSet = lastLayer.tileMatrixSetLinks[len-1].tileMatrixSet;
				supportedCRS = matrixSets[strMatrixSet].supportedCRS;
			}
			var unit = L.WMTSUtil.getUnitByEpsgCode(supportedCRS);
			callback(cap,unit);
		};
		var fnFaisule = function(){};
		this.getCapabilities(url, fnSuccess, fnFaisule);
	},
	getLayer : function(capabilities) {
		try {
			var url = capabilities.serviceURL;
			var contents = capabilities.contents;
			var matrixSets = contents.tileMatrixSets;
			
			var layers = contents.layers;
			var layematrixIdsr = null;
			var networkLayer = null;
			for (var j = layers.length - 1; j >= 0; j--) {
				var strStyle = 'Default';
				if (layers[j].styles.length > 0) {
					strStyle = layers[j].styles[0].identifier;
				}
				// 如果没有指定format，读取支持的第一个format
				var formats = layers[j].formats[0];
				
				var strMatrixSet = '';
				if (layers[j].tileMatrixSetLinks.length > 0) {
					var len = layers[j].tileMatrixSetLinks.length;
					strMatrixSet = layers[j].tileMatrixSetLinks[len-1].tileMatrixSet;
				}
				var matrixs = contents.tileMatrixSets[strMatrixSet].matrixIds;
				var tileOrigin = matrixs[0].topLeftCorner;
				var matrixIds = [];
				for (var k = 0; k < matrixs.length; k++) {
					matrixIds.push({
						identifier : matrixs[k].identifier,
						scaleDenominator : matrixs[k].scaleDenominator,
						topLeftCorner : tileOrigin
					})
				}
				var bounds = capabilities.contents.layers[0].bounds;
				var layer = new L.TileLayer.WMTS(url,{
	    			tileSize:256,
	    			layer: layers[j].identifier,
	    			style: strStyle,
	    			tilematrixSet: strMatrixSet,
	    			format: formats,
	    			matrixIds: matrixIds,
	    			fullExtent : bounds
	            });
				return layer;
			}
		} catch (e) {
			throw e;
		}
	}
};/**
 * @class
 * @classdesc 正逆向地理编码处理类
 * @constructs
 * @alias L.Geocoder
 * @param {Object} options - 初始化参数
 * @property {object}   options      - 地理编码参数
 * @property {String}   options.url  - 地理编码服务地址
 * @example 
 * var geocoder = new L.Geocoder();
 * var latlng = new L.LatLng(lat,lng);
 * geocoder.getLocation(start,function(res){
 * 
 * })
 * @extends L.Class
 */
L.Geocoder = L.Class.extend({
	options: {
		url: null
	},
	initialize: function(options){
		L.setOptions(this, options);
	},
	/**
    * 正地理编码查询
    * @method L.Geocoder#getLatLngInfo
    * @param {object}   param - 查询参数address、city、format属性
    * @param {Function} callback - 回调函数
    */
	getLatLngInfo: function(param,callback){
		this._getLatLngInfo(param,callback);
	},
	/**
    * 逆地理编码查询
    * @method L.Geocoder#getLocation
    * @param {L.LatLng} latlng   - 坐标位置
    * @param {Function} callback - 回调函数
    */
	getLocation: function(latlng,callback){
		this._getLocation(latlng,callback);
	},
	_getLatLngInfo: function(param,callback){
		var url = this.options.url;
		if(!url) return false;
		var address = param.address;
		var city = param.city;
		var format = param.format || "json";
		url = url + "?format=" + format +"&address=" + address;
		if(city){
			url = url + "&city=" + city;
		}
		if(format == "json"){
			L.jsonp(url,null,function(result){
				if(callback && typeof(callback) == "function"){
					callback(result);
				}
			});
		}else{
			L.get(url,null,function(result){
				if(callback && typeof(callback) == "function"){
					callback(result);
				}
			});
		}
	},
	_getLocation: function(latlng,callback){
		var url = this.options.url;
		if(!url) return false;
		url = url + "?format=json&lon=" + latlng.lng + "&lat=" + latlng.lat;
		L.jsonp(url,null,function(result){
			if(callback && typeof(callback) == "function"){
				callback(result);
			}
		});
	}
});/**
 * @class
 * @classdesc 天地图逆地理编码处理类
 * @constructs
 * @alias L.TGeocoder
 * @param {Object} options - 初始化参数
 * @property {object}   options      - 地理编码参数
 * @property {String}   options.url  - 地理编码服务地址
 * @example 
 * var tgeocoder = new L.TGeocoder();
 * var latlng = new L.LatLng(lat,lng);
 * tgeocoder.getLocation(start,function(res){
 * 
 * })
 * @extends L.Class
 */
L.TGeocoder = L.Class.extend({
	options: {
		url: "http://www.tianditu.com/query.shtml"
	},
	initialize: function(options){
		L.setOptions(this, options);
	},
	/**
    * 逆地理编码查询
    * @method L.TGeocoder#getLocation
    * @param {L.LatLng} latlng   - 坐标位置
    * @param {Function} callback - 回调函数
    */
	getLocation: function(latlng,callback){
		this._getLocation(latlng,callback);
	},
	_getLocation: function(latlng,callback){
		var url = this.options.url;
		if(!url) return false;
		var requestParams = {};
    	requestParams.lon = latlng.lng;
    	requestParams.lat = latlng.lat;
    	requestParams.appkey = "8a7b9aac0db21f9dd995e61a14685f05";
    	requestParams.ver = 1;
    	
    	var allParams = ["lon","lat","appkey","ver"];
    	var queryStr = "?postStr=";
		var postStrArr = [];
		for(var i=0;i<allParams.length;i++){
			var item = allParams[i];
			if(item in requestParams){
				postStrArr.push("'" + item + "':" + "'" + requestParams[item] + "'");
			}
		}
		queryStr += "{" +postStrArr.join(",")+ "}";
		queryStr += "&type=geocode";
		var that = this;
		L.get(L.ProxyHost + url + queryStr,null,function(result){
			try{
				var res = JSON.parse(result);
				if(callback && typeof(callback) == "function"){
					callback(res);
				}
			}catch(e){
				if(callback && typeof(callback) == "function"){
					callback(result);
				}
			}
		});
	}
});	/**
 * @class
 * @classdesc Html5 位置定位
 * @constructs
 * @alias L.Geolocation
 * @param {Object} options - 初始化参数
 * @property {object}   options      - 位置定位参数
 * @property {String}   options.enableHighAccuracy  - 指示浏览器获取高精度的位置，默认为false
 * @property {number}   options.timeout  - 指定获取地理位置的超时时间，默认不限时，单位为毫秒，默认5000毫秒
 * @property {number}   options.maximumAge  - 最长有效期，在重复获取地理位置时，此参数指定多久再次获取位置，默认3000
 * @example 
 * var geolocation = new L.Geolocation();
 * geolocation.getCurrentPosition(function(res){
 *    L.marker([res.latlng.lat, res.latlng.lng]).addTo(map);
 * })
 * @extends L.Class
 */
L.Geolocation = L.Class.extend({
	options: {
		enableHighAccuracy: false,
		timeout: 5000,
		maximumAge: 3000
	},
	initialize: function(options){
		L.setOptions(this, options);
	},
	/**
    * 获取当前位置信息
    * @method L.Geolocation#getCurrentPosition
    * @param {Function} callback - 回调函数
    * @param {L.Geolocation.options} options - 位置定位参数
    */
	getCurrentPosition: function(callback,options){
		L.setOptions(this, options);
		if (navigator.geolocation) {
			var locationSuccess = function(position){
				var coords = position.coords;
				var latlng = new L.LatLng(coords.latitude,coords.longitude);
				var result = {
					latlng: latlng,
					status: "ok"
				}
				callback(result);
			};
			var locationError = function(error){
				var errorMsg = "";
				switch(error.code){
				    case error.PERMISSION_DENIED:
				    	errorMsg = "User denied the request for Geolocation.";
				      break;
				    case error.POSITION_UNAVAILABLE:
				    	errorMsg = "Location information is unavailable.";
				      break;
				    case error.TIMEOUT:
				    	errorMsg = "The request to get user location timed out.";
				      break;
				    case error.UNKNOWN_ERROR:
				    	errorMsg = "An unknown error occurred.";
				      break;
			    }
				var result = {
					latlng: null,
					status: "error",
					errorMsg: errorMsg
				}
				callback(result);
			};
		    navigator.geolocation.getCurrentPosition(locationSuccess, locationError,this.options);
		}else{
		    var errorMsg = "Your browser does not support Geolocation!";
		    var result = {
				latlng: null,
				status: "error",
				errorMsg: errorMsg
			}
		    callback(result);
		}
	}
});/**
 * @class
 * @classdesc 该类用于关键字检索、分类检索、位置检索
 * @constructs
 * @alias L.LocalSearch
 * @param {L.Map} map - 地图对象
 * @param {Object} options - 初始化参数
 * @property {object}   options                	 - 地名地址检索参数
 * @property {String}   options.url        		 - 检索服务地址
 * @property {number}   options.pageNum 		 - 当前页码
 * @property {number}   options.pageSize 		 - 每页显示条数
 * @property {Function} options.onSearchComplete - 检索成功回调函数
 * @property {object}   options.param 			 - 当前检索条件对象
 * @property {number}   options.resultType 		 - 结果类型，说明：
 * resultType=1  关键字检索；
 * resultType=2  关键字视野内检索；
 * resultType=3  关键字总数检索；
 * resultType=4  分类检索；
 * resultType=5  分类视野内检索；
 * resultType=6  分类总数检索；
 * resultType=7  按指定bounds关键字检索；
 * resultType=8  按指定bounds分类检索；
 * resultType=9  根据中心点、半径关键字周边检索；
 * resultType=10 根据中心点、半径分类周边检索；
 * resultType=11 距离附近最近的点检索。
 * @property {object}   options.currentResult 	 - 当前检索结果
 * @example 
 * var options = {
 *   onSearchComplete: function(result,type){
 *     
 *   }
 * };
 * var localSearch = new L.LocalSearch(map,options);
 * localSearch.search("学校",1);
 * @extends L.Class
 */
L.LocalSearch = L.Class.extend({
	options: {
		url: null,
		pageNum: 0,
		pageSize: 10,
		onSearchComplete: null,
		param: null,
		resultType: 0,
		currentResult: null
	},
	initialize: function(map,options){
		this.map = map;
		L.setOptions(this, options);
	},
	/**
    * 设置查询服务地址
    * @method L.LocalSearch#setUrl
    * @param {String} url - 服务地址
    */
	setUrl: function(url){
		this.options.url = url;
	},
	/**
    * 设置每页查询数目
    * @method L.LocalSearch#setPageSize
    * @param {number} pageSize - 每页条数
    */
	setPageSize: function(pageSize){
		this.options.pageSize = pageSize;
	},
	/**
    * 获取每页查询数目
    * @method L.LocalSearch#getPageSize
    * @return {number} pageSize - 每页条数
    */
	getPageSize: function(){
		return this.options.pageSize;
	},
	/**
    * 设置查询成功回调函数
    * @method L.LocalSearch#setSearchCompleteCallback
    * @param {function} fun - 回调函数
    */
	setSearchCompleteCallback: function(fun){
		this.options.onSearchComplete = fun;
	},
	/**
    * 关键字检索
    * @method L.LocalSearch#search
    * @param {string} keyword - 检索关键字
    * @param {number} type - 检索类型
    * type=1 表示普通关键字搜索；
	* type=2 表示视野内搜索；
	* type=3 表示总数搜索。
    */
	search: function(keyword,type){
		switch(type)
		{
			case 1:
				this.options.resultType = 1;
				this._search(keyword,null);
				break;
			case 2:
				this.options.resultType = 2;
				this._searchInView(keyword,null);
				break;
			case 3:
				this.options.resultType = 3;
				this._searchStatistics(keyword,null);
				break;
		}
	},
	/**
    * 分类检索
    * @method L.LocalSearch#searchBySort
    * @param {string} sort - 检索分类编码
    * @param {number} type - 检索类型
    * type=1 表示普通关键字搜索；
	* type=2 表示视野内搜索；
	* type=3 表示总数搜索。
    */
	searchBySort: function(sort,type){
		switch(type)
		{
			case 1:
				this.options.resultType = 4;
				this._search(null,sort);
				break;
			case 2:
				this.options.resultType = 5;
				this._searchInView(null,sort);
				break;
			case 3:
				this.options.resultType = 6;
				this._searchStatistics(null,sort);
				break;
		}
	},
	/**
    * 按指定bounds检索
    * @method L.LocalSearch#searchInBounds
    * @param {string} keyword - 检索关键字
    * @param {L.LatLngBounds} bounds - 检索范围
    */
	searchInBounds: function(keyword,bounds){
		this.options.resultType = 7;
		if(bounds instanceof L.LatLngBounds){
			bounds = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(',');
		}
		var pageNum = this.options.pageNum;
		var pageSize = this.options.pageSize;
		var param = {
			"keyword": keyword,
			"bounds": bounds,
			"pageNum": pageNum,
			"pageSize": pageSize
		};
		this.options.param = param;
		var url = this._queryParam(param);
		if(url){
			this._doQuery(url);
		}
	},
	/**
    * 按指定bounds检索
    * @method L.LocalSearch#searchInBoundsBySort
    * @param {string} sort - 检索分类编码
    * @param {L.LatLngBounds} bounds - 检索范围
    */
	searchInBoundsBySort: function(sort,bounds){
		this.options.resultType = 8;
		if(bounds instanceof L.LatLngBounds){
			bounds = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(',');
		}
		var pageNum = this.options.pageNum;
		var pageSize = this.options.pageSize;
		var param = {
			"sort": sort,
			"bounds": bounds,
			"pageNum": pageNum,
			"pageSize": pageSize
		};
		this.options.param = param;
		var url = this._queryParam(param);
		if(url){
			this._doQuery(url);
		}
	},
	/**
    * 根据中心点、半径周边检索
    * @method L.LocalSearch#searchNearby
    * @param {string} keyword - 检索关键字
    * @param {L.LatLng} center - 中心点
    * @param {float} radius - 搜索半径，单位米
    */
	searchNearby: function(keyword,center,radius){
		this.options.resultType = 9;
		var pageNum = this.options.pageNum;
		var pageSize = this.options.pageSize;
		var param = {
			"keyword": keyword,
			"center": center,
			"radius": radius,
			"pageNum": pageNum,
			"pageSize": pageSize
		};
		this.options.param = param;
		var url = this._queryBufferParam(param);
		if(url){
			this._doQuery(url);
		}
	},
	/**
    * 根据中心点、半径周边检索
    * @method L.LocalSearch#searchNearbyBySort
    * @param {string} sort - 检索分类编码
    * @param {L.LatLng} center - 中心点
    * @param {float} radius - 搜索半径，单位米
    */
	searchNearbyBySort: function(sort,center,radius){
		this.options.resultType = 10;
		var pageNum = this.options.pageNum;
		var pageSize = this.options.pageSize;
		var param = {
			"sort": sort,
			"center": center,
			"radius": radius,
			"pageNum": pageNum,
			"pageSize": pageSize
		};
		this.options.param = param;
		var url = this._queryBufferParam(param);
		if(url){
			this._doQuery(url);
		}
	},
	/**
    * 获取当前检索结果
    * @method L.LocalSearch#getResults
    * @return {object} currentResult - 检索结果
    */
	getResults: function(){
		return this.options.currentResult;
	},
	/**
    * 清除检索结果
    * @method L.LocalSearch#clearResults
    */
	clearResults: function(){
		this.options.currentResult = null;
		this.options.pageNum = 0;
	},
	/**
    * 获取结果总页数
    * @method L.LocalSearch#getTotalPage
    * @return {number} totalPage - 总页数
    */
	getTotalPage: function(){
		var totalPage;
		var result = this.options.currentResult;
		if(result){
			var totalCount = result.totalCount;
			if(totalCount && totalCount > 0){
				totalPage = Math.ceil(totalCount/this.options.pageSize) - 1;
			}
		}
		return totalPage;
	},
	/**
    * 检索首页
    * @method L.LocalSearch#firstPage
    */
	firstPage: function(){
		this.gotoPage(0);
	},
	/**
    * 检索下一页
    * @method L.LocalSearch#nextPage
    */
	nextPage: function(){
		var param = this.options.param;
		var pageNum = param.pageNum;
		this.gotoPage(pageNum+1);
	},
	/**
    * 检索上一页
    * @method L.LocalSearch#previousPage
    */
	previousPage: function(){
		var param = this.options.param;
		var pageNum = param.pageNum;
		this.gotoPage(pageNum-1);
	},
	/**
    * 检索最后一页
    * @method L.LocalSearch#lastPage
    */
	lastPage: function(){
		var param = this.options.param;
		var totalPage = this.getTotalPage();
		this.gotoPage(totalPage);
	},
	/**
    * 检索指定页码
    * @method L.LocalSearch#gotoPage
    * @param {number} pageNum - 指定页码
    */
	gotoPage: function(pageNum){
		var param = this.options.param;
		var totalPage = this.getTotalPage();
		if(param && totalPage){
			if(pageNum > totalPage){
				pageNum = totalPage;
			}else if(pageNum < 0){
				pageNum = 0;
			}
			param.pageNum = pageNum;
			if(param["radius"]){
				url = this._queryBufferParam(param);
			}else{
				url = this._queryParam(param);
			}
			if(url){
				this._doQuery(url);
			}
		}
	},
	/**
    * 检索距离当前位置最近的点
    * @method L.LocalSearch#searchNear
    * @param {L.LatLng} latlng - 当前位置
    */
	searchNear: function(latlng){
		this.options.resultType = 11;
		var url = this.options.url;
		if(!url) return false;
		url = url + '/nearest?location=' + latlng.lat + ',' + latlng.lng;
		var that = this;
		L.jsonp(url,null,function(result){
			if(that.options.onSearchComplete){
				that.options.onSearchComplete.call(that,result,that.options.resultType);
			}
		});
	},
	_doQuery: function(url){
		var that = this;
		L.jsonp(url,null,function(result){
			that.options.currentResult = result;
			if(that.options.onSearchComplete){
				that.options.onSearchComplete.call(that,result,that.options.resultType);
			}
		});
	},
	_search: function(keyword,sort){
		var pageNum = this.options.pageNum;
		var pageSize = this.options.pageSize;
		var param = {
			"keyword": keyword,
			"sort": sort,
			"pageNum": pageNum,
			"pageSize": pageSize
		};
		this.options.param = param;
		var url = this._queryParam(param);
		if(url){
			this._doQuery(url);
		}
	},
	_searchInView: function(keyword,sort){
		var bounds = this.map.getBounds();
		var bbox = [bounds.getSouth(), bounds.getWest(), bounds.getNorth(), bounds.getEast()].join(',');
		var pageNum = this.options.pageNum;
		var pageSize = this.options.pageSize;
		var param = {
			"keyword": keyword,
			"sort": sort,
			"bounds": bbox,
			"pageNum": pageNum,
			"pageSize": pageSize
		};
		this.options.param = param;
		var url = this._queryParam(param);
		if(url){
			this._doQuery(url);
		}
	},
	_searchStatistics: function(keyword,sort){
		var param = {
			"keyword": keyword,
			"sort": sort
		};
		var url = this._queryStatParam(param);
		if(url){
			this._doQuery(url);
		}
	},
	_queryParam: function(param){
		var url = this.options.url;
		if(!url) return false;
		var keyword = param.keyword;
		var type = param.sort;
		var bounds = param.bounds;
		var city = param.city;
		var pageNum = param.pageNum;
		var pageSize = param.pageSize;
		url = url + '/search?format=json&page_num=' + pageNum + '&page_size=' + pageSize;
		if(keyword){
			url += "&q="  + encodeURIComponent(keyword);
		}
		if(type){
			url += "&type="  + encodeURIComponent(type);
		}
		if(city){
			url += "&city="  + encodeURIComponent(city);
		}
		if(bounds){
			url += "&sq_type=bounds&bounds="  + encodeURIComponent(bounds);
		}
		return url;
	},
	_queryBufferParam: function(param,pageNum,pageSize){
		var url = this.options.url;
		if(!url) return false;
		var keyword = param.keyword;
		var type = param.sort;
		var radius = param.radius;
		var center = option.center;
		url = url + "/search?format=json";
		if(keyword){
			url += "&q="  + encodeURIComponent(keyword);
		}
		if(type){
			url += "&type="  + encodeURIComponent(type);
		}
		var pageNum = param.pageNum;
		var pageSize = param.pageSize;
		var addParams = "&page_num={page_num}&page_size={page_size}&sq_type=buffer&location={y},{x}&radius={r}"
						  .replace("{page_num}",pageNum)
						  .replace("{page_size}",pageSize)
			              .replace("{x}",center.lng)
			              .replace("{y}",center.lat)
		                  .replace("{r}",radius);
		url += addParams;
		return url;
	},
	_queryStatParam: function(param){
		var url = this.options.url;
		if(!url) return false;
		var keyword = param.keyword;
		var type = param.sort;
		url = url + '/statistic?';
		if(keyword){
			url += "&q="  + encodeURIComponent(keyword);
		}
		if(type){
			url += "&type="  + encodeURIComponent(type);
		}
		return url;
	}
});/**
 * @class
 * @classdesc 该类用于天地图关键字检索、分类检索、位置检索
 * @constructs
 * @alias L.TLocalSearch
 * @param {L.Map} map - 地图对象
 * @param {Object} options - 初始化参数
 * @property {object}   options                	 - 地名地址检索参数
 * @property {String}   options.url        		 - 检索服务地址
 * @property {number}   options.pageNum 		 - 当前页码
 * @property {number}   options.pageSize 		 - 每页显示条数
 * @property {Function} options.onSearchComplete - 检索成功回调函数
 * @property {object}   options.param 			 - 当前检索条件对象
 * @property {number}   options.resultType 		 - 结果类型，说明：
 * resultType=1  表示普通搜索；
 * resultType=2  表示视野内搜索；
 * resultType=4  表示普通建议词搜索；
 * resultType=5  表示公交规划建议词搜索；
 * resultType=7  表示 纯POI搜索(不搜公交线）；
 * resultType=10 表示拉框搜索。
 * @property {object}   options.currentResult 	 - 当前检索结果
 * @example 
 * var options = {
 *   onSearchComplete: function(result){
 *     
 *   }
 * };
 * var TlocalSearch = new L.TLocalSearch(map,options);
 * TlocalSearch.search("学校",1);
 * @extends L.Class
 */
L.TLocalSearch = L.Class.extend({
	options: {
		url: "http://www.tianditu.com/query.shtml",
		pageNum: 0,
		pageSize: 10,
		onSearchComplete: null,
		param: null,
		resultType: 0,
		currentResult: null
	},
	initialize: function(map,options){
		this.map = map;
		L.setOptions(this, options);
	},
	/**
    * 设置查询服务地址
    * @method L.TLocalSearch#setUrl
    * @param {String} url - 服务地址
    */
	setUrl: function(url){
		this.options.url = url;
	},
	/**
    * 设置每页查询数目
    * @method L.TLocalSearch#setPageSize
    * @param {number} pageSize - 每页条数
    */
	setPageSize: function(pageSize){
		this.options.pageSize = pageSize;
	},
	/**
    * 获取每页查询数目
    * @method L.TLocalSearch#getPageSize
    * @return {number} pageSize - 每页条数
    */
	getPageSize: function(){
		return this.options.pageSize;
	},
	/**
    * 设置查询成功回调函数
    * @method L.TLocalSearch#setSearchCompleteCallback
    * @param {function} fun - 回调函数
    */
	setSearchCompleteCallback: function(fun){
		this.options.onSearchComplete = fun;
	},
	/**
    * 关键字检索
    * @method L.TLocalSearch#search
    * @param {string} keyword - 检索关键字
    * @param {number} type - 检索类型
    * type：搜索类型,1表示普通搜索;2表示视野内搜索;4表示普通建议词搜索;5表示公交规划建议词搜索;7表示 纯POI搜索(不搜公交线）;10表示拉框搜索
    */
	search: function(keyword,type){
		this._search(keyword,type);
	},
	/**
    * 按指定bounds检索
    * @method L.TLocalSearch#searchInBounds
    * @param {string} keyword - 检索关键字
    * @param {L.LatLngBounds} bounds - 检索范围
    */
	searchInBounds: function(keyword,bounds){
		param.mapBound = bounds.toBBoxString();
		this._search(keyword,10);
	},
	/**
    * 根据中心点、半径周边检索
    * @method L.TLocalSearch#searchNearby
    * @param {string} keyword - 检索关键字
    * @param {L.LatLng} center - 中心点
    * @param {float} radius - 搜索半径，单位米
    */
	searchNearby: function(keyword,center,radius){
		var pageNum = this.options.pageNum;
		var pageSize = this.options.pageSize;
		var param = {
			"keyWord":encodeURIComponent(keyword),
			"pageNum": pageNum,
			"pageSize": pageSize,
			"queryType": 3,
			"queryRadius": radius,
			"pointLonlat": center.lng + "," + center.lat
		};
		this.options.param = param;
		this._dosearch();
	},
	/**
    * 获取当前检索结果
    * @method L.TLocalSearch#getResults
    * @return {object} currentResult - 检索结果
    */
	getResults: function(){
		return this.options.currentResult;
	},
	/**
    * 清除检索结果
    * @method L.TLocalSearch#clearResults
    */
	clearResults: function(){
		this.options.currentResult = null;
		this.options.pageNum = 0;
	},
	/**
    * 获取结果总页数
    * @method L.TLocalSearch#getTotalPage
    * @return {number} totalPage - 总页数
    */
	getTotalPage: function(){
		var totalPage;
		var result = this.options.currentResult;
		if(result){
			var totalCount = result.count;
			if(totalCount && totalCount > 0){
				totalPage = Math.ceil(totalCount/this.options.pageSize) - 1;
			}
		}
		return totalPage;
	},
	/**
    * 检索首页
    * @method L.TLocalSearch#firstPage
    */
	firstPage: function(){
		this.gotoPage(0);
	},
	/**
    * 检索下一页
    * @method L.TLocalSearch#nextPage
    */
	nextPage: function(){
		var param = this.options.param;
		var pageNum = param.pageNum;
		this.gotoPage(pageNum+1);
	},
	/**
    * 检索上一页
    * @method L.TLocalSearch#previousPage
    */
	previousPage: function(){
		var param = this.options.param;
		var pageNum = param.pageNum;
		this.gotoPage(pageNum-1);
	},
	/**
    * 检索最后一页
    * @method L.TLocalSearch#lastPage
    */
	lastPage: function(){
		var param = this.options.param;
		var totalPage = this.getTotalPage();
		this.gotoPage(totalPage);
	},
	/**
    * 检索指定页码
    * @method L.TLocalSearch#gotoPage
    * @param {number} pageNum - 指定页码
    */
	gotoPage: function(pageNum){
		var param = this.options.param;
		var totalPage = this.getTotalPage();
		if(param && totalPage){
			if(pageNum > totalPage){
				pageNum = totalPage;
			}else if(pageNum < 0){
				pageNum = 0;
			}
			param.pageNum = pageNum;
			this._dosearch();
		}
	},
	_search: function(keyword,queryType){
		var pageNum = this.options.pageNum;
		var pageSize = this.options.pageSize;
		var param = {
			"keyWord": encodeURIComponent(keyword),
			"pageNum": pageNum,
			"pageSize": pageSize,
			"queryType": queryType
		};
		this.options.param = param;
		this._dosearch();
	},
	_dosearch: function(){
		var param = this.options.param;
		var url = this._queryParam(param);
		if(url){
			var that = this;
			L.get(L.ProxyHost + url,null,function(result){
				try{
					var res = JSON.parse(result);
					that.options.currentResult = res;
					if(that.options.onSearchComplete){
						that.options.onSearchComplete.call(that,res,that.options.queryType);
					}
				}catch(e){
					if(that.options.onSearchComplete){
						that.options.onSearchComplete.call(that,result,that.options.queryType);
					}
				}
			});
		}
	},
	_queryParam: function(param){
		var url = this.options.url;
		if(!url) return false;
		var requestParams = L.setOptions({},param);
		var count = param.pageSize;
		var start = param.pageNum * param.pageSize;
		if(this.map){
			var level = this.map.getZoom();
			requestParams.level = requestParams.level || level;
			var mapBound = this.map.getBounds().toBBoxString();
			requestParams.mapBound = requestParams.mapBound || mapBound;
		}
		requestParams.queryType = requestParams.queryType || 1;
		requestParams.count = count || 10;
		requestParams.start = start || 0;
		
		var allParams = [
			"keyWord","level","mapBound","pointLonlat","queryRadius",
			"queryType","specifyAdminCode","count","start"
		];
		
		var queryStr = "?postStr=";
		var postStrArr = [];
		
		for(var i=0;i<allParams.length;i++){
			var item = allParams[i];
			if(item in requestParams){
				postStrArr.push("'" + item + "':" + "'" + requestParams[item] + "'");
			}
		}
		queryStr += "{" +postStrArr.join(",")+ "}";
		queryStr += "&type=query";
		url = url + encodeURIComponent(queryStr);
		return url;
	}
	
});/**
 * @class
 * @classdesc 路径规划结果方案类
 * @constructs
 * @alias L.RoutePlan
 * @param {Object} options - 初始化参数
 * @extends L.Class
 */
L.RoutePlan = L.Class.extend({
	options: {
		plan: null
	},
	initialize: function(options){
		L.setOptions(this, options);
	},
	/**
    * 获取当前方案的总距离
    * @method L.RoutePlan#getDistance
    * @return {string} len - 总距离
    */
	getDistance: function(){
		var plan = this.options.plan;
		if(plan){
			return parseInt(plan.distance / 1000) + "公里"
		}
		return null;
	},
	/**
    * 获取当前方案的总时间
    * @method L.RoutePlan#getDistance
    * @return {string} time - 总时间
    */
	getDuration: function(){
		var plan = this.options.plan;
		if(plan){
			return this._formatMinute(route.duration);
		}
		return null;
	},
	/**
    * 获取当前方案的路段数目
    * @method L.RoutePlan#getNumSteps
    * @return {number} num - 路段数目
    */
	getNumSteps: function(){
		var plan = this.options.plan;
		if(plan){
			return plan.steps.length;
		}
		return null;
	},
	/**
    * 根据路段序号获取该路段信息
    * @method L.RoutePlan#getStep
    * @param  {number} num - 路段序号
    * @return {object} step - 路段数目
    */
	getStep: function(num){
		var plan = this.options.plan;
		if(plan){
			var steps = plan.steps;
			return steps[num];
		}
		return null;
	},
	_formatMinute:function(value) {
	    var theTime = parseInt(value);
	    var theTime1 = 0;
	    if(theTime > 60) {
	    	theTime1 = parseInt(theTime/60);
	    	theTime = parseInt(theTime%60);
	    }
	    var result = 0;
        if(theTime1 > 0) {
          result = ""+parseInt(theTime1)+"小时";
        }
        result = result + theTime + "分钟";
	    return result;
	}
});/**
 * @class
 * @classdesc 驾车导航类，主要包括最短、最快、不走高速路径导航
 * @constructs
 * @alias L.DrivingRoute
 * @param {L.Map} map - 地图对象
 * @param {Object} options - 初始化参数
 * @property {object}   options                	 - 路径规划参数
 * @property {String}   options.url        		 - 路径规划服务地址
 * @property {number}   options.policy        	 - 查询策略，值说明：
 * policy=0 最少时间；
 * policy=1 最短距离；
 * policy=2 避开高速。
 * @property {Function} options.onSearchComplete - 查询成功回调函数
 * @property {L.LatLng} options.start 		 	 - 起点
 * @property {L.LatLng} options.end 		  	 - 终点
 * @property {L.LatLng[]} options.waypoints 	 - 途经点
 * @property {object} options.currentResult	   	 - 当前查询结果
 * @example 
 * var options = {
 *   url: "http://www.mapgx.com/ime-server/rest/route/plan",
 *   onSearchComplete: function(result){
 *     var plan = this.getPlan(0);
 *   }
 * };
 * var drivingRoute = new L.DrivingRoute(map,options);
 * var start = new L.LatLng(lat1,lng1);
 * var end = new L.LatLng(lat2,lng2);
 * drivingRoute.search(start,end);
 * @extends L.Class
 */
L.DrivingRoute = L.Class.extend({
	options: {
		url: null,
		policy: 0,
		onSearchComplete: null,
		start: null,
		end: null,
		waypoints: [],
		currentResult: null,
	},
	initialize: function(map,options){
		this.map = map;
		L.setOptions(this, options);
	},
	/**
    * 设置查询策略
    * @method L.DrivingRoute#setPolicy
    * @param {number}  policy   - 策略值，policy=0 最少时间、policy=1 最短距离、policy=2 避开高速。
    * @param {Boolean} nosearch - 是否查询，值为true则不进行自动查询
    */
	setPolicy: function(policy,nosearch){
		this.options.policy = policy;
		if(!nosearch){
			this._search();
		}
	},
	/**
    * 根据起始点查询线路
    * @method L.DrivingRoute#search
    * @param {L.LatLng} start - 起点坐标
    * @param {L.LatLng} end   - 终点坐标
    */
	search: function(start,end){
		if(start instanceof L.LatLng && end instanceof L.LatLng){
			this.options.start = start;
			this.options.end = end;
			this._search();
		}else{
			this._failFn();
		}
	},
	/**
    * 设置途经点
    * @method L.DrivingRoute#setWayPoints
    * @param {L.LatLng[]} waypoints - 途经点集合
    * @param {Boolean} nosearch 	- 是否查询，值为true则不进行自动查询
    */
	setWayPoints: function(waypoints,nosearch){
		if(waypoints && waypoints.length > 0){
			this.options.waypoints = waypoints;
			if(!nosearch){
				this._search();
			}
		}
	},
	/**
    * 获取途经点
    * @method L.DrivingRoute#getWayPoints
    * @return {L.LatLng[]} waypoints - 途经点集合
    */
	getWayPoints: function(){
		return this.options.waypoints;
	},
	/**
    * 清除结果
    * @method L.DrivingRoute#clearResults
    */
	clearResults: function(){
		this.options.policy = 0;
		this.options.start = null;
		this.options.end = null;
		this.options.currentResult = null;
	},
	/**
    * 获取查询结果
    * @method L.DrivingRoute#getResults
    * @return {object} currentResult - 查询结果
    */
	getResults: function(){
		return this.options.currentResult;
	},
	/**
    * 获取起点
    * @method L.DrivingRoute#getStart
    * @return {L.LatLng} start - 起点坐标
    */
	getStart: function(){
		return this.options.start;
	},
	/**
    * 获取终点
    * @method L.DrivingRoute#getEnd
    * @return {L.LatLng} end - 终点坐标
    */
	getEnd: function(){
		return this.options.end;
	},
	/**
    * 获取结果方案数量
    * @method L.DrivingRoute#getNumPlans
    * @return {number} num - 方案数量
    */
	getNumPlans: function(){
		var routes = this.options.currentResult;
		if(routes && routes.status.toLowerCase() == "ok"){
			return routes.totalCount;
		}else{
			return 0;
		}
	},
	/**
    * 根据方案序号获取对应方案对象
    * @method L.DrivingRoute#getPlan
    * @param  {number}      num - 方案序号
    * @return {L.RoutePlan} plan - 方案数量
    */
	getPlan: function(num){
		var total = this.getNumPlans();
		var plan;
		if(total > 0){
			var plans = this.options.currentResult.results;
			if(typeof num === 'number' && isFinite(num) && num <= total){
				plan = plans[num];
				return new L.RoutePlan({plan:plan});
			}
		}
		return false;
	},
	_failFn: function(){
		var obj = {
			msg: "起始点参数不正确，请传入L.LatLng类型参数",
			status: "error"
		};
		if(this.options.onSearchComplete){
			this.options.onSearchComplete.call(this,obj);
		}
	},
	_search: function(){
		var url = this._queryParam();
		if(url){
			var that = this;
			L.jsonp(url,null,function(result){
				that.options.currentResult = result;
				if(that.options.onSearchComplete){
					that.options.onSearchComplete.call(that,result);
				}
			});
		}
	},
	_queryParam: function(){
		var url = this.options.url;
		var start = this.options.start;
		var end = this.options.end;
		var policy = this.options.policy;
		if(start && end && url){
			var origin = start.lng + "," + start.lat;
	    	var destination = end.lng + "," + end.lat;
	    	url = url+ "?format=json"+"&origin=" + origin + "&destination=" + destination + "&mode=" + policy;
	    	var waypoints = this.getWayPoints();
	    	if(waypoints && waypoints.length > 0){
	    		var _waypoints = [];
	    		for(var i=0;i<waypoints.length;i++){
	    			var lnglat = waypoints[i].lng + "," + waypoints[i].lat;
	    			_waypoints.push(lnglat);
	    		}
	    		url += "&waypoints=" + _waypoints.join(";");
	    	}
	    	return url;
		}else{
			return false;
		}
	}
});/**
 * @class
 * @classdesc 天地图驾车导航类，主要包括最短、最快、不走高速路径导航
 * @constructs
 * @alias L.TDrivingRoute
 * @param {L.Map} map - 地图对象
 * @param {Object} options - 初始化参数
 * @property {object}   options                	 - 路径规划参数
 * @property {String}   options.url        		 - 路径规划服务地址
 * @property {number}   options.policy        	 - 查询策略，值说明：
 * policy=0 最少时间；
 * policy=1 最短距离；
 * policy=2 避开高速。
 * @property {Function} options.onSearchComplete - 查询成功回调函数
 * @property {L.LatLng} options.start 		 	 - 起点
 * @property {L.LatLng} options.end 		  	 - 终点
 * @property {L.LatLng[]} options.waypoints 	 - 途经点
 * @property {object} options.currentResult	   	 - 当前查询结果
 * @example 
 * var options = {
 *   onSearchComplete: function(result){
 *     
 *   }
 * };
 * var drivingRoute = new L.TDrivingRoute(map,options);
 * var start = new L.LatLng(lat1,lng1);
 * var end = new L.LatLng(lat2,lng2);
 * drivingRoute.search(start,end);
 * @extends L.Class
 */
L.TDrivingRoute = L.Class.extend({
	options: {
		url: "http://www.tianditu.com/query.shtml",
		policy: 0,
		onSearchComplete: null,
		start: null,
		end: null,
		waypoints: [],
		currentResult: null,
	},
	initialize: function(map,options){
		this.map = map;
		L.setOptions(this, options);
	},
	/**
    * 设置查询策略
    * @method L.TDrivingRoute#setPolicy
    * @param {number}  policy   - 策略值，policy=0 最少时间、policy=1 最短距离、policy=2 避开高速。
    * @param {Boolean} nosearch - 是否查询，值为true则不进行自动查询
    */
	setPolicy: function(policy,nosearch){
		this.options.policy = policy;
		if(!nosearch){
			this._search();
		}
	},
	/**
    * 根据起始点查询线路
    * @method L.TDrivingRoute#search
    * @param {L.LatLng} start - 起点坐标
    * @param {L.LatLng} end   - 终点坐标
    */
	search: function(start,end){
		if(start instanceof L.LatLng && end instanceof L.LatLng){
			this.options.start = start;
			this.options.end = end;
			this._search();
		}else{
			this._failFn();
		}
	},
	/**
    * 设置途经点
    * @method L.TDrivingRoute#setWayPoints
    * @param {L.LatLng[]} waypoints - 途经点集合
    * @param {Boolean} nosearch 	- 是否查询，值为true则不进行自动查询
    */
	setWayPoints: function(waypoints,nosearch){
		if(waypoints && waypoints.length > 0){
			this.options.waypoints = waypoints;
			if(!nosearch){
				this._search();
			}
		}
	},
	/**
    * 获取途经点
    * @method L.TDrivingRoute#getWayPoints
    * @return {L.LatLng[]} waypoints - 途经点集合
    */
	getWayPoints: function(){
		return this.options.waypoints;
	},
	/**
    * 清除结果
    * @method L.TDrivingRoute#clearResults
    */
	clearResults: function(){
		this.options.policy = 0;
		this.options.start = null;
		this.options.end = null;
		this.options.currentResult = null;
	},
	/**
    * 获取查询结果
    * @method L.TDrivingRoute#getResults
    * @return {object} currentResult - 查询结果
    */
	getResults: function(){
		return this.options.currentResult;
	},
	/**
    * 获取起点
    * @method L.TDrivingRoute#getStart
    * @return {L.LatLng} start - 起点坐标
    */
	getStart: function(){
		return this.options.start;
	},
	/**
    * 获取终点
    * @method L.TDrivingRoute#getEnd
    * @return {L.LatLng} end - 终点坐标
    */
	getEnd: function(){
		return this.options.end;
	},
	_failFn: function(){
		var obj = {
			msg: "起始点参数不正确，请传入L.LatLng类型参数",
			status: "error"
		};
		if(this.options.onSearchComplete){
			this.options.onSearchComplete.call(this,obj);
		}
	},
	_search: function(){
		var url = this._queryParam();
		if(url){
			var that = this;
			L.get(url,null,function(result){
				try{
					var parser = new L.Format.TRouteResultFormat();
	                var resultObj = new L.TRouteResult(parser.read(result));
					that.options.currentResult = resultObj;
					if(that.options.onSearchComplete){
						that.options.onSearchComplete.call(that,resultObj);
					}
				}catch(e){
					if(that.options.onSearchComplete){
						that.options.onSearchComplete.call(that,result);
					}
				}
			});
		}
	},
	_queryParam: function(){
		var url = this.options.url;
		var start = this.options.start;
		var end = this.options.end;
		var policy = this.options.policy;
		if(start && end && url){
			var waypoints = this.getWayPoints();
			var mid = "";
	    	if(waypoints && waypoints.length > 0){
	    		var _waypoints = [];
	    		for(var i=0;i<waypoints.length;i++){
	    			var lnglat = waypoints[i].lng + "," + waypoints[i].lat;
	    			_waypoints.push(lnglat);
	    		}
	    		mid = _waypoints.join(";");
	    	}
			
			var origin = start.lng + "," + start.lat;
	    	var destination = end.lng + "," + end.lat;
	    	var requestParams = {};
	    	requestParams.orig = origin;
	    	requestParams.dest = destination;
	    	requestParams.style = policy;
	    	requestParams.mid = mid;
	    	
	    	var allParams = ["orig","dest","style","mid"];
	    	var queryStr = "?postStr=";
			var postStrArr = [];
			for(var i=0;i<allParams.length;i++){
				var item = allParams[i];
				if(item in requestParams){
					postStrArr.push("'" + item + "':" + "'" + requestParams[item] + "'");
				}
			}
			queryStr += "{" +postStrArr.join(",")+ "}";
			queryStr += "&type=search";
	    	url = url+ queryStr;
	    	return url;
		}else{
			return false;
		}
	}
});/**
 * @class
 * @classdesc IME动态服务查询功能，查询图例、空间查询、i查询等
 * @constructs
 * @alias L.ImeMapService
 * @param {Object} options - 初始化参数
 * @property {String}   options.url        		 - 查询服务地址
 * @example 
 * var mapService = new L.ImeMapService({url:""});
 * mapService.querySingleLayer(layerId, requestParams, callback);
 * @extends L.Class
 */
L.ImeMapService = L.Class.extend({
	options:{
		url: null
	},
	initialize: function(options){
		L.setOptions(this, options);
	},
	/**
    * 查询图例
    * @method L.ImeMapService#getLayerLegend
    * @param {String} layerId - 图层Id
    * @param {object} requestParams - 查询参数
    * @property {String}   requestParams.width
    * @property {String}   requestParams.height
    * @property {String}   requestParams.format
    * @param {function} callback - 查询成功回调函数 
    */
	getLayerLegend : function(layerId, requestParams, callback) {
		var url = this.options.url + "/" + layerId + "/legend?";

		var allParams = [ "width", "height", "format" ];
		var k = 0;
		for (var i = 0; i < allParams.length; i++) {
			var item = allParams[i];
			if (item in requestParams) {
				if (k == 0) {
					url += item + "=" + requestParams[item];
				} else {
					url += "&" + item + "=" + requestParams[item];
				}
				k++;
			}
		}
		L.jsonp(url, null, function(result) {
			if (callback && typeof callback == "function") {
				callback(result);
			}
		});
	},
	/**
    * 单图层空间查询
    * @method L.ImeMapService#querySingleLayer
    * @param {String} layerId - 图层Id
    * @param {object} requestParams - 查询参数
    * @property {String}   requestParams.spatialOper
    * @property {String}   requestParams.geometry
    * @property {String}   requestParams.where
    * @property {String}   requestParams.orderBy
    * @property {String}   requestParams.outFields
    * @property {String}   requestParams.format
    * @param {function} callback - 查询成功回调函数 
    */
	querySingleLayer : function(layerId, requestParams, callback) {
		var url = this.options.url + "/" + layerId + "/query?";

		var allParams = [ "spatialOper", "geometry", "where", "orderBy", "outFields", "format" ];
		var k = 0;
		for (var i = 0; i < allParams.length; i++) {
			var item = allParams[i];
			if (item in requestParams) {
				if (item == "geometry") {
					requestParams[item] = L.Util.writeGeometryToWKT(requestParams[item],"polygon");
				}
				if (k == 0) {
					url += item + "=" + requestParams[item];
				} else {
					url += "&" + item + "=" + requestParams[item];
				}
				k++;
			}
		}
		L.jsonp(url, null, function(result) {
			if (callback && typeof callback == "function") {
				callback(result);
			}
		});
	},
	/**
    * i查询
    * @method L.ImeMapService#identify
    * @param {object} params - ImeDynamicMapService.params
    * @param {object} requestParams - 查询参数
    * @property {String}   requestParams.x
    * @property {String}   requestParams.y
    * @property {boolean}  requestParams.getGeometry
    * @property {number}   requestParams.tolerance
    * @param {function} callback - 查询成功回调函数 
    */
	identify : function(params, requestParams, callback) {
		var para = {};
		para.xmin = params.xmin;
		para.ymin = params.ymin;
		para.xmax = params.xmax;
		para.ymax = params.ymax;
		para.width = params.width;
		para.height = params.height;
		if(params.layers){
			para.layers = params.layers;
		}
		L.extend(para, requestParams);
		var url = this.options.url + "/identify";

		var paramsString = L.Util.getParamString(para);
		var requestString = url + "?" + paramsString;
		L.jsonp(requestString, null, function(result) {
			if (callback && typeof callback == "function") {
				callback(result);
			}
		});
	}
});
	;return L;
}));