<%@page import="java.io.BufferedInputStream "%>
<%@page import="java.io.BufferedReader"%>
<%@page import="java.io.IOException"%>
<%@page import="java.io.InputStream"%>
<%@page import="java.io.InputStreamReader"%>
<%@page import="java.io.OutputStream"%>
<%@page import="java.net.HttpURLConnection"%>
<%@page import="java.net.Proxy"%>
<%@page import="java.net.URL"%>
<%@page import="java.net.URLDecoder"%>
<%@ page language="java" contentType="text/html; charset=utf-8" trimDirectiveWhitespaces="true"
	pageEncoding="utf-8"%>
<%
 	Proxy proxy = null;
	String urlString = request.getQueryString();
	urlString = URLDecoder.decode(urlString, "UTF-8");

	if (urlString.startsWith("url=")) {
		urlString = urlString.substring(4);
	}
	
	if (urlString.indexOf("requestTime") != -1) {
		urlString = urlString.split("requestTime")[0];
		urlString = urlString.substring(0, urlString.length() - 1);
	}

	if (urlString.indexOf("?") != -1) {
		urlString = urlString + "&charset=utf-8";
	} else {
		urlString = urlString + "?charset=utf-8";
	}

	HttpURLConnection conn = null;
	InputStream inStream = null;
	try {
		URL httpURL = new URL(urlString);
		if (httpURL.getProtocol().equalsIgnoreCase("HTTP") || httpURL.getProtocol().equalsIgnoreCase("HTTPS")) {
			if (proxy != null) {
				conn = (HttpURLConnection) httpURL.openConnection(proxy);
			} else {
				conn = (HttpURLConnection) httpURL.openConnection();
			}

			conn.setRequestMethod("GET");
			conn.setDoOutput(false);
			conn.setDoInput(true);
			conn.setUseCaches(false);
			conn.setConnectTimeout(6000);

			//in = conn.getInputStream();
			//返回 json 
			if (urlString.toLowerCase().contains("callbackformat=json")) {
				response.setContentType("text/json; charset=UTF-8");
			} else {
				response.setContentType("text/xml; charset=UTF-8");
			}

			inStream = new BufferedInputStream(conn.getInputStream());
			BufferedReader rd = new BufferedReader(new InputStreamReader(inStream, "UTF-8"));
			String tempLine = rd.readLine();
			StringBuffer scenarioSb = new StringBuffer();
			while (tempLine != null) {
				tempLine = tempLine.replace("xmlns=", " xmlns:new=");
				tempLine = tempLine.replace("xmlns:", " xmlns:");
				tempLine = tempLine.replace("xsi:", " xsi:");
				scenarioSb.append(tempLine);
				tempLine = rd.readLine();
			}
			String result = scenarioSb.toString();
			out.print(result);
		}
	} catch (IOException e) {
		response.setStatus(500, e.getLocalizedMessage());
	} finally {
		if (inStream != null) {
			inStream.close();
			inStream = null;
		}
		if (conn != null) {
			conn.disconnect();
			conn = null;
		}
	}
%>