G.Geocoding = {
	map : null,          // leaflet的map对象
	vectorLayer : null,  // leaflet的vectorLayer对象，用于显示地图标注
	uploadId : null,	 // 上传文件后生成的该文件的唯一性标识
	batchId : null,      // 批量匹配后生成匹配结果的唯一性标识
	geocodeType : 1,     // 地理编码类型，1正向，2逆向
	popupFields : [],    // 地图标注显示内容的字段
	
	init : function() {
		this.initMap();
		this.initEvent();
		
		// 初始化page
		layui.use('laypage', function() { });
		
		// 测试，实际应用中注释掉
		this.batchId = '1eff8ec4be9a459da216f9e71ca826f9_P';//'c296faad2a97470bb0077bdc53ebe37c_R'
		this.popupFields = [['位置坐标(GEO)', '0'],['名称(NAME)', '1'],['简称(JC)', '2'],['所在设区市(SZS)', '3']];
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
	    
	    // 显示坐标
	    that.map.addEventListener('mousemove', function(ev) {
    	   var lat = parseFloat(ev.latlng.lat).toFixed(8);
    	   var lng = parseFloat(ev.latlng.lng).toFixed(8);
    	   $('.latlng-bar').html(lat + "," + lng);
    	});
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
		
		// popup关闭按钮
		$('.popup-close').click(function() {
			var clas = $(this).parent().attr('class');
			$(this).parent().hide();
			$('.translucent-bg').hide();
			
			if (clas == 'data-modify-popup') {
				var currentPage = $('#data-page-turn span.layui-laypage-curr > em:last-child').text();
				var batchType2 = $('.coad-result-wrap .data-radio .types-select a.on').index() + 1;
				currentPage = currentPage ? currentPage : 1; // 跳转页面不一定存在
				that.getBatchList(currentPage, batchType2);
			}
			
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
			that.hideAllPopup();
			$('.translucent-bg').show();
			$('.add-field-popup').show();
		});
		
		// 保存
		$('.coadtall-bar .save').click(function(){
			if (that.batchId) {
				that.hideAllPopup();
				$('.translucent-bg').show();
				$('.keep-field-popup').show();
			} else {
				return layer.alert('请先上传批量匹配文件', {icon: 3});
			}
		});
		
		// 选择编码操作类别
		$('.add-field-popup .types-select a').click(function() {
			$(this).addClass('on').siblings().removeClass('on');
			that.geocodeType = $('.add-field-popup .types-select a.on').index() + 1;
		});
		
		
		$(".add-field-popup .upload-file").click(function() {
			$(this).val('');
			$(this).prev().prev().val('');
		})
		
		$(".add-field-popup .upload-file").change(function() {
		    var name = this.files && this.files.length ?
		          this.files[0].name : this.value.replace(/^C:\\fakepath\\/i, '');
		    $(this).prev().prev().val(name);
		    $(this).attr('value', name);
		})
		
		// 添加文件下一步
		$('.add-field-popup .import-data-btn button').eq(0).click(function() {
			var fileName = $('.upload-file').prev().prev().val();
			if (!fileName) {
				return layer.alert('请先选择文件', {icon: 3});
			} else {
				that.geocodeType = $('.add-field-popup .types-select a.on').index() + 1;
				that.upload();
			}
		});
		
		// 添加文件取消
		$('.add-field-popup .import-data-btn button').eq(1).click(function() {
			$('.translucent-bg').hide();
			$('.add-field-popup').hide();
			$('.add-field-popup .upload-file').prev().prev().val('');
			$('.add-field-popup .types-select a').eq(0).addClass('on').siblings().removeClass('on');
		});
		
		// 数据匹配上一步
		$('.data-match-popup .import-data-btn button').eq(0).click(function() {
			$('.data-match-popup .keep-con').html('');
			$('.data-match-popup').hide();
			$('.add-field-popup').show();
			
			var $upload = $(".add-field-popup .upload-file");
			var name = $upload.attr('value');
			$upload.prev().prev().val(name);
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
				that.popupFields = [];
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
			$(this).toggleClass('on').siblings().removeClass('on');
			var batchType = $('.coad-result-wrap .data-radio .types-select a.on').index() + 1;
			that.getBatchList(1, batchType);
		});
		
		// 批量修改
		$('.coad-result-wrap .data-radio > button').click(function() { 
			that.modify(1);
			$('.data-modify-popup .special-types .types-select a').removeClass('on');
		});
		
		// 批量修改中仅显示成功或失败的数据
		$('.data-modify-popup .special-types .types-select a').click(function() {
			$(this).toggleClass('on').siblings().removeClass('on');
			var batchType = $('.data-modify-popup .special-types .types-select a.on').index() + 1;
			that.modify(1, batchType);
		});
		
		// 批量修改中上下页切换
		$('.data-modify-popup .data-dis-btn a').click(function() {
			var pageAttribute = $('.data-modify-popup .zd-form > table').attr('type');
			var pageNum = parseInt(pageAttribute.split(',')[0]);
			var pageSum = parseInt(pageAttribute.split(',')[1]);
			var page = null;
			if ($(this).hasClass('left')) {
				if (pageNum == 1) {
					return;
				} else {
					page = pageNum - 1;
				}
			} else if ($(this).hasClass('right')){
				if (pageNum == pageSum) {
					return;
				} else {
					page = pageNum + 1;
				}
			} else {
				return;
			}
			var batchType = $('.data-modify-popup .special-types .types-select a.on').index() + 1;
			that.modify(page, batchType);
		});
		
		// 批量修改中批量删除
		$('.data-modify-popup .data-dis-btn button').click(function() {
			var lineNumbers = '';
			$('.data-modify-popup .keep-con .zd-form table tr > td > span.on').each(function(index) {
				var line = $(this).closest('tr').attr('type') + ',';
				lineNumbers += line;
			});
			
			if (lineNumbers.length == 0) {
				return;
			} else {
				var url = G.restUrl + "/geocode/batchDelete?batchId=" + that.batchId + "&lineNumbers=" + lineNumbers;
				$.ajax({
					url: url,
					dataType : "jsonp",
					jsonp : "callback",
					success : function(data) {
						if (data.status == "ok") {
							var pageAttribute = $('.data-modify-popup .zd-form > table').attr('type');
							var pageNum = parseInt(pageAttribute.split(',')[0]);
							var batchType = $('.data-modify-popup .special-types .types-select a.on').index() + 1;
							that.modify(pageNum, batchType);
						} else {
							return layer.alert(data.message, {icon: 3});
						}
					}
				});					
			}
			
		});
		
		// 批量修改中重新匹配
		$('.data-modify-popup > .import-data-btn button').eq(1).click(function() {
			var url = G.restUrl + "/geocode/rebatch?batchId=" + that.batchId;
			var index = layer.load();
			
			$.ajax({
				url: url,
				type: 'GET',
				dataType : "jsonp",
				jsonp : "callback",
		        success: function() {
		        	layer.close(index);
		        	return layer.alert("重新匹配成功", {icon: 1});
		        },
		        error: function() {
		        	return layer.close(index);
		        }
			});
			
		});
		
		// 批量修改中保存修改
		$('.data-modify-popup > .import-data-btn button').eq(0).click(function() {
			var modifys = [];
			$('.data-modify-popup .zd-form > table tr > td.modified').each(function(index) {
				var line = $(this).closest('tr').attr('type');
				var index = $(this).index() - 1;
				var val = $(this).text();
				modifys.push({
					"line": parseInt(line),
					"index": parseInt(index),
					"value": val
				});
			});
			if (modifys.length == 0) {
				return;
			}
			var url = G.restUrl + "/geocode/batchSourceUpdate?batchId=" + that.batchId;
			$.ajax({
				url: url,
				type: 'POST',
				data: JSON.stringify(modifys),
				contentType: 'application/json;charset=utf-8',
				dataType: 'json',
		        success: function(){
		        	return layer.alert("修改成功", {icon: 1});
		        }
			});
		});
		
		// 确定保存
		$('.keep-field-popup > .import-data-btn > button').eq(0).click(function() {
			var saveType = $('.keep-field-popup .types-select > a.on').attr('type');
			that.hideAllPopup();
			window.location = G.restUrl + "/geocode/batchSave?batchId=" + that.batchId + "&saveType=" + saveType;
		});
		
		// 取消保存
		$('.keep-field-popup > .import-data-btn > button').eq(1).click(function() {
			$('.keep-field-popup').hide();
			$('.translucent-bg').hide();
		});	
		
		$('.keep-field-popup .types-select > a').click(function() {
			$(this).addClass('on').siblings().removeClass('on');
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
				$('.coad-result-wrap .poilist').children().remove();
				$('.coad-result-wrap .turn-page').hide();
				$('.coad-result-wrap .data-radio').hide();
				$('#data-page-turn').hide();
				$('.coad-result-wrap').show();
				that.hideAllPopup();
				
				that.vectorLayer.clearLayers();
				
				if (data.status == "ok") {
					var result = data.result;
					if (result) {
						G.Template.render("resultTmpl", data, function(html) {
							$('.coad-result-wrap .poilist').append(html);
							
							var _icon = L.icon({
								iconUrl: G.root + '/images/num1.png',
								iconSize:     [21, 26],
								iconAnchor:   [10.5, 26]
							});
							var mark = L.marker([result.location.lat, result.location.lon], {icon: _icon});
							
							var popupContent = "<div class='tz-edit'><p>省份:  " + result.province + "</p>"
											+ "<p>城市:  " + result.city + "</p>";
							
							// 小比例尺下只显示到省级或市级，即没有搜索到相关地址
							if(result.county && result.county.length > 0) {
								popupContent = popupContent + "<p>区县:  " + result.county + "</p>"
							}
							
							if(result.town && result.town.length > 0) {
								popupContent = popupContent + "<p>乡镇:  " + result.town + "</p>"
							}
							popupContent = popupContent + "<p>地址:  " + result.address + "</p>" + "</div>";
											
							mark.bindPopup(popupContent, {className: 'custom-popup'}).openPopup();
							mark.on('popupopen', function() {
								$('.custom-popup .leaflet-popup-close-button').addClass('close');
							});
							that.vectorLayer.addLayer(mark);							
							that.map.flyTo(L.latLng(result.location.lat, result.location.lon));
							
						});
					} else {
						$('.coad-result-wrap').hide();
						return layer.alert("未查到匹配内容", {icon: 2});
					}
				} else {
					$('.coad-result-wrap').hide();
					return layer.alert(data.message, {icon: 2});
				}
			}
		});
	},
	
	// 批量匹配时上传文件
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
						//$('.add-field-popup .import-data-btn button').eq(1).click();
						$('.add-field-popup').hide();
						$('.add-field-popup .upload-file').prev().prev().val('');
						$('.add-field-popup .types-select a').eq(0).addClass('on').siblings().removeClass('on');
						$('.data-match-popup').show();
					});
				}
			}
		});
	},
	
	// 上传文件结束后进行批量匹配
	batch : function() {
		var that = this;
		var url;
		var formData = new FormData();
		formData.append("uploadId", that.uploadId);
		
		$('.search-tab-form .src-tab-tit li').eq(that.geocodeType-1).click();
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
		
		var loadingIndex = layer.load();
		$.ajax({
			url : url,
			type : 'POST',
			data : formData,
			dataType : 'json',
			processData: false,
		    contentType: false,
			success : function(data) {
				layer.close(loadingIndex);
				$('.search-tab-form .search-tab-con .src-tab-list .src-form input').val('');
				$('.search-tab-form .src-tab-tit li').eq(that.geocodeType-1).click();
				if (data.status == "ok") {
					that.batchId = data.batchId;
					G.Template.render("batchListTmpl", data.batchList, function(html) {
						$('.coad-result-wrap .poilist').children().remove();
						$('.coad-result-wrap .poilist').append(html);
						that.hideAllPopup();
						$('#data-page-turn').show();
						$('.coad-result-wrap .turn-page').show();
						$('.coad-result-wrap .data-radio').show();
						$('.coad-result-wrap .data-radio .types-select a').removeClass('on');
						$('.coad-result-wrap').show();
						// 分页
						layui.laypage({
						    cont: 'data-page-turn',
					        pages: data.batchList.pageSum,
					        curr: data.batchList.pageNum,
					        first: '首页',
					        last: '尾页',
					        groups: 2,
					        prev: '<em><</em>',
					        next: '<em>></em>',
					        skin: '#1E9FFF',
					        jump: function(obj, first){
					        	if (!first) {
					        		var curr = obj.curr;
					        		var type = $('.coad-result-wrap .data-radio .types-select a.on').index() + 1;
					        		that.getBatchList(curr, type);
					        	}
					        }
					    });
						
						that.vectorLayer.clearLayers();
						
						var list = data.batchList.results;
						var failLon = 112.241865807;
						var failLat = 30.332590523;
						var allFailed = true;
						for (var i = 0; i < list.length; i++) {
							if (list[i].status == 'success') {
								failLon = list[i].resultLon;
								failLat = list[i].resultLat;
								allFailed = false;
								break;
							}
						}
						for (var i = 0; i < list.length; i++) {
							var mark = null;
							var popupContent = null;
							if(list[i].status == 'success' || list[i].resultLon.length > 0) {
								var _icon = L.icon({
									iconUrl: G.root + '/images/num' + (i + 1) + ".png",
									iconSize:     [21, 26],
									iconAnchor:   [10.5, 26]
								});
								mark = L.marker([list[i].resultLat, list[i].resultLon], {icon: _icon, id: i});
								
							} else {
								var _icon = L.icon({
									iconUrl: G.root + '/images/num0.png',
									iconSize:     [1, 1],
									iconAnchor:   [10.5, 26]
								});
								mark = L.marker([failLat, failLon], {icon: _icon, id: i});
							}
							
							if (that.popupFields.length > 0) {
								popupContent = "<div class='tz-edit'>";
								for(var j = 0; j < that.popupFields.length; j++) {
									popupContent = popupContent + "<p>" + that.popupFields[j][0] + ":  " + list[i][that.popupFields[j][1]]+"</p>";
								}
								mark.bindPopup(popupContent, {className: 'custom-popup'});
							}
							mark.on('popupopen', function() {
								$('.custom-popup .leaflet-popup-close-button').addClass('close');
							});
							mark.on('click', function(e) {
								var index = e.target.options.id;
								$('.coad-result-wrap .poilist>li').eq(index).click();
							});
							that.vectorLayer.addLayer(mark);
						}
						
						var bounds = null;
						if (allFailed) {
							bounds = L.latLngBounds(L.latLng(27.2161, 118), L.latLng(31.5203, 123));
						} else {
							bounds = that.vectorLayer.getBounds();
						}
						that.map.fitBounds(that.modifyBound(bounds));
						that.bindMapEvents();
					});
				} else {
					that.vectorLayer.clearLayers();
					return layer.alert(data.message, {icon: 2});
				}
			}
		});
		
		
	},	
	
	// 批量修改
	modify : function(pageNum, batchType) {
		var that = this;
		batchType = batchType ? batchType :  '0';
		var url = G.restUrl + "/geocode/batchSourceList?batchId=" + that.batchId + "&pageNum=" + pageNum + "&batchType=" + batchType;
		$.ajax({
			url: url,
			dataType : "jsonp",
			jsonp : "callback",
			success : function(data) {
				if (data.status == 'ok') {
					G.Template.render("batchSourceListTmpl", data, function(html) {
						$('.data-modify-popup .zd-form').html(html);
						$('.translucent-bg').show();
						$('.data-modify-popup').show();
						$('.data-modify-popup .zd-form table tr td:nth-child(1) span').on('click', function() {
							$(this).toggleClass('on');
						});
						
						$(".data-modify-popup .zd-form table").colResizable({
							liveDrag:true, 
							gripInnerHtml:"<div class='grip'></div>", 
							draggingClass:"dragging", 
							onResize:function(){}
						});
						// 修改
						$('.data-modify-popup .zd-form table tr > td:not(:first-child)').click(function() {
							var $td = $(this);
							var text = $td.text();
//							if (!text) {
//								return;
//							}
							var $html = $("<input type='text' value='" + text + "' />");
							$td.html($html);
							$html.focus();
							$html.click(function(event){//防止事件冒泡
								event.stopPropagation();
							});
							$html.blur(function() {
								var value = $(this).val();
								if (!value) {
									return layer.confirm('未输入任何信息，是否确定？', {icon: 3}, function(index){
										$td.html('');
								        layer.close(index);
								    });
								} else {
									$td.html(value);
									if (text != value) {
										$td.addClass('modified');
									}
								}
							});
						});
					})
				} else {
					return layer.alert(data.message, {icon: 2});
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
		$('.data-match-popup .zd-btn .add').click(function() {
			var index = $('.data-match-popup .select-field > .zd-main > li').length + 1;
			
			if (index > 1) {
				var type = $('.data-match-popup .select-field .zd-main>li span.right').eq(index-2).attr('type');
				if (!type) {
					return layer.alert('请选择字段', {icon: 2});
				}
			}
			
			
			var $html = $('<li><a href="javascript:void(0);"><span class="left">' + index + '</span><span class="right">请选择字段</span></a></li>');
			$('.data-match-popup .select-field > .zd-main').append($html);
			$('.data-match-popup .select-field > .zd-main').scrollTop( $('.data-match-popup .zd-main')[0].scrollHeight );
			$html.on('click', function() {
				$(this).addClass('select').siblings().removeClass('select');
			});
			$html.find('span.right').on('click', function() {
				var index = $(this).parent().parent().index() + 1;
				var scrollTop = $(".data-match-popup .select-field > .zd-main").scrollTop();
				var top = index*30 - parseInt(scrollTop) + 2;
				$('.data-match-popup .select-field .zd-select').css('top', top + 'px');
				$('.data-match-popup .select-field .zd-select').toggle();
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
			$('.data-match-popup .select-field .zd-select').hide();
		});
		// 显示字段选项
		$('.data-match-popup .select-field .zd-select li a').click(function() {
			var selected = $(this).hasClass('isSelected');
			if (!selected) {
				var type = $(this).attr('type');
				var text = $(this).text();
				$('.select-field .zd-main>li.select span.right').attr('type', type);
				$('.select-field .zd-main>li.select span.right').text(text);
				$(this).addClass('isSelected');
				$('.select-field .zd-select').hide();				
			}
		});
		
		// 数据展示
		$('.data-match-popup .zd-btn .right').click(function() {
			var num_page = $('.data-match-popup .zd-form table').attr('type');
			if (!num_page) {
				return ;
			} else {
				var pageNum = parseInt(num_page.split(',')[0]);
				var pageSum = parseInt(num_page.split(',')[2]);
				if (pageNum == pageSum) {
					return;
				}
				var pageSize = num_page.split(',')[1];
				that.getUploadList(that.uploadId, pageNum + 1, pageSize);
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
						var pageSum = $('.data-match-popup .zd-form table').attr('type').split(',')[2];
						$('.data-match-popup .zd-form table').attr('type', data.pageNum + ',' + data.pageSize + ',' + pageSum);
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
		pageNum = pageNum ? pageNum : '1';
		batchType = batchType ? batchType : '0';
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
					//$('.data-match-popup').hide();
					that.hideAllPopup();
					$('#data-page-turn').show();
					$('.coad-result-wrap .turn-page').show();
					$('.coad-result-wrap .data-radio').show();
					$('.coad-result-wrap').show();
					
					layui.laypage({
					    cont: 'data-page-turn',
				        pages: data.pageSum,
				        curr: data.pageNum,
				        first: '首页',
				        last: '尾页',
				        groups: 2,
				        prev: '<em><</em>',
				        next: '<em>></em>',
				        skin: '#1E9FFF',
				        jump: function(obj, first){
				        	if (!first) {
				        		var curr = obj.curr;
				        		var type = $('.coad-result-wrap .data-radio .types-select a.on').index() + 1;
				        		that.getBatchList(curr, type);
				        	}
				        }
				    });
					
					that.vectorLayer.clearLayers();
					
					var list = data.results;
					
					var failLon = 112.241865807;
					var failLat = 30.332590523;
					var allFailed = true;
					for (var i = 0; i < list.length; i++) {
						if (list[i].status == 'success') {
							failLon = list[i].resultLon;
							failLat = list[i].resultLat;
							allFailed = false;
							break;
						}
					}
					
					for (var i = 0; i < list.length; i++) {
						var mark = null;
						var popupContent = null;
						if(list[i].status == 'success' || list[i].resultLon.length > 0) {
							var _icon = L.icon({
								iconUrl: G.root + '/images/num' + (i + 1) + ".png",
								iconSize:     [21, 26],
								iconAnchor:   [10.5, 26]
							});
							mark = L.marker([list[i].resultLat, list[i].resultLon], {icon: _icon, id: i});
						} else {
							var _icon = L.icon({
								iconUrl: G.root + '/images/num0.png',
								iconSize:     [1, 1],
								iconAnchor:   [10.5, 26]
							});
							mark = L.marker([failLat, failLon], {icon: _icon, id: i});
						}
						
						if (that.popupFields.length > 0) {
							popupContent = "<div class='tz-edit'>";
							for(var j = 0; j < that.popupFields.length; j++) {
								popupContent = popupContent + "<p>" + that.popupFields[j][0] + ":  " + list[i][that.popupFields[j][1]]+"</p>";
							}
							popupContent += "</div>";
							mark.bindPopup(popupContent, {className: 'custom-popup'});
						}
						mark.on('popupopen', function() {
							$('.custom-popup .leaflet-popup-close-button').addClass('close');
						});
						mark.on('click', function(e) {
							var index = e.target.options.id;
							$('.coad-result-wrap .poilist>li').eq(index).click();
						});
						that.vectorLayer.addLayer(mark);
					}
					
					
					var bounds = null;
					if (allFailed) {
						bounds = L.latLngBounds(L.latLng(27.2161, 118), L.latLng(31.5203, 123));
					} else {
						bounds = that.vectorLayer.getBounds();
					}
					that.map.fitBounds(that.modifyBound(bounds));
					that.bindMapEvents();
				});
			}
		});
	},
	
	// 匹配结果预览相关事件
	bindMapEvents : function() {
		var that = this;
		
		// 鼠标滑过左侧面板，图标变换
//		$('.coad-result-wrap .poilist>li').hover(
//			function() {
//				var $li = $(this).closest('li');
//				var lonAttr = $li.find('.span-lng').text();
//				if ($(this).hasClass('nomatch') && lonAttr.length == 0) {
//					return;
//				} else {
//					var index = $(this).index();
//					var newIcon = L.icon({
//						iconUrl: G.root + '/images/num' + (index + 1) + "b.png",
//						iconSize:     [21, 26],
//						iconAnchor:   [10.5, 26]
//					});
//					that.vectorLayer.getLayers()[index].setIcon(newIcon);
//				}
//			}, function() {
//				var $li = $(this).closest('li');
//				var lonAttr = $li.find('.span-lng').text();
//				if (lonAttr.length == 0 || $(this).hasClass('draggabled')) {
//					return;
//				} else {
//					var index = $(this).index();
//					var newIcon = L.icon({
//						iconUrl: G.root + '/images/num' + (index + 1) + ".png",
//						iconSize:     [21, 26],
//						iconAnchor:   [10.5, 26]
//					});
//					that.vectorLayer.getLayers()[index].setIcon(newIcon);
//				}
//			}
//		); 
		
		
		// 点击左侧面板
		$('.coad-result-wrap .poilist>li').click(function() {
			
			var $li = $(this);
			var index = $li.index();
			
			// 清空面板其他条目的高亮按钮和tooltip
			$li.siblings().each(function() {
				$(this).find('a.dw').removeClass('hov');
			});
			
			var isHov = $li.find('a.dw').hasClass('hov');
			
			var layerIndex = -1;
			that.vectorLayer.eachLayer(function(l) {
				layerIndex++;
				if (l.getTooltip) {
		            var toolTip = l.getTooltip();
		            if (toolTip) {
		            	if (index == layerIndex && isHov) {
		            		l.openTooltip();
		            	} else {
		            		l.closeTooltip(toolTip);
		            	}
		            }
		        }
		     });
			
			var lonAttr = $li.find('.span-lng').text();
			if ($li.hasClass('nomatch') && lonAttr.length == 0) {
				return;
			} else {
				$li.addClass('selected').siblings().removeClass('selected');
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
						markers[i].setZIndexOffset(1000);
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
						markers[i].setZIndexOffset(0);
					}
				}
				that.map.flyTo(latlng);
			}
		});
		
		// 坐标纠错或补标
		$('.coad-result-wrap .poilist > li .coad-data-oper a.dw').click(function(event) {
			//event.stopPropagation(); 
			
			var $li = $(this).closest('li');
			var index = $li.index();
			
			$(this).addClass('hov');
			if ($li.hasClass('draggabled')) {
				return;
			}
			
			$li.addClass('draggabled');
			var currentMarker = that.vectorLayer.getLayers()[index];
			var currentPopup = currentMarker.getPopup();
			
			var lonAttr = $li.find('.span-lng').text();
			if ($li.hasClass('nomatch') && lonAttr.length == 0) {
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
			
			currentMarker.bindTooltip("拖动鼠标修改坐标").openTooltip();
	        
			currentMarker.on('click', function (e) {
				e.target.closeTooltip();
		    });
			
			currentMarker.dragging.enable();
			currentMarker.on('drag', function(e) {
				e.target.closeTooltip();
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
				
				// 修改左侧面板坐标
				var lngStr = latlng.lng.toString();
				var latStr = latlng.lat.toString();
				$li.find('.span-lng').text(lngStr.substring(0, lngStr.indexOf('.') + 9));
				$li.find('.span-lat').text(latStr.substring(0, lngStr.indexOf('.') + 9));
				
				// 修改popup
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
				$('.custom-popup .leaflet-popup-close-button.finish').click(function(fe) {
					fe.preventDefault();
					var lngStr = latlng.lng.toString();
					var latStr = latlng.lat.toString();
					var url = G.restUrl + "/geocode/batchUpdate?batchId=" + that.batchId + "&lineNumber=" + $li.attr('type')
					+ "&resultAddress=&resultLon=" + lngStr.substring(0, lngStr.indexOf('.') + 9)  + "&resultLat=" + latStr.substring(0, lngStr.indexOf('.') + 9);
					$.ajax({
							url: url,
							dataType : "jsonp",
							jsonp : "callback",
							success : function(data) {
								if (data.status == "ok") {
									var currentPage = $('#data-page-turn span.layui-laypage-curr > em:last-child').text();
									var batchType = $('.coad-result-wrap .data-radio .types-select a.on').index() + 1;
									return that.getBatchList(currentPage, batchType);
								} else {
									return layer.alert(data.message, {icon: 3});
								}
							}
					});
				});
				that.map.flyTo(latlng);
				
				// 修改服务端坐标，刷新页面
//				var lngStr = latlng.lng.toString();
//				var latStr = latlng.lat.toString();
//				var url = G.restUrl + "/geocode/batchUpdate?batchId=" + that.batchId + "&lineNumber=" + $li.attr('type')
//				+ "&resultAddress=&resultLon=" + lngStr.substring(0, lngStr.indexOf('.') + 9)  + "&resultLat=" + latStr.substring(0, lngStr.indexOf('.') + 9);
//				$.ajax({
//						url: url,
//						dataType : "jsonp",
//						jsonp : "callback",
//						success : function(data) {
//							if (data.status == "ok") {
//								var currentPage = $('#data-page-turn span.layui-laypage-curr > em:last-child').text();
//								var batchType = $('.coad-result-wrap .data-radio .types-select a.on').index() + 1;
//								return that.getBatchList(currentPage, batchType);
//							} else {
//								return layer.alert(data.message, {icon: 3});
//							}
//						}
//				});
			});
			
		});
		
		// 单一地址编辑纠错
		$('.coad-result-wrap .poilist > li .coad-data-oper a.bj').click(function(event) {
			event.stopPropagation(); 
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
						if (text != value) {
							var url = G.restUrl + "/geocode/batchUpdate?batchId=" + that.batchId + "&lineNumber=" + $li.attr('type')
									+ "&resultAddress=" + value + "&resultLon=&resultLat=";
							$.ajax({
									url: url,
									dataType : "jsonp",
									jsonp : "callback",
									success : function(data) {
										if (data.status == "ok") {
											var currentPage = $('#data-page-turn span.layui-laypage-curr > em:last-child').text();
											var batchType = $('.coad-result-wrap .data-radio .types-select a.on').index() + 1;
											return that.getBatchList(currentPage, batchType);
										} else {
											return layer.alert(data.message, {icon: 3});
										}
									}
							});
						}
					}
				});
			}
		});
		
		// 删除
		$('.coad-result-wrap .poilist > li .coad-data-oper a.sc').click(function(event) {
			event.stopPropagation(); 
			var $li = $(this).closest('li');
			 var isDelete = false;
			 layer.confirm('确定删除?', {
				  icon: 3,
			      btn: ['是','否'],
			      yes: function(index){
			    	  isDelete = true;
			    	  layer.close(index);
			      },
			      btn2: function(index){
			    	  isDelete = false;
			    	  layer.close(index);
			      },
			      end: function(){
			    	  if (isDelete) {
			  			var url = G.restUrl + "/geocode/batchDelete?batchId=" + that.batchId + "&lineNumbers=" + $li.attr('type');
			  			$.ajax({
			  				url: url,
			  				dataType : "jsonp",
			  				jsonp : "callback",
			  				success : function(data) {
			  					if (data.status == "ok") {
			  						var currentPage = $('#data-page-turn span.layui-laypage-curr > em:last-child').text();
			  						var length = $('.coad-result-wrap .poilist > li').length;
			  						if (currentPage > 1 && length == 1) {
			  							currentPage = currentPage - 1;
			  						}
			  						var batchType = $('.coad-result-wrap .data-radio .types-select a.on').index() + 1;
			  						return that.getBatchList(currentPage, batchType);
			  					} else {
			  						return layer.alert(data.message, {icon: 3});
			  					}
			  				}
			  			});	
			    	  } 
			      }
			});
			
			
					
		});
		
		
	},
	
	// 修改标注图层的bound
	modifyBound : function(bounds) {
		var northEast = bounds.getNorthEast();
		var southWest = bounds.getSouthWest();
		var newSouthWest = L.latLng(southWest.lat - 0.002, southWest.lng-(northEast.lng-southWest.lng)/2);
		var newNorthEast = L.latLng(northEast.lat + 0.001, northEast.lng);
		var newBounds = L.latLngBounds(newNorthEast, newSouthWest);
		return newBounds;
	},
	
	// 隐藏所有的弹出窗口
	hideAllPopup : function() {
		$('.translucent-bg').hide();
		$('.add-field-popup').hide();
		$('.data-match-popup').hide();
		$('.data-modify-popup').hide();
		$('.keep-field-popup').hide();
	},


}
