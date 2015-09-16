// everything is wrapped in the SB_XD function to reduce namespace collisions
var SB_XD = function(){
  

    var cache_bust = 1,
    window = this;
    var inviewEnableInteraction = false;

    return {
        postMessage : function(message, target_url, target) {
        	//console.log("postMessage", message);
            
            if (!target_url) { 
                return; 
            }
    		message += '|'+window.location.href;
    		target = target || parent;  // default to parent
    		
            if (window['postMessage']) {
                // the browser supports window.postMessage, so call it with a targetOrigin
                // set appropriately, based on the target_url parameter.
                target['postMessage'](message, target_url.replace( /([^:]+:\/\/[^\/]+).*/, '$1'));

            } else if (target_url) {
                // the browser does not support window.postMessage, so set the location
                // of the target to target_url#message. A bit ugly, but it works! A cache
                // bust parameter is added to ensure that repeat messages trigger the callback.
                target.location = target_url.replace(/#.*$/, '') + '#' + (+new Date) + (cache_bust++) + '&' + message;
            }
        }
    };
}();

var originalSourceGlobal;
var sbPlayerId;
var isInView = false;
var lastInviewAction = "pause";

iv_noAds = function()
{
	originalSourceGlobal.postMessage("InView|iv_noAds", "*");
}

inviewAdFinished = function()
{
	originalSourceGlobal.postMessage("InView|iv_onSbFinish|Finish", "*");	
}

inviewContentFinished = function(e)
{
	originalSourceGlobal.postMessage("InView|iv_onSbFinish|Finish", "*");
}

inviewContentStopped = function(e)
{
	originalSourceGlobal.postMessage("InView|iv_onSbFinish|Finish", "*");
}

inviewContentStarted = function()
{
	originalSourceGlobal.postMessage("InView|iv_onContentStarted", "*");
}


getInview = function()
{
	return isInView;
}

getInviewPlayingAction = function()
{
	return lastInviewAction;
}

var iv_lastAdAction = "";
iv_adAction = function(type)
{
	iv_lastAdAction = type;
	
	originalSourceGlobal.postMessage("InView|iv_adAction|"+type, "*");
}

//Social widget, video element replay
respondToSizingMessage = function(e) {
	//console.log("postMessage", e.data)
	
	//if(e.origin == 'http://origin-domain.com') {
    	// e.data is the string sent by the origin with postMessage.
		if(e.data == 'Replay') {
			//Replay animated snapshot - CPV, called when swf animation ends
			var videoElement = document.getElementById('cpvImage');
			if(videoElement == undefined) {
				var videoElement = document.getElementById('syndicatedImage');
			}
			videoElement.play();
		} else if(e.data == 'Pause Flash') {
			//Pause Flash player CPV, called FROM expandable
			if($sb(playerIdDiv)) {
				$sb(playerIdDiv).pause();
			}
		} else if(e.data == 'Expandable') {
			//Show expandable, click on swf animation
			if(typeof cpvImageClick == 'function') {   
				cpvImageClick();   
			} else {
				syndicatedImageClick();
			}


		} else if(e.data.indexOf("InView") != -1)
		{

			//var msg = "InView|"+action+"|"+reaction+"|" + isSbInFrame+"|"+elementId+"|"+sbAllowViewForAd+"|"+sbAllowVolumeForAd+"|"+sbAllowViewForContent+"|"+sbAllowVolumeForContent;

			isInView = true;
			
			var msgElements = e.data.split("|");
			//console.log("p -  msg", msgElements)
			var action = msgElements[1].toString();
			var reaction = msgElements[2];
			var isIframe = msgElements[3];
			var isViewForAds = msgElements[5];
			var isVolumeForAds = msgElements[6];
			var isViewForContent = msgElements[7];
			var isVolumeForContent = msgElements[8];
			var isCloseOnAd = msgElements[9];
			var playerIdPart;
		
			if(isIframe)
			{
				playerIdPart = msgElements[4].substring(0, msgElements[4].indexOf("_"));
			}

			if(action.indexOf("setPlayingAction_") != -1)
			{
				lastInviewAction = action.substring(16, action.length);
				
				return;
			}

			var divs = document.getElementsByTagName("*");
			for (var i = 0; i < divs.length; i++) {

				
				if(divs[i].className && divs[i].className == "videoPlayer" && divs[i].id && divs[i].id.toString().indexOf(playerIdPart) != -1)
				{
					if($sb(divs[i].id))
					{
						

						if(action.indexOf("registerOnFinish") != -1)
						{
							originalSourceGlobal = e.source;
							sbPlayerId = divs[i].id;
							
							if(action == "registerOnFinishAd") inviewEnableInteraction = true;
							else if(action == "registerOnFinishContent")
							{
								$sb(divs[i].id).onFinish(inviewContentFinished);	
								$sb(divs[i].id).onStop(inviewContentStopped);	
							} 

							$sb(divs[i].id).onBegin(inviewContentStarted);

						}else{

							originalSource = null;
							var result;
							if(action == "playInview" || action == "pauseInview")
							{
								result = $sb(divs[i].id)[action](isViewForAds=="true", isViewForContent=="true", isCloseOnAd);
							}else if(action == "muteInview" || action == "unmuteInview")
							{
								result = $sb(divs[i].id)[action](isVolumeForAds =="true", isVolumeForContent=="true", false);
							}else result = $sb(divs[i].id)[action]();
							if(reaction != "undefined")
							{
								e.source.postMessage("InView|"+reaction+"|"+result, "*");	
							}	
						}
						 
						return;	
					}
					
				}
			}
	
		}else if(e.data.indexOf("sb_controls") != -1)
		{
			var msg = e.data.split("|");
			
			var id = msg[1];
			
			var shouldHide = msg[2]=="true";
			var divs = document.getElementsByTagName("*");

			for (var i = 0; i < divs.length; i++) {
				if(divs[i].className && divs[i].className == "videoPlayer" && divs[i].id && divs[i].id.toString().indexOf(id) != -1)
				{
					if($sb(divs[i].id))
					{
						
						$sb(divs[i].id).hideControls(shouldHide);
						return;
					}
				}
			}
		}else if(e.data == 'Closed') {
			//Expandable closed, called from expandable, show animated snapshot again
			var videoElement = document.getElementById('cpvImage');
			
			//syndicatedImage
			if(document.getElementById('caption_title')) {
				document.getElementById('caption_details').style.display = 'block';
				document.getElementById('caption_title').style.display = 'block';
				document.getElementById('play_caption').style.display = 'block';
				if(document.getElementById('play_caption_alpha')) {
					document.getElementById('caption_description').style.display = 'block';
					document.getElementById('play_caption_alpha').style.display = 'block';
					document.getElementById('facebook_alpha').style.display = 'block';
					document.getElementById('facebook_over').style.display = 'block';
					document.getElementById('twitter_alpha').style.display = 'block';
					document.getElementById('twitter_over').style.display = 'block';
				}
				
				if(videoElement) {
					videoElement.style.display = 'block';
					videoElement.play();
				} else {
					videoElement = document.getElementById('syndicatedImage');
					videoElement.style.display = 'block';
					videoElement.play();
					document.getElementById('splashPanel').style.display = 'block';
				}
				
			} else {
				
				if(videoElement) {
					videoElement.style.display = 'block';
				} else {
					videoElement = document.getElementById('syndicatedImage');
					videoElement.style.display = 'block';
					document.getElementById('splashPanel').style.display = 'block';
				}
			}
			
			
		} else if( e.data.indexOf("OverrideAdTagUrl") != -1 ) {
			
			var msg = e.data.split("|");
			var adTagUrl = msg[1];
			
			$sbPlayer().overrideAdTagUrl( adTagUrl );
		} else if( e.data.indexOf("autoPlayinView") != -1) {
			//PLay video, no need for id, since we are in iframe
			$sbPlayer().getActiveConfig().clip.autoPlayInView = false;
			if( $sbPlayer().getActiveConfig().showCanvas ) {
				if( $sbPlayer().getLoaded() ) {
					$sbPlayer().getVideoElement().play();
				}
			} else {
				$sbPlayer().play();
			}
			
		}
    //}
}
    // we have to listen for 'message'
if (window['addEventListener']) {
	window.addEventListener('message', respondToSizingMessage, false);
} else {
    window.attachEvent('onmessage', respondToSizingMessage);
}