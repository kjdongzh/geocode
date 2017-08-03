<%@ page language="java" import="java.util.*" pageEncoding="UTF-8" isELIgnored="false"%>
<%
	String basePath = request.getScheme() + "://" + request.getServerName() + ":" + request.getServerPort();
	String rootPath = basePath + request.getContextPath();
%>
<!doctype html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>地理编码服务系统</title>
<link href="${pageContext.request.contextPath}/css/reset.css" rel="stylesheet" />
<link href="${pageContext.request.contextPath}/css/geocode.css" rel="stylesheet" />
<link href="${pageContext.request.contextPath}/js/lib/leafletsdk/css/mc-all.css" rel="stylesheet" />
</head>
<body>

	<!--搜索-->
	<div class="search-tab-form">
		<ul class="src-tab-tit">
			<li class="pot accr"><a href="#">正向地理编码</a></li>
			<li class="rvr act"><a href="#">逆向地理编码</a></li>
		</ul>
		<div class="search-tab-con">
			<div class="src-tab-list" style="z-index: 2;">
				<div class="src-form">
					<input class="sg-input" type="text" />
					<span class="src-btn"></span>
				</div>
			</div>
			<div class="src-tab-list">
				<div class="src-form">
					<input class="jd-input" type="text" placeholder="经度" />
					<input class="wd-input" type="text" placeholder="纬度" />
					<span class="src-btn"></span>
				</div>
			</div>
		</div>
	</div>
	
	<!--右上角操作-->
	<div class="coadtall-bar">
		<div class="coad-ope">
			<a class="save" href="#"><em></em>保存</a>
			<b></b>
			<a class="batch" href="#"><em></em>批量</a>
		</div>
	</div>
	
	<!--搜索结果-->
	<div class="coad-result-wrap">
		<ul class="poilist">
		</ul>
		<div class="turn-page">
			<ul>
				<li class="act"><a href="#">1</a></li>
				<li><a href="#">2</a></li>
				<li><a href="#">3</a></li>
				<li><a href="#">4</a></li>
				<li class="next"><a href="#">下一页<i></i></a></li>
			</ul>
		</div>
		<div class="data-radio">
			<div class="types-select server-types">
				<a href="#" class="on" style="padding-left: 0;"><i></i>仅显示成功数据</a>
				<a href="#" ><i></i>仅显示失败数据</a>
			</div>
			<button>批量修改</button>
		</div>
	</div>
	
	<!--半透明bg-->
	<div class="translucent-bg"></div>
	<!--添加文件-->
	<div class="add-field-popup">
		<h2>添加文件</h2>
		<div class="keep-con">
			<ul>
				<li class="special-types">
					<label>编码操作</label>
					<div class="types-select server-types">
						<a href="#" class="on" style="padding-left: 0;"><i></i>正向地理编码</a>
						<a href="#" ><i></i>逆向地理编码</a>
					</div>
				</li>
				<li>
					<label>文件路径</label>
					<div class="input-box">
						<input style="width: 366px;" type="text" placeholder="*.xlsx,*.xls,*.txt,*.csv" />
						<em></em>
						<input class="upload-file" type="file"/>
					</div>
				</li>
			</ul>
		</div>
		<div class="import-data-btn">
			<button>确定</button>
			<button>取消</button>
		</div>
	</div>

	<!--正向数据匹配-->
	<div class="data-match-popup">
		<h2>数据匹配</h2>
		<div class="keep-con"></div>
		<div class="popup-close"></div>
		<div class="import-data-btn coad-data-btn">
			<button>上一步</button>
			<button>完成</button>
		</div>
	</div>

	<div id="map"></div>
	
	<script type="text/javascript" src="${pageContext.request.contextPath}/js/lib/jquery-1.10.2.js"></script>
	<script type="text/javascript" src="${pageContext.request.contextPath}/js/lib/jquery.form.js"></script>
	<script type="text/javascript" src="${pageContext.request.contextPath}/js/lib/leafletsdk/geoway.all.min.js"></script>
	<script type="text/javascript" src="${pageContext.request.contextPath}/js/lib/layer.js"></script>
	<script type="text/javascript" src="${pageContext.request.contextPath}/js/lib/template.js"></script>
	<script type="text/javascript" src="${pageContext.request.contextPath}/js/geocode/config.js"></script>
	<script type="text/javascript">
		G.root = "<%=rootPath%>";
	</script>
	<script type="text/javascript" src="${pageContext.request.contextPath}/js/geocode/geocode.js"></script>
	<script type="text/javascript" src="${pageContext.request.contextPath}/js/geocode/Template.js"></script>
	<script type="text/javascript">
		$(document).ready(function(){
			G.Geocoding.init();
		})
	</script>
</body>
</html>