G.Geocoding = {
	map : null,
	vectorLayer : null,
	batchId : null,
	uploadId : null,
	geocodeType : 1,
	
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
		
		// 数据匹配完成
		$('.data-match-popup .import-data-btn button').eq(1).click(function() {
			
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


}
