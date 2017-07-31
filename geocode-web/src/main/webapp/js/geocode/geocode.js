G.Geocoding = {
	map : null,
	vectorLayer : null,
	guid : null,
	
	init : function() {
		this.initMap();
		this.initEvent();
	},
	
	initMap : function() {
		var that = this;
		var options = {
			center: [30.332590523, 112.241865807],
			zoom: 4,
			zoomControl: false
		}
		that.map = new L.Map("map", options);
		new L.Control.Zoom({ position: 'bottomright' }).addTo(that.map);
		var clayer = L.tileLayer('http://t0.tianditu.cn/DataServer?T=vec_c&X={x}&Y={y}&L={z}');
		clayer.addTo(that.map);
		var vlayer = L.tileLayer('http://t0.tianditu.cn/DataServer?T=cva_c&X={x}&Y={y}&L={z}');
		vlayer.addTo(that.map);

		that.vectorLayer = new L.FeatureGroup();
	    that.map.addLayer(that.vectorLayer);
	},
	
	initEvent : function() {
		var that = this;
		// 地理编码类型选项卡
		$('.src-tab-tit li').click(function(){
			$(this).addClass('accr').siblings().removeClass('accr').addClass('act');
			var index = $(this).index('.src-tab-tit li');
			$('.src-tab-list').eq(index).css({'z-index':2});
			$('.src-tab-list').eq(index).siblings().css({'z-index':1});
		});
		
		// 正逆向地理编码检索
		$('.src-tab-list .src-btn').click(function() {
			var url;
			if ($(this).prev().hasClass('sg-input')) {
				var address = $('.sg-input').val().trim();
				if (!address) {
					return layer.alert('请输入正向地理编码检索地址', {icon: 3});
				}
				url = G.restUrl + "/geocode/geo?format=json&address=" + encodeURIComponent(address);
			} else {
				var lon = $('.jd-input').val().trim();
				var lat = $('.wd-input').val().trim();
				if (!lon || !lat) {
					return layer.alert('请输入逆向地理编码经纬度坐标', {icon: 3});
				}
				url = G.restUrl + "/geocode/rgeo?format=json&lon=" + lon + "&lat=" + lat;
			}
			that.search(url);
		});
		
		// 上传批量匹配txt,csv,excel
		$('.batch').click(function(){
			$('.translucent-bg').show();
			$('.add-field-popup').show();
		});
		
		// 选择编码操作类别
		$('.add-field-popup .types-select a').click(function() {
			$(this).addClass('on').siblings().removeClass('on');
		});
		
		// 取消上传
		$('.add-field-popup .import-data-btn button').eq(1).click(function() {
			$('.translucent-bg').hide();
			$('.add-field-popup').hide();
		});
		
		
	},
	
	search : function(url) {
		var that = this;
		$.ajax({
			url : url,
			dataType : "jsonp",
			jsonp : "callback",
			success : function(data) {
				if (data.status == "ok") {
					var result = data.result;
					if (result) {
						G.Template.render("resultTmpl", data, function(html) {
							$('.poilist').children().remove();
							$('.poilist').append(html);
							$('.coad-result-wrap').css('height', 'auto');
							$('.coad-result-wrap').show();
							
							// 单一匹配无纠错，所以绘制形状
							var featureLayer = omnivore.wkt.parse(result.wkt);
							that.vectorLayer.addLayer(featureLayer);
							var bounds = that.vectorLayer.getBounds();
							that.map.fitBounds(bounds);
							//that.bindUI(data.pageNum, data.pageSum);
						});
					} else {
						
					}
				} else {
					return layer.alert(data.message, {icon: 2});
				}
			}
		});
	},


}
