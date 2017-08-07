G.Geocoding = {
	map : null,
	vectorLayer : null,
	batchId : null,
	uploadId : null,
	geocodeType : 1,
	popupFields : [],
	
	init : function() {
		this.initMap();
		this.initEvent();
		
		// 初始化page
		layui.use('laypage', function() { });
		
		// 测试，实际应用中注释掉
		var that = this;
		layui.use('laypage', function(laypage) {
			laypage({
			    cont: 'data-page-turn',
		        pages: 5,
		        first: false,
		        last: 5,
		        groups: 3,
		        prev: '<em><</em>',
		        next: '<em>></em>',
		        skin: '#1E9FFF',
		        jump: function(obj, first){
		            var curr = obj.curr;
		            that.getBatchList(curr);
		        }
		    });
		});
		this.batchId = 'e562f86001a847d6a5bff96a822a340f_P';
		this.popupFields = [['省份', 'resultProvince'],['城市', 'resultCity'],['乡镇', 'resultCounty']];
		this.getBatchList(1);
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
		$('.search-tab-form .src-tab-tit li').click(function(){
			$(this).addClass('accr').siblings().removeClass('accr').addClass('act');
			var index = $(this).index('.src-tab-tit li');
			$('.src-tab-list').eq(index).css({'z-index':2});
			$('.src-tab-list').eq(index).siblings().css({'z-index':1});
		});
		
		// 正逆向地理编码检索
		$('.search-tab-form .src-tab-list .src-btn').click(function() {
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
		$('.coadtall-bar .batch').click(function(){
			$('.translucent-bg').show();
			$('.add-field-popup').show();
		});
		
		// 选择编码操作类别
		$('.add-field-popup .types-select a').click(function() {
			$(this).addClass('on').siblings().removeClass('on');
			that.geocodeType = $('.add-field-popup .types-select a.on').index() + 1;
		});
		
		
		$(".add-field-popup .upload-file").click(function() {
			$(this).val('');
		})
		
		$(".add-field-popup .upload-file").change(function() {
		    var name = this.files && this.files.length ?
		          this.files[0].name : this.value.replace(/^C:\\fakepath\\/i, '');
		    $(this).prev().prev().val(name);
		})
		
		// 确定上传
		$('.add-field-popup .import-data-btn button').eq(0).click(function() {
			var fileName = $('.upload-file').prev().prev().val();
			if (!fileName) {
				return layer.alert('请先选择文件', {icon: 3});
			} else {
				//$(this).next().click();
				that.upload();
			}
		});
		
		// 取消上传
		$('.add-field-popup .import-data-btn button').eq(1).click(function() {
			$('.translucent-bg').hide();
			$('.add-field-popup').hide();
			$('.upload-file').prev().prev().val('');
			$('.add-field-popup .types-select a').eq(0).addClass('on').siblings().removeClass('on');
		});
		
		// 数据匹配上一步
		$('.data-match-popup .import-data-btn button').eq(0).click(function() {
			$('.data-match-popup .keep-con').html('');
			$('.data-match-popup').hide();
			$('.add-field-popup').show();
		});
		
		// 数据匹配完成-批量编码
		$('.data-match-popup .import-data-btn button').eq(1).click(function() {
			var flag = true;
			$('.data-match-popup > .keep-con > ul > li:nth-child(1) .match span').each(function(index) {
				var type = $(this).attr('type');
				if (!type) {
					flag = false;
				}
			});
			if (flag) {
				$('.data-match-popup .select-field .zd-main span.right').each(function(index) {
					var type = $(this).attr('type');
					if (type) {
						var text = $(this).text();
						var o = [text, type];
						that.popupFields.push(o);
					}
				});
				that.batch();
			} else {
				return layer.alert('请选择匹配字段', {icon: 2});
			}
		});
		
		// 仅显示成功或失败的数据
		$('.coad-result-wrap .data-radio .types-select a').click(function() {
			$(this).addClass('on').siblings().removeClass('on');
			var batchType = $(this).index() + 1;
			that.getBatchList(1, batchType);
		});
	},
	
	// 完成地理编码批量匹配
	batch : function() {
		var that = this;
		var url;
		var formData = new FormData();
		formData.append("uploadId", that.uploadId);
		
		if (that.geocodeType == 1) {
			url = G.restUrl + "/geocode/geobatch";
			var addressIndex = $('.data-match-popup > .keep-con > ul > li:nth-child(1) .match span').eq(0).attr('type');
			formData.append("addressIndex", addressIndex);
		} else {
			url = G.restUrl + "/geocode/rgeobatch";
			var lonIndex = $('.data-match-popup > .keep-con > ul > li:nth-child(1) .match span').eq(0).attr('type');
			var latIndex = $('.data-match-popup > .keep-con > ul > li:nth-child(1) .match span').eq(1).attr('type');
			formData.append("lonIndex", lonIndex);
			formData.append("latIndex", latIndex);
		}
		
		$.ajax({
			url : url,
			type : 'POST',
			data : formData,
			dataType : 'json',
			processData: false,
		    contentType: false,
			success : function(data) {
				if (data.status == "ok") {
					that.batchId = data.batchId;
					G.Template.render("batchListTmpl", data.batchList, function(html) {
						$('.coad-result-wrap .poilist').children().remove();
						$('.coad-result-wrap .poilist').append(html);
						$('.data-match-popup').hide();
						// 分页
						layui.laypage({
						    cont: 'data-page-turn',
					        pages: data.batchList.pageSum,
					        first: false,
					        last: false,
					        groups: 4,
					        prev: '<em><</em>',
					        next: '<em>></em>',
					        skin: '#1E9FFF',
					        jump: function(obj, first){
					            var curr = obj.curr;
					            that.getBatchList(curr);
					        }
					    });
						
						$('.coad-result-wrap .turn-page').show();
						$('.coad-result-wrap .data-radio').show();
						$('.coad-result-wrap').show();
						
						that.vectorLayer.clearLayers();
						
						var list = data.batchList.results;
						var failLon, failLat;
						var allFailed = true;
						for (var i = 0; i < list.length; i++) {
							if (list[i].status == 'success') {
								failLon = list[i].resultLon;
								failLat = list[i].resultLat;
								allFailed = false;
								break;
							}
						}
						
						if (allFailed) {
							return;
						}
						
						for (var i = 0; i < list.length; i++) {
							var mark = null;
							if(list[i].status == 'success') {
								var _icon = L.icon({
									iconUrl: G.root + '/images/num' + (i + 1) + ".png",
									iconSize:     [21, 26],
									iconAnchor:   [10.5, 26]
								});
								mark = L.marker([list[i].resultLat, list[i].resultLon], {icon: _icon});
							} else {
								var _icon = L.icon({
									iconUrl: G.root + '/images/num0.png',
									iconSize:     [21, 26],
									iconAnchor:   [10.5, 26]
								});
								mark = L.marker([failLat, failLon], {icon: _icon});
							}
							that.vectorLayer.addLayer(mark);
						}
						
						var bounds = that.vectorLayer.getBounds();
						that.map.fitBounds(bounds);
					});
				} else {
					return layer.alert(data.message, {icon: 2});
				}
			}
		});
		
		
	},
	
	// 单一地理编码
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
							$('.coad-result-wrap .poilist').children().remove();
							$('.coad-result-wrap .poilist').append(html);
							//$('.coad-result-wrap').css('height', 'auto');
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
	
	// 批量上传
	upload : function() {
		var that = this;
		var url = G.restUrl + '/geocode/upload';
		var data = new FormData();
		data.append('file', $('.upload-file')[0].files[0]);
		var loadingIndex = layer.load();
		$.ajax({
			url: url,
			type: 'POST',
			data: data,
			processData: false,
			contentType: false,
			success: function(data) {
				layer.close(loadingIndex);
				if (data.status == 'error') {
					return layer.alert(data.message, {icon: 2});
				} else if (data.status == 'ok') {
					that.uploadId = data.uploadId;
					data.geocodeType = that.geocodeType;
					G.Template.render("positiveMatchTmpl", data, function(html) {
						$('.data-match-popup .keep-con').html(html);
						if (that.geocodeType == 1) {
							$('.data-match-popup').css('height', '570px');
							$('.data-match-popup').css('margin-top', '-285px');
						} else {
							$('.data-match-popup').css('height', '510px');
							$('.data-match-popup').css('margin-top', '-255px');
						}
						that.bindDataMatchEvent();
						$('.add-field-popup .import-data-btn button').eq(1).click();
						$('.data-match-popup').show();
					});
				}
			}
		});
	},
	
	// 绑定数据匹配事件
	bindDataMatchEvent : function() {
		var that = this;
		// 匹配字段下拉框
		$('.input-box.match span').click(function() {
			var display = $(this).next('ul').css('display');
			if (display == 'none') {
				$(this).next('ul').slideDown(50);
			} else {
				$(this).next('ul').slideUp(50);
			}
		});
		// 匹配字段选项
		$('.input-box.match ul li a').click(function() {
			var type = $(this).attr('type');
			var value = $(this).text();
			$(this).parent().parent().prev().text(value);
			$(this).parent().parent().prev().attr('type', type);
			$(this).parent().parent().slideUp(50);
		});
		
		// 显示字段添加
		$('.zd-btn .add').click(function() {
			var index = $('.data-match-popup .select-field > .zd-main > li').length + 1;
			
			var html = '<li><a href="javascript:void(0);"><span class="left">' + index + '</span><span class="right">请选择字段</span></a></li>';
			$('.data-match-popup .select-field .zd-main').append(html);
			$('.data-match-popup .select-field .zd-main li').on('click', function() {
				$(this).addClass('select').siblings().removeClass('select');
			});
			$('.data-match-popup .select-field span.right').on('click', function() {
					var index = $(this).parent().parent().index() + 1;
					$('.select-field .zd-select').css('top', index*30 + 'px');
					$('.select-field .zd-select').toggle();
			});
		});
		
		// 上移
		$('.data-match-popup .zd-btn .up').click(function() {
			var $current = $('.data-match-popup .select-field .zd-main li.select');
			var index = $current.index();
			if (index == 0 || $current.prev() == null) {
				return ; 
			} else {
				var currenText = $current.find('span.right').text();
				var prevText = $current.prev().find('span.right').text();
				$current.find('span.right').text(prevText);
				$current.prev().find('span.right').text(currenText);
				$current.prev().addClass('select').siblings().removeClass('select');
			}
		});
		// 下移
		$('.data-match-popup .zd-btn .down').click(function() {
			var $current = $('.data-match-popup .select-field .zd-main li.select');
			var index = $current.index() + 1;
			var length = $('.data-match-popup .select-field > .zd-main > li').length;
			if (index == length || $current.next() == null) {
				return ; 
			} else {
				var currenText = $current.find('span.right').text();
				var nextText = $current.next().find('span.right').text();
				$current.find('span.right').text(nextText);
				$current.next().find('span.right').text(currenText);
				$current.next().addClass('select').siblings().removeClass('select');
			}
		});
		// 删除
		$('.data-match-popup .zd-btn .cancel').click(function() {
			$('.data-match-popup .select-field .zd-main li.select').remove();
			$('.data-match-popup .select-field > .zd-main > li').each(function(index) {
				$(this).find('span.left').text(index+1);
			});
		});
		// 显示字段选项
		$('.data-match-popup .select-field .zd-select li a').click(function() {
			var type = $(this).attr('type');
			var text = $(this).text();
			$('.select-field .zd-main>li.select span.right').attr('type', type);
			$('.select-field .zd-main>li.select span.right').text(text);
			$('.select-field .zd-select').hide();
		});
		
		// 数据展示
		$('.data-match-popup .zd-btn .right').click(function() {
			var num_page = $('.data-match-popup .zd-form table').attr('type');
			if (!num_page) {
				return ;
			} else {
				var pageNum = parseInt(num_page.split(',')[0]);
				var pageSize = num_page.split(',')[1];
				that.getUploadList(that.uploadId, pageNum +1, pageSize);
			}
		});
		
		$('.data-match-popup .zd-btn .left').click(function() {
			var num_page = $('.data-match-popup .zd-form table').attr('type');
			if (!num_page) {
				return ;
			} else {
				var pageNum = parseInt(num_page.split(',')[0]);
				if (pageNum == 1) {
					return;
				}
				var pageSize = num_page.split(',')[1];
				that.getUploadList(that.uploadId, pageNum - 1, pageSize);
			}
		});
	},
	
	bindSelectFieldEvent : function() {
		$('.select-field .zd-main>li a span.right').click(function() {
			var index = $(this).parent().parent().index() + 1;
			$(this).parent().parent().addClass('select').siblings().removeClass('select');
			$('.select-field .zd-select').css('top', index*30 + 'px');
			$('.select-field .zd-select').show();
		});
	},
	
	getUploadList : function(uploadId, pageNum, pageSize) {
		var url = G.restUrl + "/geocode/uploadlist" + "?uploadId=" + uploadId + "&pageNum=" + pageNum + "&pageSize=" + pageSize;
		$.ajax({
			url : url,
			dataType : "jsonp",
			jsonp : "callback",
			success : function(data) {
				if (data.status == "ok") {
					G.Template.render("uploadListTmpl", data, function(html) {
						$('.data-match-popup .zd-form table').attr('type', data.pageNum + ',' + data.pageSize);
						$('.data-match-popup .zd-form table tr').each(function(index) {
							if (index != 0 ) {
								$(this).remove();
							}
						});
						$('.data-match-popup .zd-form table tbody').append(html);
					});
				} else {
					return layer.alert(data.message, {icon: 2});
				}
			}
		});
	},
	
	
	// 获取批量结果
	getBatchList : function(pageNum, batchType) {
		var that = this;
		batchType = batchType ? batchType  :'0';
		var url = G.restUrl + "/geocode/batchlist?batchId=" + that.batchId + "&pageNum=" + pageNum + "&batchType=" + batchType;
		
		$.ajax({
			url : url,
			type : 'GET',
			dataType : "jsonp",
			jsonp : "callback",
			success : function(data) {
				G.Template.render("batchListTmpl", data, function(html) {
					$('.coad-result-wrap .poilist').children().remove();
					$('.coad-result-wrap .poilist').append(html);
					$('.data-match-popup').hide();
					$('.coad-result-wrap .turn-page').show();
					$('.coad-result-wrap .data-radio').show();
					$('.coad-result-wrap').show();
					
					that.vectorLayer.clearLayers();
					
					var list = data.results;
					
					var failLon, failLat;
					var allFailed = true;
					for (var i = 0; i < list.length; i++) {
						if (list[i].status == 'success') {
							failLon = list[i].resultLon;
							failLat = list[i].resultLat;
							allFailed = false;
							break;
						}
					}
					
					if (allFailed) {
						//return;
						failLon = 0;
						failLat = 0;
					}
					
					for (var i = 0; i < list.length; i++) {
						var mark = null;
						var popupContent = null;
						if(list[i].status == 'success') {
							var _icon = L.icon({
								iconUrl: G.root + '/images/num' + (i + 1) + ".png",
								iconSize:     [21, 26],
								iconAnchor:   [10.5, 26]
							});
							mark = L.marker([list[i].resultLat, list[i].resultLon], {icon: _icon});
							
							popupContent = "<div class='tz-edit'><h3>数据名称</h3>";
							for(var j = 0; j < that.popupFields.length; j++) {
								popupContent = popupContent + "<p>" + that.popupFields[j][0] + ":  " + list[i][that.popupFields[j][1]]+"</p>";
							}
//							popupContent += "<div class='ml'><ul>" +
//									"<li>经度<span>116° 23′ 17〃E</span></li>" +
//									"<li style='padding-left: 35px;'>纬度<br><span>39° 54′ 27〃N</span></li>" +
//									"</ul></div>";
							popupContent += "</div>";
						} else {
							var _icon = L.icon({
								iconUrl: G.root + '/images/num0.png',
								iconSize:     [1, 1],
								iconAnchor:   [10.5, 26]
							});
							mark = L.marker([failLat, failLon], {icon: _icon});
							popupContent = "<div class='tz-edit'><h3>数据名称</h3></div>";
						}
						
						mark.bindPopup(popupContent, {className: 'custom-popup'});
						mark.on('popupopen', function() {
							$('.custom-popup .leaflet-popup-close-button').addClass('close');
						});
						that.vectorLayer.addLayer(mark);
					}
					
					var bounds = that.vectorLayer.getBounds();
					that.map.fitBounds(that.modifyBound(bounds));
					that.bindMapEvents();
				});
			}
		});
	},
	
	bindMapEvents : function() {
		var that = this;
		
		// 鼠标滑过左侧面板，图标变换
		$('.coad-result-wrap .poilist>li').hover(
			function() {
				if ($(this).hasClass('nomatch')) {
					return;
				} else {
					var index = $(this).index();
					var newIcon = L.icon({
						iconUrl: G.root + '/images/num' + (index + 1) + "b.png",
						iconSize:     [21, 26],
						iconAnchor:   [10.5, 26]
					});
					that.vectorLayer.getLayers()[index].setIcon(newIcon);
				}
			}, function() {
				if ($(this).hasClass('nomatch') || $(this).hasClass('draggabled')) {
					return;
				} else {
					var index = $(this).index();
					var newIcon = L.icon({
						iconUrl: G.root + '/images/num' + (index + 1) + ".png",
						iconSize:     [21, 26],
						iconAnchor:   [10.5, 26]
					});
					that.vectorLayer.getLayers()[index].setIcon(newIcon);
				}
			}
		); 
		
		// 点击左侧面板
		$('.coad-result-wrap .poilist>li .ml>h4>a').click(function() {
			var $li = $(this).closest('li');
			if ($li.hasClass('nomatch')) {
				return;
			} else {
				var index = $li.index();
				var newIcon = L.icon({
					iconUrl: G.root + '/images/num' + (index + 1) + "b.png",
					iconSize:     [21, 26],
					iconAnchor:   [10.5, 26]
				});
				
				var markers = that.vectorLayer.getLayers();
				var latlng = null;
				for (var i = 0; i < markers.length; i++) {
					if (i == index) {
						markers[i].setIcon(newIcon);
						markers[i].openPopup();
						latlng = markers[i].getLatLng();
					} else {
						var flag = $('.coad-result-wrap .poilist>li').eq(i).hasClass('nomatch');
						var oldIcon;
						if (flag) {
							oldIcon = L.icon({
								iconUrl: G.root + '/images/num0.png',
								iconSize:     [1, 1],
								iconAnchor:   [10.5, 26]
							});
						} else {
							oldIcon = L.icon({
								iconUrl: G.root + '/images/num' + (i + 1) + ".png",
								iconSize:     [21, 26],
								iconAnchor:   [10.5, 26]
							});
						}
						
						markers[i].setIcon(oldIcon);
					}
				}
				that.map.flyTo(latlng);
			}
		});
		
//		var tipPopup = new L.TipPopup({offset : new L.Point(0,-10)});
//		tipPopup.setLatLng(new L.LatLng(list[i].resultLat,list[i].resultLon)).setContent(popupContent).openOn(that.map);
//		tipPopup._sort = "tip-popup";
		// 坐标纠错或补标
		$('.coad-result-wrap .poilist > li .coad-data-oper a.dw').click(function() {
			var $li = $(this).closest('li');
			$li.addClass('draggabled');
			var index = $li.index();
			var currentMarker = that.vectorLayer.getLayers()[index];
			var currentPopup = currentMarker.getPopup();
			
			if ($li.hasClass('nomatch')) {
				currentMarker.setLatLng(that.map.getBounds().getNorthWest());
				that.map.flyTo(currentMarker.getLatLng());
			} else {
				that.map.flyTo(currentMarker.getLatLng());
			}
			
			var newIcon = L.icon({
				iconUrl: G.root + '/images/num' + (index + 1) + "b.png",
				iconSize:     [21, 26],
				iconAnchor:   [10.5, 26]
			});
			var oldIcon = L.icon({
				iconUrl: G.root + '/images/num' + (index + 1) + ".png",
				iconSize:     [21, 26],
				iconAnchor:   [10.5, 26]
			});
			currentMarker.setIcon(newIcon);
			currentMarker.dragging.enable();
			currentMarker.on('drag', function(e) { 
				var popupContent = currentPopup.getContent()
				
				var latlng = e.target.getLatLng();
				var latLnghtml = "<div class='ml'><ul>" + 
				"<li>经度<span>" + latlng.lng + "</span></li>" +
				"<li style='padding-left: 35px;'>纬度<br><span>" + latlng.lat + "</span></li>" +
				"</ul></div>";
				var newPopupContent = null;
				var mIndex = popupContent.indexOf("<div class='ml'>");
				if (mIndex == -1) {
					newPopupContent = popupContent.slice(0, -6) + latLnghtml + "</div>";
				} else {
					newPopupContent = popupContent.substring(0, mIndex) + latLnghtml + "</div>";
				}
				currentPopup.setContent(newPopupContent);
				currentMarker.openPopup();
			});
			currentMarker.on('dragend', function(e) {
				var latlng = e.target.getLatLng();
				
				// 显示新坐标
				$li.removeClass('draggabled');
				$li.removeClass('nomatch');
				var lngStr = latlng.lng.toString();
				var latStr = latlng.lat.toString();
				$li.find('.span-lng').text(lngStr.substring(0, lngStr.indexOf('.') + 9));
				$li.find('.span-lat').text(latStr.substring(0, lngStr.indexOf('.') + 9));
				
				// pupop
				var popupContent = currentPopup.getContent()
				var newPopupContent = null;
				var mIndex = popupContent.indexOf("<div class='ml'>");
				if (mIndex == -1) {
					newPopupContent = popupContent;
				} else {
					newPopupContent = popupContent.substring(0, mIndex) + "</div>";
				}
				currentPopup.setContent(newPopupContent);
				currentMarker.openPopup();					
				$('.custom-popup .leaflet-popup-close-button').addClass('finish');
				
				//
				currentMarker.setIcon(oldIcon);
				currentMarker.dragging.disable();
				that.map.flyTo(latlng);
			});
			
		});
		
		// 单一地址编辑纠错
		$('.coad-result-wrap .poilist > li .coad-data-oper a.bj').click(function() {
			var $li = $(this).closest('li');
			if ($li.hasClass('nomatch')) {
				return ;
			} else {
				var text = $li.find('h4 > a').text();
				var $html = $("<input type='text' value='" + text + "' />");
				$li.find('h4').html($html);
				$html.focus();
				$html.blur(function() {
					var value = $(this).val();
					if (!value) {
						return layer.alert('请输入地址', {icon: 3});
					} else {
						$li.find('h4').html("<a href='#' title='" + value + "'>" + value + "</a>");
					}
				});
			}
		});
		
		// 删除
		$('.coad-result-wrap .poilist > li .coad-data-oper a.sc').click(function() {
			
		});
		
		
	},
	
	// 修改标注图层的bound
	modifyBound : function(bounds) {
		var northEast = bounds.getNorthEast();
		var southWest = bounds.getSouthWest();
		var newSouthWest = L.latLng(southWest.lat, southWest.lng-(northEast.lng-southWest.lng)/2);
		var newBounds = L.latLngBounds(northEast, newSouthWest);
		return newBounds;
	},


}
