import Cocoa
import Foundation
import ApplicationServices

// Check accessibility without prompting (main Electron app handles user prompt)
let options: NSDictionary = [kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String: false]
let isTrusted = AXIsProcessTrustedWithOptions(options)

if !isTrusted {
    print("ACCESSIBILITY_REQUIRED")
    fflush(stdout)
}

class AppDelegate: NSObject, NSApplicationDelegate {
    var lastCmdTime: TimeInterval = 0
    var cmdWasDown: Bool = false
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        print("LISTENER_READY")
        fflush(stdout)
        
        NSEvent.addGlobalMonitorForEvents(matching: .flagsChanged) { [weak self] event in
            guard let self = self else { return }
            let isCommand = event.modifierFlags.contains(.command)
            
            if isCommand && !self.cmdWasDown {
                // Command key just pressed down
                self.cmdWasDown = true
                let now = Date().timeIntervalSince1970
                let delta = now - self.lastCmdTime
                
                if delta > 0.05 && delta < 0.38 {
                    // Double Command Tap detected!
                    print("CMD_DOUBLE_TAP")
                    fflush(stdout)
                    self.lastCmdTime = 0
                } else {
                    self.lastCmdTime = now
                }
            } else if !isCommand && self.cmdWasDown {
                // Command key released
                self.cmdWasDown = false
            }
        }
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
