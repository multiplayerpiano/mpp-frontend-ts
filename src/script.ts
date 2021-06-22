import * as $ from 'jquery';
import { EventEmitter } from "events";
import { Client, InMessageM, Participant, ChannelSettings, ChatMessage } from "./Client/Client";
import { Knob, mixin } from "./util";
import { Color } from "./Color";
import "./ebsprite.js";
import { NoteQuota } from "./NoteQuota";




interface MIDIPort {
	id: string;
	manufacturer ? : string;
	name ? : string;
	type: string;
	version ? : string;
	state: string;
	connection: string;
	onstatechange: Function;
};

/*interface MIDIConnectionEvent {
	port: MIDIPort;
};*/

$(function() {
	let test_mode = window.location.hash && window.location.hash.match(/^(?:#.+)*#test(?:#.+)*$/i);
	let gSeeOwnCursor = window.location.hash && window.location.hash.match(/^(?:#.+)*#seeowncursor(?:#.+)*$/i);
	let gMidiVolumeTest = window.location.hash && window.location.hash.match(/^(?:#.+)*#midivolumetest(?:#.+)*$/i);
	let gMidiOutTest: (note_name: string, vel: number, delay_ms: number) => void;

	let DEFAULT_VELOCITY = 0.5;
	let TIMING_TARGET = 1000;


	

	

	let translation = new Translation();
	translation.perform();















	

	

	

	


	
	
	
	

	let gPiano = new Piano(document.getElementById("piano")!);

	let gSoundSelector = new SoundSelector(gPiano);
	gSoundSelector.addPacks(["/sounds/Emotional_2.0/", "/sounds/Harp/", "/sounds/Music_Box/", "/sounds/Vintage_Upright/", "/sounds/Steinway_Grand/", "/sounds/Emotional/", "/sounds/Untitled/"]);
	gSoundSelector.init();







	






	
	

	


	


	import { ClientManager } from "./ClientManager";
	let clientManager = new ClientManager();

	

	
	$(document).on("mousemove", event => { //! ANCHOR - Changed from .mousemove() to .on('mousemove') - Hri7566
		mx = parseFloat(((event.pageX / $(window).width()!) * 100).toFixed(2));
		my = parseFloat(((event.pageY / $(window).height()!) * 100).toFixed(2));
	});

	


	

	/*function eb() {
		if(gClient.channel && gClient.channel._id.toLowerCase() === "test/fishing") {
			ebsprite.start(gClient);
		} else {
			ebsprite.stop();
		}
	}
	if(ebsprite) {
		gClient.on("ch", eb);
		eb();
	}*/

	





	let gPianoMutes = (localStorage.pianoMutes ? localStorage.pianoMutes as string : "").split(',').filter(v => v);
	let gChatMutes = (localStorage.pianoMutes ? localStorage.pianoMutes as string : "").split(',').filter(v => v);


















	let volume_slider = document.getElementById("volume-slider") as HTMLInputElement;
	volume_slider.value = String(gPiano.audio.volume);
	$("#volume-label").text("Volume: " + Math.floor(gPiano.audio.volume * 100) + "%");
	volume_slider.addEventListener("input", function(evt) {
		let v = +volume_slider.value;
		gPiano.audio.setVolume(v);
		if (window.localStorage) localStorage.volume = v;
		$("#volume-label").text("Volume: " + Math.floor(v * 100) + "%");
	});
	
	

	

	captureKeyboard();






	// NoteQuota
	let gNoteQuota = (function() {
		let last_rat = 0;
		let nqjq = $("#quota .value");
		setInterval(function () {
			gNoteQuota.tick();
		}, 2000);
		return new NoteQuota(function(points) {
			// update UI
			let rat = (points / this.max) * 100;
			if (rat <= last_rat)
				nqjq.stop(true, true).css("width", rat.toFixed(0) + "%");
			else
				nqjq.stop(true, true).animate({
					"width": rat.toFixed(0) + "%"
				}, 2000, "linear");
			last_rat = rat;
		});
	})();
	gClient.on("nq", function(nq_params) {
		gNoteQuota.setParams(nq_params);
	});
	gClient.on("disconnect", function() {
		gNoteQuota.setParams(NoteQuota.PARAMS_OFFLINE);
	});



	// click participant names
	(function () {
		let ele = document.getElementById("names")!;
		function touchhandler(e: MouseEvent | TouchEvent) {
			let target_jq = $(e.target!);
			if (target_jq.hasClass("name")) {
				target_jq.addClass("play");
				if ((e.target as any).participantId == gClient.participantId) {
					openModal("#rename", "input[name=name]");
					setTimeout(function () {
						$("#rename input[name=name]").val(gClient.ppl[gClient.participantId!].name!);
						$("#rename input[name=color]").val(gClient.ppl[gClient.participantId!].color!);
					}, 100);
				} else if ((e.target as any).participantId) {
					let id = (e.target as any).participantId;
					let part = gClient.ppl[id] || null;
					if (part) {
						participantMenu(part);
						e.stopPropagation();
					}
				}
			}
		}
		ele.addEventListener("mousedown", touchhandler);
		ele.addEventListener("touchstart", touchhandler);
		function releasehandler(e: MouseEvent | TouchEvent) {
			$("#names .name").removeClass("play");
		}
		document.body.addEventListener("mouseup", releasehandler);
		document.body.addEventListener("touchend", releasehandler);

		function removeParticipantMenus() {
			$(".participant-menu").remove();
			$(".participantSpotlight").hide();
			document.removeEventListener("mousedown", removeParticipantMenus);
			document.removeEventListener("touchstart", removeParticipantMenus);
		};

		function participantMenu(part: Participant) {
			if (!part) return;
			removeParticipantMenus();
			document.addEventListener("mousedown", removeParticipantMenus);
			document.addEventListener("touchstart", removeParticipantMenus);
			$("#" + part.id).find(".enemySpotlight").show();
			let menu = $('<div class="participant-menu"></div>');
			$("body").append(menu);
			// move menu to name position
			let jq_nd = $(part.nameDiv!);
			let pos = jq_nd.position();
			menu.css({
				"top": pos.top + jq_nd.height()! + 15,
				"left": pos.left + 6,
				"background": part.color || "black"
			});
			menu.on("mousedown touchstart", function(evt) {
				evt.stopPropagation();
				let target = $(evt.target);
				if (target.hasClass("menu-item")) {
					target.addClass("clicked");
					menu.fadeOut(200, function() {
						removeParticipantMenus();
					});
				}
			});
			// this spaces stuff out but also can be used for informational
			$('<div class="info"></div>').appendTo(menu).text(part._id!);
			// add menu items
			if (gPianoMutes.indexOf(part._id!) == -1) {
				$('<div class="menu-item">Mute Notes</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						gPianoMutes.push(part._id!);
						if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
						$(part.nameDiv!).addClass("muted-notes");
					});
			} else {
				$('<div class="menu-item">Unmute Notes</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						let i;
						while ((i = gPianoMutes.indexOf(part._id!)) != -1)
							gPianoMutes.splice(i, 1);
						if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
						$(part.nameDiv!).removeClass("muted-notes");
					});
			}
			if (gChatMutes.indexOf(part._id!) == -1) {
				$('<div class="menu-item">Mute Chat</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						gChatMutes.push(part._id!);
						if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
						$(part.nameDiv!).addClass("muted-chat");
					});
			} else {
				$('<div class="menu-item">Unmute Chat</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						let i;
						while ((i = gChatMutes.indexOf(part._id!)) != -1)
							gChatMutes.splice(i, 1);
						if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
						$(part.nameDiv!).removeClass("muted-chat");
					});
			}
			if (!(gPianoMutes.indexOf(part._id!) >= 0) || !(gChatMutes.indexOf(part._id!) >= 0)) {
				$('<div class="menu-item">Mute Completely</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						gPianoMutes.push(part._id!);
						if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
						gChatMutes.push(part._id!);
						if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
						$(part.nameDiv!).addClass("muted-notes");
						$(part.nameDiv!).addClass("muted-chat");
					});
			}
			if ((gPianoMutes.indexOf(part._id!) >= 0) || (gChatMutes.indexOf(part._id!) >= 0)) {
				$('<div class="menu-item">Unmute Completely</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						let i;
						while ((i = gPianoMutes.indexOf(part._id!)) != -1)
							gPianoMutes.splice(i, 1);
						while ((i = gChatMutes.indexOf(part._id!)) != -1)
							gChatMutes.splice(i, 1);
						if (localStorage) localStorage.pianoMutes = gPianoMutes.join(',');
						if (localStorage) localStorage.chatMutes = gChatMutes.join(',');
						$(part.nameDiv!).removeClass("muted-notes");
						$(part.nameDiv!).removeClass("muted-chat");
					});
			}
			if (gClient.isOwner()) {
				$('<div class="menu-item give-crown">Give Crown</div>').appendTo(menu)
					.on("mousedown touchstart", function(evt) {
						if (confirm("Give room ownership to " + part.name + "?"))
							gClient.sendArray([{
								m: "chown",
								id: part.id
							}]);
					});
				$('<div class="menu-item kickban">Kickban</div>').appendTo(menu)
					.on("mousedown touchstart", function (evt) {
						let minutesRaw = prompt("How many minutes? (0-60)", "30");
						if (minutesRaw === null) return;
						let minutes = parseFloat(minutesRaw) || 0;
						let ms = minutes * 60 * 1000;
						gClient.sendArray([{
							m: "kickban",
							_id: part._id!,
							ms: ms
						}]);
					});
			}
			menu.fadeIn(100);
		}
	})();
















	

	




	// warn user about loud noises before starting sound (no autoplay)
	openModal("#sound-warning");
	function user_interact(evt: MouseEvent) {
		document.removeEventListener("click", user_interact);
		closeModal();
		MPP.piano.audio.resume();
	}
	document.addEventListener("click", user_interact);













	// New room, change room

	////////////////////////////////////////////////////////////////

	$("#room > .info").text("--");
	gClient.on("ch", function(msg) {
		let channel = msg.ch;
		let info = $("#room > .info");
		info.text(channel._id);
		if (channel.settings.lobby) info.addClass("lobby");
		else info.removeClass("lobby");
		if (!channel.settings.chat) info.addClass("no-chat");
		else info.removeClass("no-chat");
		if (channel.settings.crownsolo) info.addClass("crownsolo");
		else info.removeClass("crownsolo");
		if (channel.settings['no cussing']) info.addClass("no-cussing");
		else info.removeClass("no-cussing");
		if (!channel.settings.visible) info.addClass("not-visible");
		else info.removeClass("not-visible");
	});
	gClient.on("ls", function(ls) {
		for (let i in ls.u) {
			if (!ls.u.hasOwnProperty(i)) continue;
			let room = ls.u[i];
			let info = $("#room .info[roomname=\"" + (room._id + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0') + "\"]");
			if (info.length === 0) {
				info = $("<div class=\"info\"></div>");
				info.attr("roomname", room._id);
				$("#room .more").append(info);
			}
			info.text(room._id + " (" + room.count + ")");
			if (room.settings.lobby) info.addClass("lobby");
			else info.removeClass("lobby");
			if (!room.settings.chat) info.addClass("no-chat");
			else info.removeClass("no-chat");
			if (room.settings.crownsolo) info.addClass("crownsolo");
			else info.removeClass("crownsolo");
			if (room.settings['no cussing']) info.addClass("no-cussing");
			else info.removeClass("no-cussing");
			if (!room.settings.visible) info.addClass("not-visible");
			else info.removeClass("not-visible");
			if (room.banned) info.addClass("banned");
			else info.removeClass("banned");
		}
	});
	$("#room").on("click", function(evt) {
		evt.stopPropagation();

		// clicks on a new room
		if ($(evt.target).hasClass("info") && $(evt.target).parents(".more").length) {
			$("#room .more").fadeOut(250);
			let selected_name = $(evt.target).attr("roomname");
			if (typeof selected_name !== "undefined") {
				changeRoom(selected_name, "right");
			}
			return false;
		}
		// clicks on "New Room..."
		else if ($(evt.target).hasClass("new")) {
			openModal("#new-room", "input[name=name]");
		}
		// all other clicks
		function doc_click(evt: JQuery.MouseDownEvent) {
			if ($(evt.target).is("#room .more")) return;
			$(document).off("mousedown", doc_click);
			$("#room .more").fadeOut(250);
			gClient.sendArray([{
				m: "-ls"
			}]);
		}
		$(document).on("mousedown", doc_click);
		$("#room .more .info").remove();
		$("#room .more").show();
		gClient.sendArray([{
			m: "+ls"
		}]);
	});
	$("#new-room-btn").on("click", function(evt) {
		evt.stopPropagation();
		openModal("#new-room", "input[name=name]");
	});


	$("#play-alone-btn").on("click", function(evt) {
		evt.stopPropagation();
		let room_name = "Room" + Math.floor(Math.random() * 1000000000000);
		changeRoom(room_name, "right", {
			"visible": false
		});
		setTimeout(function() {
			new Notification({
				id: "share",
				title: "Playing alone",
				html: 'You are playing alone in a room by yourself, but you can always invite \
				friends by sending them the link.<br/><br/>\
				<a href="#" onclick="window.open(\'https://www.facebook.com/sharer/sharer.php?u=\'+encodeURIComponent(location.href),\'facebook-share-dialog\',\'width=626,height=436\');return false;">Share on Facebook</a><br/><br/>\
				<a href="http://twitter.com/home?status=' + encodeURIComponent(location.href) + '" target="_blank">Tweet</a>',
				duration: 25000
			});
		}, 1000);
	});



	let gModal: string | null;

	function modalHandleEsc(evt: JQuery.KeyDownEvent) {
		if (evt.keyCode == 27) {
			closeModal();
			evt.preventDefault();
			evt.stopPropagation();
		}
	}

	function openModal(selector: string, focus?: string) {
		if (chat) chat.blur();
		releaseKeyboard();
		$(document).on("keydown", modalHandleEsc);
		$("#modal #modals > *").hide();
		$("#modal").fadeIn(250);
		$(selector).show();
		setTimeout(function () {
			$(selector).find(focus as any).focus();
		}, 100);
		gModal = selector;
	}

	function closeModal() {
		$(document).off("keydown", modalHandleEsc);
		$("#modal").fadeOut(100);
		$("#modal #modals > *").hide();
		captureKeyboard();
		gModal = null;
	}

	let modal_bg = $("#modal .bg")[0];
	$(modal_bg).on("click", function(evt) {
		if (evt.target !== modal_bg) return;
		closeModal();
	});

	(function () {
		function submit() {
			let name = $("#new-room .text[name=name]").val() as string;
			let settings = {
				visible: $("#new-room .checkbox[name=visible]").is(":checked"),
				chat: true
			};
			$("#new-room .text[name=name]").val("");
			closeModal();
			changeRoom(name, "right", settings);
			setTimeout(function() {
				new Notification({
					id: "share",
					title: "Created a Room",
					html: 'You can invite friends to your room by sending them the link.<br/><br/>\
				<a href="#" onclick="window.open(\'https://www.facebook.com/sharer/sharer.php?u=\'+encodeURIComponent(location.href),\'facebook-share-dialog\',\'width=626,height=436\');return false;">Share on Facebook</a><br/><br/>\
				<a href="http://web.archive.org/web/20200825094242/http://twitter.com/home?status=' + encodeURIComponent(location.href) + '" target="_blank">Tweet</a>',
					duration: 25000
				});
			}, 1000);
		}
		$("#new-room .submit").click(function(evt) {
			submit();
		});
		$("#new-room .text[name=name]").keypress(function(evt) {
			if (evt.keyCode == 13) {
				submit();
			} else if (evt.keyCode == 27) {
				closeModal();
			} else {
				return;
			}
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		});
	})();








	function changeRoom(name: string, direction: string = "right", settings: ChannelSettings = {}, push: boolean = true) {
		let opposite = direction == "left" ? "right" : "left";

		if (name === "") name = "lobby";
		if (gClient.channel && gClient.channel._id === name) return;
		if (push) {
			let url = "/" + encodeURIComponent(name).replace("'", "%27");
			if (window.history && history.pushState) {
				history.pushState({
					"depth": gHistoryDepth += 1,
					"name": name
				}, "Piano > " + name, url);
			} else {
				window.location.href = url;
				return;
			}
		}

		gClient.setChannel(name, settings);

		let t = 0,
			d = 100;
		$("#piano").addClass("ease-out").addClass("slide-" + opposite);
		setTimeout(function() {
			$("#piano").removeClass("ease-out").removeClass("slide-" + opposite).addClass("slide-" + direction);
		}, t += d);
		setTimeout(function() {
			$("#piano").addClass("ease-in").removeClass("slide-" + direction);
		}, t += d);
		setTimeout(function() {
			$("#piano").removeClass("ease-in");
		}, t += d);
	};

	let gHistoryDepth = 0;
	$(window).on("popstate", function(evt) {
		let depth = (evt as any).state ? (evt as any).state.depth : 0;
		if (depth === gHistoryDepth) return; // <-- forgot why I did that though...

		let direction = depth <= gHistoryDepth ? "left" : "right";
		gHistoryDepth = depth;

		let name = decodeURIComponent(window.location.pathname);
		if (name.substr(0, 1) == "/") name = name.substr(1);
		changeRoom(name, direction, undefined, false);
	});

	// Rename

	////////////////////////////////////////////////////////////////

	(function () {
		function submit() {
			let set = {
				name: $("#rename input[name=name]").val() as string,
				color: $("#rename input[name=color]").val() as string
			};
			//$("#rename .text[name=name]").val("");
			closeModal();
			gClient.sendArray([{
				m: "userset",
				set: set
			}]);
		}
		$("#rename .submit").click(function(evt) {
			submit();
		});
		$("#rename .text[name=name]").keypress(function(evt) {
			if (evt.keyCode === 13) {
				submit();
			} else if (evt.keyCode === 27) {
				closeModal();
			} else {
				return;
			}
			evt.preventDefault();
			evt.stopPropagation();
			return false;
		});
	})();















	// chatctor

	////////////////////////////////////////////////////////////////

	let chat = (function () {
		gClient.on("ch", function(msg) {
			if (msg.ch.settings.chat) {
				chat.show();
			} else {
				chat.hide();
			}
		});
		gClient.on("disconnect", function(msg) {

		});
		gClient.on("c", function(msg) {
			chat.clear();
			if (msg.c) {
				for (let i = 0; i < msg.c.length; i++) {
					chat.receive(msg.c[i]);
				}
			}
		});
		gClient.on("a", function(msg) {
			chat.receive(msg);
		});

		$("#chat input").on("focus", function(evt) {
			releaseKeyboard();
			$("#chat").addClass("chatting");
			chat.scrollToBottom();
		});
		/*$("#chat input").on("blur", function(evt) {
			captureKeyboard();
			$("#chat").removeClass("chatting");
			chat.scrollToBottom();
		});*/
		$(document).mousedown(function(evt) {
			if (!($("#chat").has(evt.target as unknown as Element).length > 0)) {
				chat.blur();
			}
		});
		document.addEventListener("touchstart", function (event) {
			for (let i in event.changedTouches) {
				let touch = event.changedTouches[i];
				if (!($("#chat").has(touch.target as unknown as Element).length > 0)) {
					chat.blur();
				}
			}
		});
		$(document).on("keydown", function(evt) { // TODO keycode deprecations - Hri7566
			if ($("#chat").hasClass("chatting")) {
				if (evt.keyCode === 27) {
					chat.blur();
					evt.preventDefault();
					evt.stopPropagation();
				} else if (evt.keyCode === 13) {
					$("#chat input").focus();
				}
			} else if (!gModal && (evt.keyCode === 27 || evt.keyCode === 13)) {
				$("#chat input").focus();
			}
		});
		$("#chat input").on("keydown", function(evt) {
			if (evt.keyCode === 13) {
				if (MPP.client.isConnected()) {
					let message = $(this).val() as string;
					if (message.length === 0) {
						setTimeout(function() {
							chat.blur();
						}, 100);
					} else if (message.length <= 512) {
						chat.send(message);
						$(this).val("");
						setTimeout(function() {
							chat.blur();
						}, 100);
					}
				}
				evt.preventDefault();
				evt.stopPropagation();
			} else if (evt.keyCode === 27) {
				chat.blur();
				evt.preventDefault();
				evt.stopPropagation();
			} else if (evt.keyCode === 9) {
				evt.preventDefault();
				evt.stopPropagation();
			}
		});

		return {
			show: function() {
				$("#chat").fadeIn();
			},
			hide: function() {
				$("#chat").fadeOut();
			},
			clear: function() {
				$("#chat li").remove();
			},
			scrollToBottom: function() {
				let ele = $("#chat ul").get(0);
				ele.scrollTop = ele.scrollHeight - ele.clientHeight;
			},
			blur: function() {
				if ($("#chat").hasClass("chatting")) {
					$("#chat input").get(0).blur();
					$("#chat").removeClass("chatting");
					chat.scrollToBottom();
					captureKeyboard();
				}
			},
			send: function(message: string) {
				gClient.sendArray([{
					m: "a",
					message: message
				}]);
			},
			receive: function(msg: ChatMessage) {
				if (gChatMutes.indexOf(msg.p._id!) != -1) return;

				let li = $('<li><span class="name"/><span class="message"/>');

				li.find(".name").text(msg.p.name + ":");
				li.find(".message").text(msg.a);
				li.css("color", msg.p.color || "white");

				$("#chat ul").append(li);

				let eles = $("#chat ul li").get() as HTMLElement[];
				for (let i = 1; i <= 50 && i <= eles.length; i++) {
					eles[eles.length - i].style.opacity = String(1.0 - (i * 0.03));
				}
				if (eles.length > 50) {
					eles[0].style.display = "none";
				}
				if (eles.length > 256) {
					$(eles[0]).remove();
				}

				// scroll to bottom if not "chatting" or if not scrolled up
				if (!$("#chat").hasClass("chatting")) {
					chat.scrollToBottom();
				} else {
					let ele = $("#chat ul").get(0);
					if (ele.scrollTop > ele.scrollHeight - ele.offsetHeight - 50)
						chat.scrollToBottom();
				}
			}
		};
	})();















	gClient.on("connect", sendDevices);














	






	// API
	let MPP = {
		press: press,
		release: release,
		pressSustain: pressSustain,
		releaseSustain: releaseSustain,
		piano: gPiano,
		client: gClient,
		chat: chat,
		noteQuota: gNoteQuota,
		soundSelector: gSoundSelector,
		Notification: Notification
	};
	(window as any).MPP = MPP;










	


// misc

////////////////////////////////////////////////////////////////

// analytics
var _gaq: any = _gaq || [];
_gaq.push(['_setAccount', 'UA-882009-7']);
_gaq.push(['_trackPageview']);
_gaq.push(['_setAllowAnchor', true]);
(function () {
	var ga = document.createElement('script');
	ga.type = 'text/javascript';
	ga.async = true;
	ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode!.insertBefore(ga, s);
})();
/*
// twitter
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;
	js.src="//web.archive.org/web/20200825094242/https://platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
*/
// fb
/*
(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//web.archive.org/web/20200825094242/https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v2.8";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
*/

// non-ad-free experience
/*(function() {
	function adsOn() {
		if(window.localStorage) {
			var div = document.querySelector("#inclinations");
			div.innerHTML = "Ads:<br>ON / <a id=\"adsoff\" href=\"#\">OFF</a>";
			div.querySelector("#adsoff").addEventListener("click", adsOff);
			localStorage.ads = true;
		}
		// adsterra
		var script = document.createElement("script");
		script.src = "//web.archive.org/web/20200825094242/https://pl132070.puhtml.com/68/7a/97/687a978dd26d579c788cb41e352f5a41.js";
		document.head.appendChild(script);
	}

	function adsOff() {
		if(window.localStorage) localStorage.ads = false;
		document.location.reload(true);
	}

	function noAds() {
		var div = document.querySelector("#inclinations");
		div.innerHTML = "Ads:<br><a id=\"adson\" href=\"#\">ON</a> / OFF";
		div.querySelector("#adson").addEventListener("click", adsOn);
	}

	if(window.localStorage) {
		if(localStorage.ads === undefined || localStorage.ads === "true")
			adsOn();
		else
			noAds();
	} else {
		adsOn();
	}
})();*/