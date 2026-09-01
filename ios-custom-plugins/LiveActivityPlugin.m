#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(LiveActivityPlugin, "LiveActivityPlugin",
    CAP_PLUGIN_METHOD(downloadAndOpenIPA, CAPPluginReturnPromise);
)
