// bug supply

////////////////////////////////////////////////////////////////

export class BugSupply {
  constructor() {
    (window as any).onerror = function(message: string, url: string, line: string) {
      url = url || "(no url)";
      line = line || "(no line)";
      // errors in socket.io
      if(url.indexOf("socket.io.js") !== -1) {
        if(message.indexOf("INVALID_STATE_ERR") !== -1) return;
        if(message.indexOf("InvalidStateError") !== -1) return;
        if(message.indexOf("DOM Exception 11") !== -1) return;
        if(message.indexOf("Property 'open' of object #<c> is not a function") !== -1) return;
        if(message.indexOf("Cannot call method 'close' of undefined") !== -1) return;
        if(message.indexOf("Cannot call method 'close' of null") !== -1) return;
        if(message.indexOf("Cannot call method 'onClose' of null") !== -1) return;
        if(message.indexOf("Cannot call method 'payload' of null") !== -1) return;
        if(message.indexOf("Unable to get value of the property 'close'") !== -1) return;
        if(message.indexOf("NS_ERROR_NOT_CONNECTED") !== -1) return;
        if(message.indexOf("Unable to get property 'close' of undefined or null reference") !== -1) return;
        if(message.indexOf("Unable to get value of the property 'close': object is null or undefined") !== -1) return;
        if(message.indexOf("this.transport is null") !== -1) return;
      }
      // errors in soundmanager2
      if(url.indexOf("soundmanager2.js") !== -1) {
        // operation disabled in safe mode?
        if(message.indexOf("Could not complete the operation due to error c00d36ef") !== -1) return;
        if(message.indexOf("_s.o._setVolume is not a function") !== -1) return;
      }
      // errors in midibridge
      if(url.indexOf("midibridge") !== -1) {
        if(message.indexOf("Error calling method on NPObject") !== -1) return;
      }
      // too many failing extensions injected in my html
      if(url.indexOf(".js") !== url.length - 3) return;
      // extensions inject cross-domain embeds too
      if(url.toLowerCase().indexOf("multiplayerpiano.com") == -1) return;
    
      // errors in my code
      if(url.indexOf("script.js") !== -1) {
        if(message.indexOf("Object [object Object] has no method 'on'") !== -1) return;
        if(message.indexOf("Object [object Object] has no method 'off'") !== -1) return;
        if(message.indexOf("Property '$' of object [object Object] is not a function") !== -1) return;
      }
    
      var enc = "/bugreport/"
        + (message ? encodeURIComponent(message) : "") + "/"
        + (url ? encodeURIComponent(url) : "") + "/"
        + (line ? encodeURIComponent(line) : "");
      var img = new Image();
      img.src = enc;
    };
  }
}