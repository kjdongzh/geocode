G.Template = {
	/**
	 * id 模版文件名称 data 渲染数据 callback 渲染完成后的回调函数
	 */
	render : function(name, data, callback) {
		// 根据模版中的内容获取子模版的ID
		var getSubTemplateList = function(content) {
			var res = content.match(/\{\{include +'\w+'\}\}/g);
			var subTemp = [];

			if (res && res.length > 0) {
				for (var i = 0; i < res.length; i++) {
					var t = res[i].replace('{{include', '').replace('}}', '');
					t = $.trim(t);
					t = t.replace(/'/g, '');
					subTemp.push(t);
				}
			}
			return subTemp;
		};

		// 获取指定名称的模版及所有子模版，目前只能支持单级嵌套，不支持子模版再嵌入子模版
		var getAllTemplate = function(name, allDoneCallback) {
			var getSub = function(subs) {
				if (subs.length == 0) {
					allDoneCallback();
					return false;
				}

				var subname = subs.shift();

				if ($("#" + subname).length == 0) {
					var url = G.root + "/template/" + subname + ".html?d=" + new Date();
					$.get(url, function(subtemp) {
						$('body').append('<script id="' + subname + '" type="text/html">' + subtemp + '</script>');

						getSub(subs);
					});
				} else {
					getSub(subs);
				}
			}

			if ($("#" + name).length == 0) {
				var url = G.root + "/template/" + name + ".html?d=" + new Date();
				$.get(url, function(temp) {
					$('body').append('<script id="' + name + '" type="text/html">' + temp + '</script>');

					var subTemp = getSubTemplateList(temp);
					getSub(subTemp);
				});
			} else {
				var subTemp = getSubTemplateList($("#" + name).html());
				getSub(subTemp);
			}
		};

		var cb = function() {
			var html = template(name, data);
			callback(html);
		};
		getAllTemplate(name, cb);
	}
};

// 注册template全局方法
(function() {
	template.helper('numberToChina', function(number) {
		var displayArray = [ "一", "二", "三", "四", "五", "六", "七", "八", "九", "十" ];
		return displayArray[number];
	});

	template.helper('formatDistance', function(value) {
		return parseInt(value / 1000);
	});
	
	//保留8位有效小数，不足补0
	template.helper('toDecimal8', function(value) {
		var f = parseFloat(value);    
        if (isNaN(f)) {    
            return false;    
        }    
        var f = Math.round(value*100000000)/100000000;    
        var s = f.toString();    
        var rs = s.indexOf('.');    
        if (rs < 0) {    
            rs = s.length;    
            s += '.';    
        }    
        while (s.length <= rs + 8) {    
            s += '0';    
        }    
        return s;    
	});

	template.helper('formatSeconds', function(value) {
		var theTime = parseInt(value * 60);// 秒
		var theTime1 = 0;// 分
		var theTime2 = 0;// 小时
		if (theTime > 60) {
			theTime1 = parseInt(theTime / 60);
			theTime = parseInt(theTime % 60);
			if (theTime1 > 60) {
				theTime2 = parseInt(theTime1 / 60);
				theTime1 = parseInt(theTime1 % 60);
			}
		}

		var result = 0;
		if (theTime1 > 0) {
			result = "" + parseInt(theTime1) + "分钟";
		}
		if (theTime2 > 0) {
			result = "" + parseInt(theTime2) + "小时" + result;
		}

		return result;
	});

})();
